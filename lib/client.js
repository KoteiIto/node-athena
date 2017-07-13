'use strict'

const co = require('co')

let request
let config = {
    bucketUri: '',
    pollingInterval: 500,
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
            let nowConfig = Object.assign({}, config)
            co(function *() {
                let queryId = yield request.startQuery(query, nowConfig)
                let interval, timer
                let intervalFunc = () => {
                    return setTimeout(() => {
                        co(function *() {
                            let isEnd = yield request.checkQuery(queryId, nowConfig)
                            if (isEnd) {
                                clearTimeout(interval)
                                clearTimeout(timer)
                                let data = yield request.getQueryResults(queryId, nowConfig)
                                let format = options.format || nowConfig.format
                                data = extractData(data, format)
                                if (callback) {
                                    callback(null, data)
                                    callback = function(){}
                                }
                                return resolve(data)
                            } else {
                                interval = intervalFunc()
                            }
                        }).catch(err => {
                            if (callback) {
                                callback(err, null)
                                callback = function(){}
                                return resolve()
                            }
                            return reject(err)
                        })
                    }, config.pollingInterval)
                }
                interval = intervalFunc()

                let timeout = options.timeout || config.queryTimeout
                if (timeout) {
                    timer = setTimeout(() => {
                        co(function *() {
                            clearTimeout(interval)
                            yield request.stopQuery(queryId, nowConfig)
                            throw new Error('query timeout')
                        }).catch(err => {
                            if (callback) {
                                callback(err, null)
                                callback = function(){}
                                return resolve()
                            }
                            return reject(err)
                        })
                    }, timeout)
                }
            }).catch(err => {
                if (callback) {
                    callback(err, null)
                    callback = function(){}
                    return resolve()
                }
                return reject(err)
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
    switch(format) {
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

exports.create = (request_, config_) => {
    request = request_
    return new Client(config_)
}