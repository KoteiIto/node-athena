import * as aws from 'aws-sdk'
import {
  AthenaClient,
  AthenaClientConfig,
  setConcurrentExecMax,
} from './lib/client'
import { AthenaRequest } from './lib/request'

export interface AwsConfig {
  region: string
  accessKeyId?: string
  secretAccessKey?: string
}

export interface AwsSdkInstance {
  s3?: aws.S3
  athena?: aws.Athena
}

export * from './lib/client'

export default class Athena {
  public static createClient = createClient
  public static setConcurrentExecMax = setConcurrentExecMax
}

export function createClient(
  clientConfig: AthenaClientConfig,
  awsConfig: AwsConfig,
  awsSdkInstances?: AwsSdkInstance,
) {
  if (
    clientConfig === undefined ||
    clientConfig.bucketUri === undefined ||
    clientConfig.bucketUri.length === 0
  ) {
    throw new Error('bucket uri required')
  }

  if (
    awsConfig === undefined ||
    awsConfig.region === undefined ||
    awsConfig.region.length === 0
  ) {
    throw new Error('region required')
  }

  aws.config.update(awsConfig)
  const sdk: AwsSdkInstance = awsSdkInstances || {}
  const athena = sdk.athena || new aws.Athena({ apiVersion: '2017-05-18' })
  const s3 = sdk.s3 || new aws.S3({ apiVersion: '2006-03-01' })
  const request = new AthenaRequest(athena, s3)
  return new AthenaClient(request, clientConfig)
}
