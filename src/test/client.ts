import * as assert from 'assert'
import * as fs from 'fs'
import { Readable } from 'stream'
import { AthenaClient, AthenaExecutionResult } from '../lib/client'
import { AthenaRequest, AthenaRequestConfig } from '../lib/request'

const config = {
  bucketUri: 's3://xxxx',
  pollingInterval: 5,
}

const successStartQuery = (
  query: string,
  requestConfig: AthenaRequestConfig,
) => {
  return new Promise<string>((resolve, reject) => {
    setTimeout(() => {
      return resolve('id')
    }, 10)
  })
}

const failStartQuery = (query: string, requestConfig: AthenaRequestConfig) => {
  return new Promise<string>((resolve, reject) => {
    setTimeout(() => {
      return reject(new Error('can not start query'))
    }, 10)
  })
}

const successCheckQuery = (
  queryId: string,
  requestConfig: AthenaRequestConfig,
) => {
  return new Promise<boolean>((resolve, reject) => {
    setTimeout(() => {
      return resolve(true)
    }, 10)
  })
}

const runningCheckQuery = (
  queryId: string,
  requestConfig: AthenaRequestConfig,
) => {
  return new Promise<boolean>((resolve, reject) => {
    setTimeout(() => {
      return resolve(false)
    }, 10)
  })
}

const failCheckQuery = (
  queryId: string,
  requestConfig: AthenaRequestConfig,
) => {
  return new Promise<boolean>((resolve, reject) => {
    setTimeout(() => {
      return reject(new Error('can not check query'))
    }, 10)
  })
}

const successStopQuery = (
  queryId: string,
  requestConfig: AthenaRequestConfig,
) => {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      return resolve()
    }, 10)
  })
}

const successGetQueryExecution = (
  queryId: string,
  requestConfig: AthenaRequestConfig,
) => {
  return new Promise<any>((resolve, reject) => {
    setTimeout(() => {
      return resolve({
        ResultConfiguration: {
          OutputLocation: 's3://xxxx/yyyy.csv',
        },
        QueryExecutionId: 'id',
      })
    }, 10)
  })
}

const failStopQuery = (queryId: string, requestConfig: AthenaRequestConfig) => {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      return reject(new Error('can not stop query'))
    }, 10)
  })
}

const successGetResultsStream = (s3Uri: string) => {
  return fs.createReadStream('./src/test/test.csv')
}

const failGetResultsStream = (s3Uri: string) => {
  throw new Error('can not get object')
}

function getMockRequest() {
  const mock = new AthenaRequest(null, null)
  mock.startQuery = successStartQuery
  mock.checkQuery = successCheckQuery
  mock.stopQuery = successStopQuery
  mock.getResultsStream = successGetResultsStream
  mock.getQueryExecution = successGetQueryExecution
  return mock
}

