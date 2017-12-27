import { Duplex, Readable } from 'stream'
import { Queue } from 'typescript-collections'
import * as util from './util'

export interface AthenaStreamConfig {
  maxBufferSize?: string // MB
}

const defaultMaxBufferSize = '128M'

export class AthenaStream<T> extends Duplex {
  private buffer: Queue<Buffer>
  private bufferSize: number
  private maxBufferSize: number
  private columns: string[]
  private isEnd: boolean
  constructor(config: AthenaStreamConfig) {
    super({
      readableObjectMode: true,
      writableObjectMode: true,
      allowHalfOpen: false,
    })
    this.buffer = new Queue()
    this.bufferSize = 0
    this.maxBufferSize = util.getBytes(
      config.maxBufferSize || defaultMaxBufferSize,
    )
    this.columns = []
    this.isEnd = false
    this.on('pipe', (dest: Readable) => {
      dest.on('end', () => {
        this.isEnd = true
      })
    })
    this.on('error', () => {
      this.isEnd = true
    })
  }

  public async _write(
    buffer: Buffer,
    _: string,
    callback: (err?: Error) => void,
  ) {
    while (this.maxBufferSize < this.bufferSize) {
      await util.sleep(20)
    }
    this.bufferSize += buffer.length
    this.buffer.enqueue(buffer)
    callback()
    return
  }

  public async _read() {
    let buffer: Buffer
    while (true) {
      if (this.buffer.isEmpty()) {
        if (this.isEnd) {
          this.push(null)
          return
        }
      } else {
        buffer = this.buffer.dequeue()
        if (buffer.length !== 0) {
          break
        }
      }
      await util.sleep(100)
    }

    this.bufferSize -= buffer.length

    // first record is column names
    if (this.columns.length === 0) {
      this.columns = buffer
        .toString('utf8')
        .split(',')
        .map((column: string) => {
          // replace "column" to column
          return column.substr(1, column.length - 2)
        })
      buffer = this.buffer.dequeue()
      this.bufferSize -= buffer.length
    }

    const record: any = {}
    buffer
      .toString('utf8')
      .split(',')
      .forEach((val: string, i: number) => {
        const column = this.columns[i] || null
        if (column !== null) {
          // replace "val" to val
          record[column] = val.substr(1, val.length - 2)
        }
      })
    this.push(record)
    return
  }
}
