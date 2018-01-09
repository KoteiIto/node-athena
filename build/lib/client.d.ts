import { Athena } from 'aws-sdk';
import { AthenaRequest, AthenaRequestConfig } from './request';
import { AthenaStream, AthenaStreamConfig } from './stream';
export interface AthenaExecutionResult<T> {
    records: T[];
    queryExecution: Athena.QueryExecution;
}
export interface AthenaExecutionSelect<T> {
    toPromise: () => Promise<AthenaExecutionResult<T>>;
    toStream: () => AthenaStream<T>;
}
export interface AthenaClientConfig extends AthenaRequestConfig, AthenaStreamConfig {
    pollingInterval?: number;
    queryTimeout?: number;
    concurrentExecMax?: number;
    execRightCheckInterval?: number;
}
export declare class AthenaClient {
    private config;
    private concurrentExecNum;
    private request;
    constructor(request: AthenaRequest, config: AthenaClientConfig);
    execute<T>(query: string): AthenaExecutionSelect<T>;
    execute<T>(query: string, callback: (err?: Error, result?: AthenaExecutionResult<T>) => void): void;
    private _execute<T>(query, athenaStream, config);
    private canStartQuery();
    private startQuery();
    private endQuery();
}