describe('Array', () => {
  describe('#execute()', () => {
    it('should return success when success to execute query (callback)', (done: any) => {
      const mockReqest = getMockRequest()
      const client = new AthenaClient(mockReqest, config)
      client.execute(
        'query',
        (err: Error, result: AthenaExecutionResult<any>): void => {
          assert.equal(result.records.length, 10)
          assert.equal(result.queryExecution.QueryExecutionId, 'id')
          done()
        },
      )
    })

    it('should return success when success to execute query (promise)', (done: any) => {
      new Promise(async (resolve: any) => {
        const mockReqest = getMockRequest()
        const client = new AthenaClient(mockReqest, config)
        const result = await client.execute<any>('query').toPromise()
        assert.equal(result.records.length, 10)
        assert.equal(result.records[2].name, 'hoge3')
        assert.equal(result.records[3].name, 'ho,ge4')
        assert.equal(result.records[7].id, '8')
        assert.equal(result.queryExecution.QueryExecutionId, 'id')
        resolve()
      }).then(done)
    })

    it('should return success when success to execute query (stream)', (done: any) => {
      new Promise(async (resolve: any) => {
        const mockReqest = getMockRequest()
        const client = new AthenaClient(mockReqest, config)
        const stream = await client.execute('query').toStream()
        const records: any = []
        stream.on('data', (record: any) => {
          records.push(record)
        })
        stream.on('query_end', (queryExecution: any) => {
          assert.equal(queryExecution.QueryExecutionId, 'id')
        })
        stream.on('end', () => {
          assert.equal(records.length, 10)
          assert.equal(records[2].name, 'hoge3')
          assert.equal(records[7].id, '8')
          resolve()
        })
      }).then(done)
    })

    it('should return success when execute query multiple (promise)', (done: any) => {
      new Promise((resolve: any) => {
        const mockReqest = getMockRequest()
        const client = new AthenaClient(mockReqest, config)
        const promises = []
        for (let i = 0; i < 5; i++) {
          promises.push(client.execute('query').toPromise())
        }
        Promise.all(promises).then((results: any[]) => {
          results.forEach((result: any) => {
            assert.equal(result.records.length, 10)
            assert.equal(result.queryExecution.QueryExecutionId, 'id')
          })
          return resolve()
        })
      }).then(done)
    })

    it('should return error when fail to start query (callback)', (done: any) => {
      const mockReqest = getMockRequest()
      mockReqest.startQuery = failStartQuery
      const client = new AthenaClient(mockReqest, config)
      client.execute('query', (err: Error, data) => {
        assert.equal(err.message, 'can not start query')
        assert.equal(data, undefined)
        done()
      })
    })

    it('should return error when fail to start query (promise)', (done: any) => {
      new Promise((resolve: any) => {
        const mockReqest = getMockRequest()
        mockReqest.startQuery = failStartQuery
        const client = new AthenaClient(mockReqest, config)
        client
          .execute('query')
          .toPromise()
          .catch((err: Error) => {
            assert.equal(err.message, 'can not start query')
            return resolve()
          })
      }).then(done)
    })

    it('should return error when fail to start query (stream)', (done: any) => {
      new Promise((resolve: any) => {
        const mockReqest = getMockRequest()
        mockReqest.startQuery = failStartQuery
        const client = new AthenaClient(mockReqest, config)
        const stream = client.execute('query').toStream()
        stream.on('error', (err: Error) => {
          assert.equal(err.message, 'can not start query')
          return resolve()
        })
      }).then(done)
    })

    it('should return error when fail to check query (callback)', (done: any) => {
      const mockReqest = getMockRequest()
      mockReqest.checkQuery = failCheckQuery
      const client = new AthenaClient(mockReqest, config)
      client.execute('query', (err: Error, data) => {
        assert.equal(err.message, 'can not check query')
        assert.equal(data, null)
        done()
      })
    })

    it('should return error when fail to check query (promise)', (done: any) => {
      new Promise((resolve: any) => {
        const mockReqest = getMockRequest()
        mockReqest.checkQuery = failCheckQuery
        const client = new AthenaClient(mockReqest, config)
        client
          .execute('query')
          .toPromise()
          .catch((err: Error) => {
            assert.equal(err.message, 'can not check query')
            return resolve()
          })
      }).then(done)
    })

    it('should return error when fail to check query (stream)', (done: any) => {
      new Promise((resolve: any) => {
        const mockReqest = getMockRequest()
        mockReqest.checkQuery = failCheckQuery
        const client = new AthenaClient(mockReqest, config)
        const stream = client.execute('query').toStream()
        stream.on('error', (err: Error) => {
          assert.equal(err.message, 'can not check query')
          return resolve()
        })
      }).then(done)
    })

    it('should return error when fail to get result stream (callback)', (done: any) => {
      const mockReqest = getMockRequest()
      mockReqest.getResultsStream = failGetResultsStream
      const client = new AthenaClient(mockReqest, config)
      client.execute('query', (err: Error, data) => {
        assert.equal(err.message, 'can not get object')
        assert.equal(data, null)
        done()
      })
    })

    it('should return error when fail to get result stream (promise)', (done: any) => {
      new Promise((resolve: any) => {
        const mockReqest = getMockRequest()
        mockReqest.getResultsStream = failGetResultsStream
        const client = new AthenaClient(mockReqest, config)
        client
          .execute('query')
          .toPromise()
          .catch((err: Error) => {
            assert.equal(err.message, 'can not get object')
            return resolve()
          })
      }).then(done)
    })

    it('should return error when fail to get result stream (stream)', (done: any) => {
      new Promise((resolve: any) => {
        const mockReqest = getMockRequest()
        mockReqest.getResultsStream = failGetResultsStream
        const client = new AthenaClient(mockReqest, config)
        const stream = client.execute('query').toStream()
        stream.on('error', (err: Error) => {
          assert.equal(err.message, 'can not get object')
          return resolve()
        })
      }).then(done)
    })

    it('should return error when query timeout (callback)', (done: any) => {
      const mockReqest = getMockRequest()
      mockReqest.checkQuery = runningCheckQuery
      const client = new AthenaClient(mockReqest, {
        ...config,
        queryTimeout: 100,
        pollingInterval: 20,
      })
      client.execute('query', (err: Error, data) => {
        assert.equal(err.message, 'query timeout')
        done()
      })
    })

    it('should return error when query timeout (promise)', (done: any) => {
      new Promise((resolve: any) => {
        const mockReqest = getMockRequest()
        mockReqest.checkQuery = runningCheckQuery
        const client = new AthenaClient(mockReqest, {
          ...config,
          queryTimeout: 100,
          pollingInterval: 20,
        })
        client
          .execute('query')
          .toPromise()
          .catch((err: Error) => {
            assert.equal(err.message, 'query timeout')
            return resolve()
          })
      }).then(done)
    })

    it('should return error when query timeout (stream)', (done: any) => {
      new Promise((resolve: any) => {
        const mockReqest = getMockRequest()
        mockReqest.checkQuery = runningCheckQuery
        const client = new AthenaClient(mockReqest, {
          ...config,
          queryTimeout: 100,
          pollingInterval: 20,
        })
        const stream = client.execute('query').toStream()
        stream.on('error', (err: Error) => {
          assert.equal(err.message, 'query timeout')
          return resolve()
        })
      }).then(done)
    })

    it('should return error when fail to stop query (callback)', (done: any) => {
      const mockReqest = getMockRequest()
      mockReqest.checkQuery = runningCheckQuery
      mockReqest.stopQuery = failStopQuery
      const client = new AthenaClient(mockReqest, {
        ...config,
        queryTimeout: 10,
        pollingInterval: 100,
      })
      client.execute('query', (err: Error, data) => {
        assert.equal(err.message, 'can not stop query')
        assert.equal(data, null)
        done()
      })
    })
  })
})
