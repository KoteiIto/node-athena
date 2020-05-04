"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const aws = require("aws-sdk");
const athena = require("../index");
describe('Array', () => {
    describe('#createClient()', () => {
        it('should return athenaClient', (done) => {
            const client = athena.createClient({ bucketUri: 's3://xxxx' }, { region: 'xxxx' });
            assert.notEqual(client, undefined);
            done();
        });
        it('can accept awsSdkInstance', (done) => {
            const client = athena.createClient({ bucketUri: 's3://xxxx' }, { region: 'xxxx' }, { s3: new aws.S3({ apiVersion: 'latest' }) });
            assert.notEqual(client, undefined);
            done();
        });
    });
    describe('#setConcurrentExecMax()', () => {
        it('should no error', (done) => {
            athena.setConcurrentExecMax(10);
            done();
        });
    });
});
//# sourceMappingURL=index.js.map