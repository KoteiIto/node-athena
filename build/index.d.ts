import { AthenaClient, AthenaClientConfig } from './lib/client';
export interface AwsConfig {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
}
export * from './lib/client';
export default class Athena {
    static createClient: typeof createClient;
}
export declare function createClient(clientConfig: AthenaClientConfig, awsConfig: AwsConfig): AthenaClient;
