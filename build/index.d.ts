import * as aws from 'aws-sdk';
import { AthenaClient, AthenaClientConfig, setConcurrentExecMax } from './lib/client';
export interface AwsConfig {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
}
export interface AwsSdkInstance {
    s3?: aws.S3;
    athena?: aws.Athena;
}
export * from './lib/client';
export default class Athena {
    static createClient: typeof createClient;
    static setConcurrentExecMax: typeof setConcurrentExecMax;
}
export declare function createClient(clientConfig: AthenaClientConfig, awsConfig: AwsConfig, awsSdkInstances?: AwsSdkInstance): AthenaClient;
