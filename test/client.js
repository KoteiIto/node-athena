'use strict'

const assert = require('assert')
const Client = require('../lib/client')
const config = {
    bucketUri: 's3://xxxx',
    pollingInterval: 5,
}

class MockRequest {

}

const successStartQuery = (query, options, callback) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return resolve('id')
        }, 10)
    })
}

const failStartQuery = (query, options, callback) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return reject(new Error('can not start query'))
        }, 10)
    })
}

const successCheckQuery = (query, options, callback) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return resolve(true)
        }, 10)
    })
}

const runningCheckQuery = (query, options, callback) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return resolve(false)
        }, 10)
    })
}

const failCheckQuery = (query, options, callback) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return reject(new Error('can not check query'))
        }, 10)
    })
}

const successStopQuery = (query, options, callback) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return resolve()
        }, 10)
    })
}

const failStopQuery = (query, options, callback) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return reject(new Error('can not stop query'))
        }, 10)
    })
}

const successGetQueryResults = (query, options, callback) => {
    let data = {
        ResultSet: {
            Rows: [
                {
                    Data: [{ VarCharValue: 'col1' }, { VarCharValue: 'col2' }],
                },
                {
                    Data: [{ VarCharValue: '1' }, { VarCharValue: '2' }]
                }
            ]
        },
        NextToken: "TOKEN",
    }
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return resolve(data)
        }, 10)
    })
}

const failGetQueryResults = (query, options, callback) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return reject(new Error('can not get query results'))
        }, 10)
    })
}

function getMockRequest() {
    let mock = new MockRequest()
    mock.startQuery = successStartQuery
    mock.checkQuery = successCheckQuery
    mock.stopQuery = successStopQuery
    mock.getQueryResults = successGetQueryResults
    return mock
}

