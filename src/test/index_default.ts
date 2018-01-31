import * as assert from 'assert'
import athena from '../index'

describe('Array', () => {
  describe('#createClient import defalut()', () => {
    it('should return athenaClient', (done: any) => {
      const client = athena.createClient(
        { bucketUri: 's3://xxxx' },
        { region: 'xxxx' },
      )
      assert.notEqual(client, undefined)
      done()
    })
  })
})
