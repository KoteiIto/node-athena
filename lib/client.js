'use strict'

const co = require('co')

let request
let config = {
    bucketUri: '',
    pollingInterval: 1000,
    queryTimeout: 0,
    format: 'array',
    baseRetryWait: 200,
    retryCountMax: 10,
    retryWaitMax: 10000,
    concurrentExecMax: 5,
    execRightCheckInterval: 100,
}

class Client {
    constructor(config_) {
        checkConfig(config_)
        this.config = Object.assign({}, config, config_)
        this.initExecRights()
    }

    initExecRights() {
        let rights = []
        for (let i = 0; i < this.config.concurrentExecMax; i++) {
            rights.push({})
        }
        this.execRights = rights
    }

    getExecRight() {
        return this.execRights.pop()
    }

    setExecRight(newRight) {
        if (this.execRights.length < this.config.concurrentExecMax) {
            this.execRights.push(newRight)
        }
    }

    execute(query, options, callback) {
        let toPromiseTimer
        const promise = new Promise((resolve, reject) => {
            if (typeof (options) == 'function') {
                callback = options
                options = undefined
            }
            if (options) {
                if (callback) {
                    console.log('[WARN] The function "execute(query, options, callback)" will be unusable in the next major version update. Please use "execute(query, callback)".')
                } else {
                    console.log('[WARN] The function "execute(query, options)" will be unusable in the next major version update. Please use "execute(query).toPromise()".')
                }
            }

            options = options || {}
            let nowConfig = Object.assign({}, this.config)
            let self = this
            let right = self.getExecRight()
            co(function* () {
                // limit the number of concurrent executions
                while (right === undefined) {
                    yield sleep(nowConfig.execRightCheckInterval)
                    right = self.getExecRight()
                }
                let queryId = yield request.startQuery(query, nowConfig)
                let timeout = options.timeout || nowConfig.queryTimeout
                let isTimeout = false
                let timer
                if (timeout) {
                    timer = setTimeout(function timeoutFunc() {
                        isTimeout = true
                        self.setExecRight(right)
                        request.stopQuery(queryId, nowConfig).then(() => {
                            let err = new Error('query timeout')
                            return handleError(err, resolve, reject, callback)
                        }).catch(err => {
                            return handleError(err, resolve, reject, callback)
                        })
                    }, timeout)
                }

                let data
                while (!isTimeout) {
                    yield sleep(nowConfig.pollingInterval)
                    let isEnd = yield request.checkQuery(queryId, nowConfig)
                    if (!isEnd) {
                        continue
                    }
                    clearTimeout(timer)
                    data = yield request.getQueryResults(queryId, nowConfig)
                    let previousToken
                    while (data.NextToken && data.NextToken !== previousToken) {
                        previousToken = data.NextToken
                        let dataTmp = yield request.getQueryResults(queryId, nowConfig, data.NextToken)
                        data.NextToken = dataTmp.NextToken || null
                        data.ResultSet.Rows = data.ResultSet.Rows.concat(dataTmp.ResultSet.Rows)
                    }

                    let format = options.format || nowConfig.format
                    data = extractData(data, format)
                    self.setExecRight(right)
                    if (callback) {
                        callback(null, data)
                    }
                    return resolve(data)
                }
            }).catch(err => {
                self.setExecRight(right)
                return handleError(err, resolve, reject, callback)
            })
        })
        if (!callback) {
            toPromiseTimer = setTimeout(() => {
                console.log('[WARN] The function "execute(query)" will be unusable in the next major version update. Please use "execute(query).toPromise()".')
            }, 100)
        }
        promise.toPromise = () => {
            clearTimeout(toPromiseTimer)
            return promise
        }
        return promise
    }
}

function checkConfig(config_) {
    if (!config_.bucketUri) {
        throw new Error('buket uri required')
    }

    if (!config_.pollingInterval || config_.pollingInterval < 0) {
        config_.pollingInterval = 0;
    }

    if (!config_.queryTimeout || config_.queryTimeout < 0) {
        config_.queryTimeout = 0;
    }
}

function extractData(data, format) {
    let result
    switch (format) {
        case 'raw':
            result = data
            break
        case 'array':
            result = []
            let rows = data.ResultSet.Rows
            if (rows && rows.length !== 0) {
                let cols = rows.shift().Data
                let len = rows.length
                for (let i = 0; i < len; i++) {
                    let row = rows[i].Data
                    let record = {}
                    for (let j = 0; j < row.length; j++) {
                        let colName = cols[j].VarCharValue
                        let colVal = row[j].VarCharValue
                        record[colName] = colVal
                    }
                    result.push(record)
                }
            }
            break
        default:
            throw new Error(`invalid format ${format}`)
    }
    return result
}

function handleError(err, resolve, reject, callback) {
    if (callback) {
        callback(err, null)
        return resolve()
    }
    return reject(err)
}

function sleep(time) {
    return new Promise(resolve => {
        setTimeout(() => {
            return resolve()
        }, time)
    })
}

exports.create = (request_, config_) => {
    request = request_
    return new Client(config_)
}