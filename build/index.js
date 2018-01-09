"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws = require("aws-sdk");
const client_1 = require("./lib/client");
const request_1 = require("./lib/request");
function createClient(clientConfig, awsConfig) {
    if (clientConfig === undefined ||
        clientConfig.bucketUri === undefined ||
        clientConfig.bucketUri.length === 0) {
        throw new Error('buket uri required');
    }
    if (awsConfig === undefined ||
        awsConfig.region === undefined ||
        awsConfig.region.length === 0) {
        throw new Error('region required');
    }
    aws.config.update(awsConfig);
    const athena = new aws.Athena({ apiVersion: '2017-05-18' });
    const s3 = new aws.S3({ apiVersion: '2006-03-01' });
    const request = new request_1.AthenaRequest(athena, s3);
    return new client_1.AthenaClient(request, clientConfig);
}
exports.createClient = createClient;
//# sourceMappingURL=index.js.map