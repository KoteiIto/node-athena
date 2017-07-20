'use strict'

const co = require('co')

let request
let config = {
    bucketUri: '',
    pollingInterval: 1000,
    queryTimeout: 0,
    format: 'array'
}

class Client {
    constructor(config_) {
        this.setConfig(config_)
    }

    setConfig(config_) {
        checkConfig(config_)
        config = Object.assign(config, config_)
    }

    execute(query, options, callback) {
        return new Promise((resolve, reject) => {
            options = options || {}
            if (typeof (options) == 'function') {
                callback = options
                options = {}
            }
            let nowConfig = Object.assign({}, config)
            co(function* () {
                let queryId = yield request.startQuery(query, nowConfig)
                let timeout = options.timeout || config.queryTimeout
                let isTimeout = false
                let timer
                if (timeout) {
                    timer = setTimeout(function timeoutFunc() {
                        isTimeout = true
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
                    yield sleep(config.pollingInterval)
                    let isEnd = yield request.checkQuery(queryId, nowConfig)
                    if (!isEnd) {
                        continue
                    }
                    clearTimeout(timer)
                    data = yield request.getQueryResults(queryId, nowConfig)
                    let format = options.format || nowConfig.format
                    data = extractData(data, format)
                    if (callback) {
                        callback(null, data)
                        callback = function () { }
                    }
                    return resolve(data)
                }
            }).catch(err => {
                return handleError(err, resolve, reject, callback)
            })
        })
    }
}

function checkConfig(config_) {
    if (!config_.bucketUri) {
        throw new Error('buket uri required')
    }
    config_.pollingInterval = Math.max(config_.pollingInterval, 0)
    config_.queryTimeout = Math.max(config_.queryTimeout, 0)
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
        callback = function () { }
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