import { Athena, AWSError } from 'aws-sdk'
import { Readable } from 'stream'

export interface AthenaRequestConfig {
  bucketUri: string
  baseRetryWait?: number
  retryWaitMax?: number
  retryCountMax?: number
  database?: string
}

const defaultBaseRetryWait = 200
const defaultRetryWaitMax = 10000
const defaultRetryCountMax = 10

export class AthenaRequest {
  private athena: any
  private s3: any
  constructor(athena: any, s3: any) {
    this.athena = athena
    this.s3 = s3
  }
  public startQuery(query: string, config: AthenaRequestConfig) {
    return new Promise<string>((resolve, reject) => {
      let retryCount = 0
      const params = {
        QueryString: query,
        ResultConfiguration: {
          OutputLocation: config.bucketUri,
        },
        QueryExecutionContext: {
          Database: config.database || 'default',
        },
      }
      const loopFunc = () => {
        this.athena.startQueryExecution(params, (err: AWSError, data: any) => {
          if (err && isRetryException(err) && canRetry(retryCount, config)) {
            let wait =
              (config.baseRetryWait || defaultBaseRetryWait) *
              Math.pow(2, retryCount++)
            wait = Math.min(wait, config.retryWaitMax || defaultRetryWaitMax)
            return setTimeout(loopFunc, wait)
          } else if (err) {
            return reject(err)
          }
          return resolve(data.QueryExecutionId)
        })
      }
      loopFunc()
    })
  }

  public checkQuery(queryId: string, config: AthenaRequestConfig) {
    return new Promise<boolean>((resolve, reject) => {
      this.getQueryExecution(queryId, config)
        .then((queryExecution: any) => {
          const state = queryExecution.Status.State
          let isSucceed: boolean = false
          let error: Error | null = null
          switch (state) {
            case 'QUEUED':
            case 'RUNNING':
              isSucceed = false
              break
            case 'SUCCEEDED':
              isSucceed = true
              break
            case 'FAILED':
              isSucceed = false
              const errMsg =
                queryExecution.Status.StateChangeReason ||
                'FAILED: Execution Error'
              error = new Error(errMsg)
              break
            case 'CANCELLED':
              isSucceed = false
              error = new Error('FAILED: Query CANCELLED')
              break
            default:
              isSucceed = false
              error = new Error(`FAILED: UnKnown State ${state}`)
          }
          if (error) {
            return reject(error)
          }
          return resolve(isSucceed)
        })
        .catch((err: AWSError) => {
          return reject(err)
        })
    })
  }

  public stopQuery(queryId: string, config: AthenaRequestConfig) {
    return new Promise<void>((resolve, reject) => {
      let retryCount = 0
      const params = {
        QueryExecutionId: queryId,
      }
      const loopFunc = () => {
        this.athena.stopQueryExecution(params, (err: AWSError) => {
          if (err && isRetryException(err) && canRetry(retryCount, config)) {
            const wait = Math.pow(
              config.baseRetryWait || defaultBaseRetryWait,
              retryCount++,
            )
            return setTimeout(loopFunc, wait)
          } else if (err) {
            return reject(err)
          }
          return resolve()
        })
      }
      loopFunc()
    })
  }

  public getQueryExecution(queryId: string, config: AthenaRequestConfig) {
    return new Promise<any>((resolve, reject) => {
      let retryCount = 0
      const params = {
        QueryExecutionId: queryId,
      }
      const loopFunc = () => {
        this.athena.getQueryExecution(params, (err: AWSError, data: any) => {
          if (err && isRetryException(err) && canRetry(retryCount, config)) {
            const wait = Math.pow(
              config.baseRetryWait || defaultBaseRetryWait,
              retryCount++,
            )
            return setTimeout(loopFunc, wait)
          } else if (err) {
            return reject(err)
          }
          return resolve(data.QueryExecution)
        })
      }
      loopFunc()
    })
  }

  public getResultsStream(s3Uri: string): Readable {
    const arr = s3Uri.replace('s3://', '').split('/')
    const bucket = arr.shift() || ''
    const key = arr.join('/')
    return this.s3
      .getObject({
        Bucket: bucket,
        Key: key,
      })
      .createReadStream()
  }
}

function isRetryException(err: AWSError) {
  return (
    err.code === 'ThrottlingException' ||
    err.code === 'TooManyRequestsException' ||
    err.message === 'Query exhausted resources at this scale factor'
  )
}

function canRetry(retryCount: number, config: AthenaRequestConfig) {
  return retryCount < (config.retryCountMax || defaultRetryCountMax)
}