describe('Array', function () {
    describe('#execute()', function () {
        it('should return success when success to execute query (promise)', function (done) {
            new Promise(resolve => {
                let mockReqest = getMockRequest()
                let client = Client.create(mockReqest, config)
                client.execute('query').then(data => {
                    assert.equal(data[0].col1, '1')
                    assert.equal(data[0].col2, '2')
                    return resolve()
                })
            }).then(done)
        })

        it('should return success when success to execute query (promise)', function (done) {
            new Promise(resolve => {
                let mockReqest = getMockRequest()
                let newConfig = Object.assign({ format: 'raw' }, config)
                let client = Client.create(mockReqest, newConfig)
                client.execute('query').then(data => {
                    assert.notEqual(data.ResultSet, undefined)
                    return resolve()
                })
            }).then(done)
        })

        it('should return success when success to execute query (callback)', function (done) {
            let mockReqest = getMockRequest()
            let client = Client.create(mockReqest, config)
            client.execute('query', {}, (err, data) => {
                assert.equal(err, null)
                assert.equal(data[0].col1, '1')
                assert.equal(data[0].col2, '2')
                done()
            })
        })

        it('should return success when success to execute query not option (callback)', function (done) {
            let mockReqest = getMockRequest()
            let client = Client.create(mockReqest, config)
            client.execute('query', (err, data) => {
                assert.equal(err, null)
                assert.equal(data[0].col1, '1')
                assert.equal(data[0].col2, '2')
                done()
            })
        })

        it('should return success when execute query multiple (promise)', function (done) {
            new Promise(resolve => {
                let mockReqest = getMockRequest()
                let client = Client.create(mockReqest, config)
                let promises = []
                for (let i = 0; i < 50; i++) {
                    promises.push(client.execute('query'))
                }
                Promise.all(promises).then(() => {
                    return resolve()
                })
            }).then(done)
        })

        it('should return error when fail to start query (promise)', function (done) {
            new Promise(resolve => {
                let mockReqest = getMockRequest()
                mockReqest.startQuery = failStartQuery
                let client = Client.create(mockReqest, config)
                client.execute('query').catch(err => {
                    assert.equal(err.message, 'can not start query')
                    return resolve()
                })
            }).then(done)
        })

        it('should return error when fail to start query (callback)', function (done) {
            let mockReqest = getMockRequest()
            mockReqest.startQuery = failStartQuery
            let client = Client.create(mockReqest, config)
            client.execute('query', {}, (err, data) => {
                assert.equal(err.message, 'can not start query')
                assert.equal(data, null)
                done()
            })
        })

        it('should return error when fail to start query (promise)', function (done) {
            new Promise(resolve => {
                let mockReqest = getMockRequest()
                mockReqest.checkQuery = failCheckQuery
                let client = Client.create(mockReqest, config)
                client.execute('query').catch(err => {
                    assert.equal(err.message, 'can not check query')
                    return resolve()
                })
            }).then(done)
        })

        it('should return error when fail to start query (callback)', function (done) {
            let mockReqest = getMockRequest()
            mockReqest.checkQuery = failCheckQuery
            let client = Client.create(mockReqest, config)
            client.execute('query', {}, (err, data) => {
                assert.equal(err.message, 'can not check query')
                assert.equal(data, null)
                done()
            })
        })

        it('should return error when fail to start query (promise)', function (done) {
            new Promise(resolve => {
                let mockReqest = getMockRequest()
                mockReqest.getQueryResults = failGetQueryResults
                let client = Client.create(mockReqest, config)
                client.execute('query').catch(err => {
                    assert.equal(err.message, 'can not get query results')
                    return resolve()
                })
            }).then(done)
        })

        it('should return error when fail to start query (callback)', function (done) {
            let mockReqest = getMockRequest()
            mockReqest.getQueryResults = failGetQueryResults
            let client = Client.create(mockReqest, config)
            client.execute('query', {}, (err, data) => {
                assert.equal(err.message, 'can not get query results')
                assert.equal(data, null)
                done()
            })
        })

        it('should return error when query timeout (promise)', function (done) {
            new Promise(resolve => {
                let mockReqest = getMockRequest()
                mockReqest.checkQuery = runningCheckQuery
                let client = Client.create(mockReqest, Object.assign({}, config, { queryTimeout: 100, pollinInterval: 20 }))
                client.execute('query').catch(err => {
                    assert.equal(err.message, 'query timeout')
                    return resolve()
                })
            }).then(done)
        })

        it('should return error when query timeout (callback)', function (done) {
            let mockReqest = getMockRequest()
            mockReqest.checkQuery = runningCheckQuery
            let client = Client.create(mockReqest, Object.assign({}, config, { queryTimeout: 100, pollinInterval: 20 }))
            client.execute('query', {}, (err, data) => {
                assert.equal(err.message, 'query timeout')
                assert.equal(data, null)
                done()
            })
        })

        it('should return error when fail to stop query (promise)', function (done) {
            new Promise(resolve => {
                let mockReqest = getMockRequest()
                mockReqest.checkQuery = runningCheckQuery
                mockReqest.stopQuery = failStopQuery
                let client = Client.create(mockReqest, Object.assign({}, config, { queryTimeout: 10, pollinInterval: 5000 }))
                client.execute('query').catch(err => {
                    assert.equal(err.message, 'can not stop query')
                    return resolve()
                })
            }).then(done)
        })

        it('should return error when fail to stop query (callback)', function (done) {
            let mockReqest = getMockRequest()
            mockReqest.checkQuery = runningCheckQuery
            mockReqest.stopQuery = failStopQuery
            let client = Client.create(mockReqest, Object.assign({}, config, { queryTimeout: 10, pollinInterval: 5000 }))
            client.execute('query', {}, (err, data) => {
                assert.equal(err.message, 'can not stop query')
                assert.equal(data, null)
                done()
            })
        })

        it('should return error when invalid config', function () {
            try {
                let mockReqest = getMockRequest()
                let client = Client.create(mockReqest, Object.assign({}, config, { bucketUri: '' }))
            } catch (err) {
                assert.equal(err.message, 'buket uri required')
            }
        })

        it('should return error when invalid config2', function (done) {
            let mockReqest = getMockRequest()
            let client = Client.create(mockReqest, Object.assign({}, config, { format: 'hoge' }))
            client.execute('query', {}, (err, data) => {
                assert.equal(err.message, 'invalid format hoge')
                done()
            })
        })
    })

    describe('#setConfig()', function () {
        it('should return error when bucketUri is empty', function () {
            let mockReqest = getMockRequest()
            let newConfig = Object.assign({}, config)
            newConfig.bucketUri = ""
            assert.throws(() => { let client = Client.create(mockReqest, newConfig) }, Error, 'buket uri required')
        })

        it('should return valid pollingInterval error when pollingInterval is empty', function () {
            let mockReqest = getMockRequest()
            let newConfig = Object.assign({}, config)
            delete newConfig.pollingInterval
            let client = Client.create(mockReqest, newConfig)
            assert.equal(client.config.pollingInterval, 0)
        })
    })
})