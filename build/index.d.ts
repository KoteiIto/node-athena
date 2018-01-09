import * as aws from 'aws-sdk';
import { AthenaClient, AthenaClientConfig } from './lib/client';
export declare function createClient(clientConfig: AthenaClientConfig, awsConfig: aws.Config): AthenaClient;
