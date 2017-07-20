'use strict'

const apiVersion = '2017-05-18'

let athena

class Request {
    startQuery(query, config) {
        return new Promise((resolve, reject) => {
            config = config || {}
            let params = {
                QueryString: query,
                ResultConfiguration: {
                    OutputLocation: config.bucketUri,
                },
            }
            athena.startQueryExecution(params, (err, data) => {
                if (err) return reject(err)
                return resolve(data.QueryExecutionId)
            })
        })
    }

    checkQuery(queryId, config) {
        return new Promise((resolve, reject) => {
            config = config || {}
            let params = {
                QueryExecutionId: queryId,
            }
            athena.getQueryExecution(params, (err, data) => {
                if (err) return reject(err)

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
        })
    }

    stopQuery(queryId, config) {
        return new Promise((resolve, reject) => {
            config = config || {}
            let params = {
                QueryExecutionId: queryId,
            }
            athena.stopQueryExecution(params, (err, data) => {
                if (err) return reject(err)
                return resolve(data)
            })
        })
    }

    getQueryResults(queryId, config) {
        return new Promise((resolve, reject) => {
            config = config || {}
            let params = {
                QueryExecutionId: queryId,
            }
            athena.getQueryResults(params, (err, data) => {
                if (err) return reject(err)
                return resolve(data)
            })
        })
    }
}

exports.create = athena_ => {
    athena = athena_
    return new Request()
}