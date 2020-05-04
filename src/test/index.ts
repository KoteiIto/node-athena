import * as assert from 'assert'
import * as aws from 'aws-sdk'
import * as athena from '../index'

describe('Array', () => {
  describe('#createClient()', () => {
    it('should return athenaClient', (done: any) => {
      const client = athena.createClient(
        { bucketUri: 's3://xxxx' },
        { region: 'xxxx' },
      )
      assert.notEqual(client, undefined)
      done()
    })

    it('can accept awsSdkInstance', (done: any) => {
      const client = athena.createClient(
        { bucketUri: 's3://xxxx' },
        { region: 'xxxx' },
        { s3: new aws.S3({ apiVersion: 'latest' }) },
      )
      assert.notEqual(client, undefined)
      done()
    })
  })

  describe('#setConcurrentExecMax()', () => {
    it('should no error', (done: any) => {
      athena.setConcurrentExecMax(10)
      done()
    })
  })
})
