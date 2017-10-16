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
                    OutputLocation: config.bucketMetadataUri || config.bucketUri
                },
            }
            let loopFunc = () => {
                athena.startQueryExecution(params, (err, data) => {
                    if (err && isRetryException(err) && canRetry(retryCount, config)) {
                        let wait = config.baseRetryWait * Math.pow(2, retryCount++)
                        wait = Math.min(wait, config.retryWaitMax)
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
                    if (err && isRetryException(err) && canRetry(retryCount, config)) {
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
                            let errMsg = (data.QueryExecution && data.QueryExecution.Status && data.QueryExecution.Status.StateChangeReason) || 'FAILED: Execution Error'
                            error = new Error(errMsg)
                            break
                        case 'CANCELLED':
                            isEnd = false
                            error = new Error('FAILED: Query CANCELLED')
                            break
                        default:
                            isEnd = false
                            error = new Error(`FAILED: UnKnown State ${state}`)
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
                    if (err && isRetryException(err) && canRetry(retryCount, config)) {
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

    getQueryResults(queryId, config, nextToken) {
        return new Promise((resolve, reject) => {
            let retryCount = 0
            let params = {
                QueryExecutionId: queryId,
            }
            if (nextToken) {
                params.NextToken = nextToken
            }
            let loopFunc = () => {
                athena.getQueryResults(params, (err, data) => {
                    if (err && isRetryException(err) && canRetry(retryCount, config)) {
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

function isRetryException(err) {
    return err.code == "ThrottlingException"
        || err.code == "TooManyRequestsException"
        || err.message == "Query exhausted resources at this scale factor"
}

function canRetry(retryCount, config) {
    return retryCount < config.retryCountMax
}

exports.create = athena_ => {
    athena = athena_
    return new Request()
}