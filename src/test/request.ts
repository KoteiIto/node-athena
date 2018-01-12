import * as assert from 'assert'
import * as fs from 'fs'
import { AthenaRequest } from '../lib/request'

const config = {
  bucketUri: 's3://xxxx',
  baseRetryWait: 2,
  retryWaitMax: 100,
  retryCountMax: 5,
}

interface MockAthena {
  startQueryExecution: any
  getQueryExecution: any
  stopQueryExecution: any
}

interface MockS3 {
  getObject: any
}

interface MockRecord {
  id: string
  name: string
  ammount: string
}

const successStartQueryExecution = (params: any, callback: any) => {
  const data = { QueryExecutionId: 'queryid' }
  return callback(null, data)
}

const errorStartQueryExecution = (params: any, callback: any) => {
  return callback(new Error('can not start query'), null)
}

const successGetQueryExecution = (params: any, callback: any) => {
  const data = { QueryExecution: { Status: { State: 'SUCCEEDED' } } }
  return callback(null, data)
}

const runningGetQueryExecution = (params: any, callback: any) => {
  const data = { QueryExecution: { Status: { State: 'RUNNING' } } }
  return callback(null, data)
}

const cancelGetQueryExecution = (params: any, callback: any) => {
  const data = { QueryExecution: { Status: { State: 'CANCELLED' } } }
  return callback(null, data)
}

const failGetQueryExecution = (params: any, callback: any) => {
  const data = {
    QueryExecution: {
      Status: { State: 'FAILED', StateChangeReason: 'FAILED: Execution Error' },
    },
  }
  return callback(null, data)
}

const unknownGetQueryExecution = (params: any, callback: any) => {
  const data = { QueryExecution: { Status: { State: 'HOGE' } } }
  return callback(null, data)
}

const errorGetQueryExecution = (params: any, callback: any) => {
  return callback(new Error('can not check query'), null)
}

const successGetQueryResults = (params: any, callback: any) => {
  return callback(null, 'success')
}

const errorGetQueryResults = (params: any, callback: any) => {
  return callback(new Error('can not get query results'), null)
}

const successStopQueryExecution = (params: any, callback: any) => {
  return callback(null, 'success')
}

const errorStopQueryExecution = (params: any, callback: any) => {
  return callback(new Error('can not stop query'), null)
}

const throttlingErrorExecution = (params: any, callback: any) => {
  const error: any = {
    message: 'Rate exceeded',
    code: 'ThrottlingException',
  }
  return callback(error, null)
}

const successGetObject = (params: any) => {
  return {
    createReadStream: () => {
      return fs.createReadStream('./src/test/test.csv')
    },
  }
}

function getMockAthena() {
  const mock: MockAthena = {
    startQueryExecution: successStartQueryExecution,
    getQueryExecution: successGetQueryExecution,
    stopQueryExecution: successStopQueryExecution,
  }
  return mock
}

function getMockS3() {
  const mock: MockS3 = {
    getObject: successGetObject,
  }
  return mock
}

describe('Array', () => {
  describe('#startQuery()', () => {
    it('should return queryid when success to startQuery', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.startQuery('query', config).then((data: any) => {
          assert.equal(data, 'queryid')
          return resolve()
        })
      }).then(done)
    })

    it('should return error when fail to startQuery', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        mockAthena.startQueryExecution = errorStartQueryExecution
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.startQuery('query', config).catch((err: Error) => {
          assert.equal(err.message, 'can not start query')
          return resolve()
        })
      }).then(done)
    })

    it('should retry when get ThrottlingException', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        mockAthena.startQueryExecution = throttlingErrorExecution
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.startQuery('queryid', config).catch((err: Error) => {
          assert.equal(err.message, 'Rate exceeded')
          return resolve()
        })
      }).then(done)
    })
  })
  describe('#checkQuery()', () => {
    it('should return true when query succeeded', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.checkQuery('queryid', config).then((data: any) => {
          assert.equal(data, true)
          return resolve()
        })
      }).then(done)
    })

    it('should return false when query running', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        mockAthena.getQueryExecution = runningGetQueryExecution
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.checkQuery('queryid', config).then((data: any) => {
          assert.equal(data, false)
          return resolve()
        })
      }).then(done)
    })

    it('should return error when query canceled', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        mockAthena.getQueryExecution = cancelGetQueryExecution
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.checkQuery('queryid', config).catch((err: Error) => {
          assert.equal(err.message, 'FAILED: Query CANCELLED')
          return resolve()
        })
      }).then(done)
    })

    it('should return error when query failed', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        mockAthena.getQueryExecution = failGetQueryExecution
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.checkQuery('queryid', config).catch((err: Error) => {
          assert.equal(err.message, 'FAILED: Execution Error')
          return resolve()
        })
      }).then(done)
    })

    it('should return error when query status unknown', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        mockAthena.getQueryExecution = unknownGetQueryExecution
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.checkQuery('queryid', config).catch((err: Error) => {
          assert.equal(err.message, 'FAILED: UnKnown State HOGE')
          return resolve()
        })
      }).then(done)
    })

    it('should return error when get query failed', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        mockAthena.getQueryExecution = errorGetQueryExecution
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.checkQuery('queryid', config).catch((err: Error) => {
          assert.equal(err.message, 'can not check query')
          return resolve()
        })
      }).then(done)
    })

    it('should retry when get ThrottlingException', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        mockAthena.getQueryExecution = throttlingErrorExecution
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.checkQuery('queryid', config).catch((err: Error) => {
          assert.equal(err.message, 'Rate exceeded')
          return resolve()
        })
      }).then(done)
    })
  })
  describe('#stopQuery()', () => {
    it('should return success when success to stopQuery', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.stopQuery('queryid', config).then((data: any) => {
          assert.equal(data, undefined)
          return resolve()
        })
      }).then(done)
    })

    it('should return error when fail to stopQuery', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        mockAthena.stopQueryExecution = errorStopQueryExecution
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.stopQuery('queryid', config).catch((err: Error) => {
          assert.equal(err.message, 'can not stop query')
          return resolve()
        })
      }).then(done)
    })

    it('should retry when get ThrottlingException', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        mockAthena.stopQueryExecution = throttlingErrorExecution
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        request.stopQuery('queryid', config).catch((err: Error) => {
          assert.equal(err.message, 'Rate exceeded')
          return resolve()
        })
      }).then(done)
    })
  })

  describe('#getResultsStream()', () => {
    it('should return getResultsStream', (done: any) => {
      new Promise((resolve: any) => {
        const mockAthena = getMockAthena()
        const mockS3 = getMockS3()
        const request = new AthenaRequest(mockAthena, mockS3)
        const readStream = request.getResultsStream('s3://xxxx/yyyy')
        return resolve()
      }).then(done)
    })
  })
})
