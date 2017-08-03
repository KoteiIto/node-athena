'use strict'

const apiVersion = '2017-05-18'
let athena

class Request {
    startQuery(query, config) {
        return new Promise((resolve, reject) => {
            let retryCount = 0
            let params = {
                QueryString: query,
                ResultConfiguration: {
                    OutputLocation: config.bucketUri,
                },
            }
            let loopFunc = () => {
                athena.startQueryExecution(params, (err, data) => {
                    if (err && isThrottlingException(err) && canRetry(retryCount, config)) {
                        let wait = Math.pow(config.baseRetryWait, retryCount++)
                        return setTimeout(loopFunc, wait)
                    } else if (err) {
                        return reject(err)
                    }
                    return resolve(data.QueryExecutionId)
                })
            }
            loopFunc()
        })
    }

    checkQuery(queryId, config) {
        return new Promise((resolve, reject) => {
            let retryCount = 0
            let params = {
                QueryExecutionId: queryId,
            }
            let loopFunc = () => {
                athena.getQueryExecution(params, (err, data) => {
                    if (err && isThrottlingException(err) && canRetry(retryCount, config)) {
                        let wait = Math.pow(config.baseRetryWait, retryCount++)
                        return setTimeout(loopFunc, wait)
                    } else if (err) {
                        return reject(err)
                    }
                    let state = data.QueryExecution.Status.State
                    let isEnd, error
                    switch (state) {
                        case 'QUEUED':
                        case 'RUNNING':
                            isEnd = false
                            break
                        case 'SUCCEEDED':
                            isEnd = true
                            break
                        case 'FAILED':
                            isEnd = false
                            error = new Error('query failed')
                            break
                        case 'CANCELLED':
                            isEnd = false
                            error = new Error('query cancelled')
                            break
                        default:
                            isEnd = false
                            error = new Error(`unknown query state ${state}`)
                    }
                    if (error) return reject(error)
                    if (isEnd) return resolve(true)
                    return resolve(false)
                })
            }
            loopFunc()
        })
    }

    stopQuery(queryId, config) {
        return new Promise((resolve, reject) => {
            let retryCount = 0
            let params = {
                QueryExecutionId: queryId,
            }
            let loopFunc = () => {
                athena.stopQueryExecution(params, (err, data) => {
                    if (err && isThrottlingException(err) && canRetry(retryCount, config)) {
                        let wait = Math.pow(config.baseRetryWait, retryCount++)
                        return setTimeout(loopFunc, wait)
                    } else if (err) {
                        return reject(err)
                    }
                    return resolve(data)
                })
            }
            loopFunc()
        })
    }

    getQueryResults(queryId, config, retryCount) {
        return new Promise((resolve, reject) => {
            let retryCount = 0
            let params = {
                QueryExecutionId: queryId,
            }
            let loopFunc = () => {
                athena.getQueryResults(params, (err, data) => {
                    if (err && isThrottlingException(err) && canRetry(retryCount, config)) {
                        let wait = Math.pow(config.baseRetryWait, retryCount++)
                        return setTimeout(loopFunc, wait)
                    } else if (err) {
                        return reject(err)
                    }
                    return resolve(data)
                })
            }
            loopFunc()
        })
    }
}

function isThrottlingException(err) {
    return err.code == "ThrottlingException"
}

function canRetry(retryCount, config) {
    return retryCount < config.retryCountMax
}

exports.create = athena_ => {
    athena = athena_
    return new Request()
}