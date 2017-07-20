'use strict'

const assert = require('assert')
const Request = require('../lib/request')

const config = {
    bucketUri: 's3://xxxx',
    baseRetryWait: 2,
    retryCountMax: 5,
}

class MockAthena {

}

const successStartQueryExecution = (params, callback) => {
    let data = { QueryExecutionId: 'queryid' }
    return callback(null, data)
}

const errorStartQueryExecution = (params, callback) => {
    return callback(new Error('can not start query'), null)
}

const successGetQueryExecution = (params, callback) => {
    let data = { QueryExecution: { Status: { State: 'SUCCEEDED' } } }
    return callback(null, data)
}

const runningGetQueryExecution = (params, callback) => {
    let data = { QueryExecution: { Status: { State: 'RUNNING' } } }
    return callback(null, data)
}

const failGetQueryExecution = (params, callback) => {
    let data = { QueryExecution: { Status: { State: 'FAILED' } } }
    return callback(null, data)
}

const errorGetQueryExecution = (params, callback) => {
    return callback(new Error('can not check query'), null)
}

const successGetQueryResults = (params, callback) => {
    return callback(null, 'success')
}

const errorGetQueryResults = (params, callback) => {
    return callback(new Error('can not get query results'), null)
}

const successStopQueryExecution = (params, callback) => {
    return callback(null, 'success')
}

const errorStopQueryExecution = (params, callback) => {
    return callback(new Error('can not stop query'), null)
}

const throttlingErrorExecution = (params, callback) => {
    let error = new Error('Rate exceeded')
    error.errorType = 'ThrottlingException'
    return callback(error, null)
}

function getMockAthena() {
    let mock = new MockAthena()
    mock.startQueryExecution = successStartQueryExecution
    mock.getQueryExecution = successGetQueryExecution
    mock.stopQueryExecution = successStopQueryExecution
    mock.getQueryResults = successGetQueryResults
    return mock
}

describe('Array', function () {
    describe('#startQuery()', function () {
        it('should return queryid when success to startQuery', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                let request = Request.create(mockAthena)
                request.startQuery('query', config).then(data => {
                    assert.equal(data, 'queryid')
                    return resolve()
                })
            }).then(done)
        })

        it('should return error when fail to startQuery', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                mockAthena.startQueryExecution = errorStartQueryExecution
                let request = Request.create(mockAthena)
                request.startQuery('query', config).catch(err => {
                    assert.equal(err.message, 'can not start query')
                    return resolve()
                })
            }).then(done)
        })

        it('should retry when get ThrottlingException', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                mockAthena.startQueryExecution = throttlingErrorExecution
                let request = Request.create(mockAthena)
                request.startQuery('queryid', config).catch(error => {
                    assert.equal(error.message, 'Rate exceeded')
                    return resolve()
                })
            }).then(done)
        })
    })
    describe('#checkQuery()', function () {
        it('should return true when query succeeded', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                let request = Request.create(mockAthena)
                request.checkQuery('queryid', config).then(data => {
                    assert.equal(data, true)
                    return resolve()
                })
            }).then(done)
        })

        it('should return false when query running', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                mockAthena.getQueryExecution = runningGetQueryExecution
                let request = Request.create(mockAthena)
                request.checkQuery('queryid', config).then(data => {
                    assert.equal(data, false)
                    return resolve()
                })
            }).then(done)
        })

        it('should return error when query failed', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                mockAthena.getQueryExecution = failGetQueryExecution
                let request = Request.create(mockAthena)
                request.checkQuery('queryid', config).catch(error => {
                    assert.equal(error.message, 'query failed')
                    return resolve()
                })
            }).then(done)
        })

        it('should return error when get query failed', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                mockAthena.getQueryExecution = errorGetQueryExecution
                let request = Request.create(mockAthena)
                request.checkQuery('queryid', config).catch(error => {
                    assert.equal(error.message, 'can not check query')
                    return resolve()
                })
            }).then(done)
        })

        it('should retry when get ThrottlingException', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                mockAthena.getQueryExecution = throttlingErrorExecution
                let request = Request.create(mockAthena)
                request.checkQuery('queryid', config).catch(error => {
                    assert.equal(error.message, 'Rate exceeded')
                    return resolve()
                })
            }).then(done)
        })
    })
    describe('#stopQuery()', function () {
        it('should return success when success to startQuery', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                let request = Request.create(mockAthena)
                request.stopQuery('queryid', config).then(data => {
                    assert.equal(data, 'success')
                    return resolve()
                })
            }).then(done)
        })

        it('should return error when fail to startQuery', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                mockAthena.stopQueryExecution = errorStopQueryExecution
                let request = Request.create(mockAthena)
                request.stopQuery('queryid', config).catch(error => {
                    assert.equal(error.message, 'can not stop query')
                    return resolve()
                })
            }).then(done)
        })

        it('should retry when get ThrottlingException', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                mockAthena.stopQueryExecution = throttlingErrorExecution
                let request = Request.create(mockAthena)
                request.stopQuery('queryid', config).catch(error => {
                    assert.equal(error.message, 'Rate exceeded')
                    return resolve()
                })
            }).then(done)
        })
    })

    describe('#getQueryResults()', function () {
        it('should return success when success to getQueryResults', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                let request = Request.create(mockAthena)
                request.getQueryResults('queryid', config).then(data => {
                    assert.equal(data, 'success')
                    return resolve()
                })
            }).then(done)
        })

        it('should return error when fail to getQueryResults', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                mockAthena.getQueryResults = errorGetQueryResults
                let request = Request.create(mockAthena)
                request.getQueryResults('queryid', config).catch(err => {
                    assert.equal(err.message, 'can not get query results')
                    return resolve()
                })
            }).then(done)
        })

        it('should retry when get ThrottlingException', function (done) {
            new Promise(resolve => {
                let mockAthena = getMockAthena()
                mockAthena.getQueryResults = throttlingErrorExecution
                let request = Request.create(mockAthena)
                request.getQueryResults('queryid', config).catch(error => {
                    assert.equal(error.message, 'Rate exceeded')
                    return resolve()
                })
            }).then(done)
        })
    })
})