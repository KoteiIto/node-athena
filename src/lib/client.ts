import { Athena } from 'aws-sdk'
import * as csv from 'csv-parser'
import { Transform } from 'stream'
import { setTimeout } from 'timers'
import { AthenaRequest, AthenaRequestConfig } from './request'
import * as util from './util'

export interface AthenaExecutionResult<T> {
  records: T[]
  queryExecution: Athena.QueryExecution
}

export interface AthenaExecutionSelect<T> {
  toPromise: () => Promise<AthenaExecutionResult<T>>
  toStream: () => Transform & AsyncIterable<T>
}

export interface AthenaClientConfig extends AthenaRequestConfig {
  pollingInterval?: number
  queryTimeout?: number
  concurrentExecMax?: number
  execRightCheckInterval?: number
  skipFetchResult?: boolean
}

const defaultPollingInterval = 1000
const defaultQueryTimeout = 0
const defaultExecRightCheckInterval = 100

let concurrentExecMax = 5
let concurrentExecNum = 0

export function setConcurrentExecMax(val: number) {
  concurrentExecMax = val
}

export class AthenaClient {
  private config: AthenaClientConfig
  private concurrentExecNum: number
  private request: AthenaRequest
  constructor(request: AthenaRequest, config: AthenaClientConfig) {
    this.request = request
    this.config = config
    if (config.concurrentExecMax) {
      console.warn(
        `[WARN] please use 'athena.setConcurrentExecMax()' instead 'clientConfig.concurrentExecMax'`,
      )
      concurrentExecMax = config.concurrentExecMax
    }
    if (
      (config.encryptionOption === 'SSE_KMS' ||
        config.encryptionOption === 'CSE_KMS') &&
      config.encryptionKmsKey === undefined
    ) {
      throw new Error('KMS key required')
    }
  }

  public execute<T>(query: string): AthenaExecutionSelect<T>
  public execute<T>(
    query: string,
    callback: (err?: Error, result?: AthenaExecutionResult<T>) => void,
  ): void

  public execute<T>(
    query: string,
    callback?: (err?: Error, result?: AthenaExecutionResult<T>) => any,
  ) {
    // Execute
    const currentConfig = { ...this.config }
    const csvTransform = new csv()
    // const athenaStream = new AthenaStream<T>(currentConfig)
    this._execute(query, csvTransform, currentConfig)

    // Add event listener
    if (callback !== undefined) {
      let isEnd = false
      const records: T[] = []
      let queryExecution: Athena.QueryExecution

      // Callback
      csvTransform.on('data', (record: T) => {
        records.push(record)
      })
      csvTransform.on('query_end', (q: Athena.QueryExecution) => {
        queryExecution = q
      })
      csvTransform.on('end', (record: T) => {
        if (isEnd) {
          return
        }
        const result: AthenaExecutionResult<T> = {
          records,
          queryExecution,
        }
        callback(undefined, result)
      })
      csvTransform.on('error', (err: Error) => {
        isEnd = true
        callback(err)
      })
      return
    } else {
      return {
        // Promise
        toPromise: () => {
          return new Promise<AthenaExecutionResult<T>>((resolve, reject) => {
            const records: T[] = []
            let queryExecution: Athena.QueryExecution

            // Add event listener for promise
            csvTransform.on('data', (record: T) => {
              records.push(record)
            })
            csvTransform.on('query_end', (q: Athena.QueryExecution) => {
              queryExecution = q
            })
            csvTransform.on('end', (record: T) => {
              const result: AthenaExecutionResult<T> = {
                records,
                queryExecution,
              }
              return resolve(result)
            })
            csvTransform.on('error', (err: Error) => {
              return reject(err)
            })
          })
        },
        // Stream
        toStream: (): Transform => {
          return csvTransform
        },
      }
    }
  }

  private async _execute(
    query: string,
    csvTransform: Transform,
    config: AthenaClientConfig,
  ) {
    // Limit the number of concurrent executions
    while (!this.canStartQuery()) {
      await util.sleep(
        config.execRightCheckInterval || defaultExecRightCheckInterval,
      )
    }

    let queryExecution: Athena.QueryExecution

    // Athena
    try {
      // Execute query
      this.startQuery()
      const queryId = await this.request.startQuery(query, config)

      // Set timeout
      let isTimeout = false
      if ((config.queryTimeout || defaultQueryTimeout) !== 0) {
        setTimeout(() => {
          isTimeout = true
        }, config.queryTimeout || defaultQueryTimeout)
      }

      // Wait for timeout or query success
      while (!isTimeout && !(await this.request.checkQuery(queryId, config))) {
        await util.sleep(config.pollingInterval || defaultPollingInterval)
      }

      // Check timeout
      if (isTimeout) {
        await this.request.stopQuery(queryId, config)
        throw new Error('query timeout')
      }

      // Emit query_end event
      queryExecution = await this.request.getQueryExecution(queryId, config)
      csvTransform.emit('query_end', queryExecution)

      this.endQuery()
    } catch (err) {
      this.endQuery()
      csvTransform.emit('error', err)
      return
    }

    if (config.skipFetchResult) {
      csvTransform.end()
      return
    } else {
      // S3
      try {
        // Get result from s3
        if (
          !queryExecution.ResultConfiguration ||
          !queryExecution.ResultConfiguration.OutputLocation
        ) {
          throw new Error('query outputlocation is empty')
        }
        const resultsStream = this.request.getResultsStream(
          queryExecution.ResultConfiguration.OutputLocation,
        )
        resultsStream.pipe(csvTransform)
      } catch (err) {
        csvTransform.emit('error', err)
        return
      }
    }
  }

  private canStartQuery() {
    return concurrentExecNum < concurrentExecMax
  }

  private startQuery() {
    concurrentExecNum = Math.min(++concurrentExecNum, concurrentExecMax)
  }

  private endQuery() {
    concurrentExecNum = Math.max(--concurrentExecNum, 0)
  }
}
