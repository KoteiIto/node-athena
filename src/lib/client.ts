import { Athena } from 'aws-sdk'
import { LineStream } from 'byline'
import { Readable } from 'stream'
import { setTimeout } from 'timers'
import { AthenaRequest, AthenaRequestConfig } from './request'
import { AthenaStream, AthenaStreamConfig } from './stream'
import * as util from './util'

export interface AthenaExecutionResult<T> {
  records: T[]
  queryExecution: Athena.QueryExecution
}

export interface AthenaExecutionSelect<T> {
  toPromise: () => Promise<AthenaExecutionResult<T>>
  toStream: () => AthenaStream<T>
}

export interface AthenaClientConfig
  extends AthenaRequestConfig,
    AthenaStreamConfig {
  pollingInterval?: number
  queryTimeout?: number
  concurrentExecMax?: number
  execRightCheckInterval?: number
}

const defaultPollingInterval = 1000
const defaultQueryTimeout = 0
const defaultConcurrentExecMax = 5
const defaultExecRightCheckInterval = 100

export class AthenaClient {
  private config: AthenaClientConfig
  private concurrentExecNum: number
  private request: AthenaRequest
  constructor(request: AthenaRequest, config: AthenaClientConfig) {
    this.request = request
    this.config = config
    this.concurrentExecNum = 0
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
    const athenaStream = new AthenaStream<T>(currentConfig)
    this._execute(query, athenaStream, currentConfig)

    // Add event listener
    if (callback !== undefined) {
      let isEnd = false
      const records: T[] = []
      let queryExecution: Athena.QueryExecution

      // Callback
      athenaStream.on('data', (record: T) => {
        records.push(record)
      })
      athenaStream.on('query_end', (q: Athena.QueryExecution) => {
        queryExecution = q
      })
      athenaStream.on('end', (record: T) => {
        if (isEnd) {
          return
        }
        const result: AthenaExecutionResult<T> = {
          records,
          queryExecution,
        }
        callback(undefined, result)
      })
      athenaStream.on('error', (err: Error) => {
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
            athenaStream.on('data', (record: T) => {
              records.push(record)
            })
            athenaStream.on('query_end', (q: Athena.QueryExecution) => {
              queryExecution = q
            })
            athenaStream.on('end', (record: T) => {
              const result: AthenaExecutionResult<T> = {
                records,
                queryExecution,
              }
              return resolve(result)
            })
            athenaStream.on('error', (err: Error) => {
              return reject(err)
            })
          })
        },
        // Stream
        toStream: (): AthenaStream<T> => {
          return athenaStream
        },
      }
    }
  }

  private async _execute<T>(
    query: string,
    athenaStream: AthenaStream<T>,
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
      while (!isTimeout && !await this.request.checkQuery(queryId, config)) {
        await util.sleep(config.pollingInterval || defaultPollingInterval)
      }

      // Check timeout
      if (isTimeout) {
        await this.request.stopQuery(queryId, config)
        throw new Error('query timeout')
      }

      // Emit query_end event
      queryExecution = await this.request.getQueryExecution(queryId, config)
      athenaStream.emit('query_end', queryExecution)

      this.endQuery()
    } catch (err) {
      this.endQuery()
      athenaStream.emit('error', err)
      athenaStream.end(new Buffer(''))
      return
    }

    // S3
    try {
      // Get result from s3
      if (
        !queryExecution.ResultConfiguration ||
        !queryExecution.ResultConfiguration.OutputLocation
      ) {
        throw new Error('query outputlocation is empty')
      }
      const resultsStream: Readable = this.request.getResultsStream(
        queryExecution.ResultConfiguration.OutputLocation,
      )
      resultsStream.pipe(new LineStream()).pipe(athenaStream)
    } catch (err) {
      athenaStream.emit('error', err)
      athenaStream.end(new Buffer(''))
      return
    }
  }

  private canStartQuery() {
    return (
      this.concurrentExecNum <
      (this.config.concurrentExecMax || defaultConcurrentExecMax)
    )
  }

  private startQuery() {
    this.concurrentExecNum = Math.min(
      this.concurrentExecNum + 1,
      this.config.concurrentExecMax || defaultConcurrentExecMax,
    )
  }

  private endQuery() {
    this.concurrentExecNum = Math.max(this.concurrentExecNum - 1, 0)
  }
}
