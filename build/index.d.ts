import { AthenaClient, AthenaClientConfig } from './lib/client';
export interface AwsConfig {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
}
export declare function createClient(clientConfig: AthenaClientConfig, awsConfig: AwsConfig): AthenaClient;
