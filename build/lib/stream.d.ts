/// <reference types="node" />
import { Duplex } from 'stream';
export interface AthenaStreamConfig {
    maxBufferSize?: string;
}
export declare class AthenaStream<T> extends Duplex {
    private buffer;
    private bufferSize;
    private maxBufferSize;
    private columns;
    private isEnd;
    constructor(config: AthenaStreamConfig);
    _write(buffer: Buffer, _: string, callback: (err?: Error) => void): Promise<void>;
    _read(): Promise<void>;
}
