"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs = require("fs");
const request_1 = require("../lib/request");
const config = {
    bucketUri: 's3://xxxx',
    baseRetryWait: 2,
    retryWaitMax: 100,
    retryCountMax: 5,
};
const successStartQueryExecution = (params, callback) => {
    const data = { QueryExecutionId: 'queryid' };
    return callback(null, data);
};
const errorStartQueryExecution = (params, callback) => {
    return callback(new Error('can not start query'), null);
};
const successGetQueryExecution = (params, callback) => {
    const data = { QueryExecution: { Status: { State: 'SUCCEEDED' } } };
    return callback(null, data);
};
const runningGetQueryExecution = (params, callback) => {
    const data = { QueryExecution: { Status: { State: 'RUNNING' } } };
    return callback(null, data);
};
const cancelGetQueryExecution = (params, callback) => {
    const data = { QueryExecution: { Status: { State: 'CANCELLED' } } };
    return callback(null, data);
};
const failGetQueryExecution = (params, callback) => {
    const data = {
        QueryExecution: {
            Status: { State: 'FAILED', StateChangeReason: 'FAILED: Execution Error' },
        },
    };
    return callback(null, data);
};
const unknownGetQueryExecution = (params, callback) => {
    const data = { QueryExecution: { Status: { State: 'HOGE' } } };
    return callback(null, data);
};
const errorGetQueryExecution = (params, callback) => {
    return callback(new Error('can not check query'), null);
};
const successGetQueryResults = (params, callback) => {
    return callback(null, 'success');
};
const errorGetQueryResults = (params, callback) => {
    return callback(new Error('can not get query results'), null);
};
const successStopQueryExecution = (params, callback) => {
    return callback(null, 'success');
};
const errorStopQueryExecution = (params, callback) => {
    return callback(new Error('can not stop query'), null);
};
const throttlingErrorExecution = (params, callback) => {
    const error = {
        message: 'Rate exceeded',
        code: 'ThrottlingException',
    };
    return callback(error, null);
};
const successGetObject = (params) => {
    return {
        createReadStream: () => {
            return fs.createReadStream('./src/test/test.csv');
        },
    };
};
function getMockAthena() {
    const mock = {
        startQueryExecution: successStartQueryExecution,
        getQueryExecution: successGetQueryExecution,
        stopQueryExecution: successStopQueryExecution,
    };
    return mock;
}
function getMockS3() {
    const mock = {
        getObject: successGetObject,
    };
    return mock;
}
describe('Array', () => {
    describe('#startQuery()', () => {
        it('should return queryid when success to startQuery', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.startQuery('query', config).then((data) => {
                    assert.equal(data, 'queryid');
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when fail to startQuery', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                mockAthena.startQueryExecution = errorStartQueryExecution;
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.startQuery('query', config).catch((err) => {
                    assert.equal(err.message, 'can not start query');
                    return resolve();
                });
            }).then(done);
        });
        it('should return queryid when success to startQuery with encryption', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                const configWithEncryption = Object.assign({}, config, { encryptionOption: 'SSE_KMS', encryptionKmsKey: 'arn:xxxx:xxxx' });
                request.startQuery('query', configWithEncryption).then((data) => {
                    assert.equal(data, 'queryid');
                    return resolve();
                });
            }).then(done);
        });
        it('should retry when get ThrottlingException', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                mockAthena.startQueryExecution = throttlingErrorExecution;
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.startQuery('queryid', config).catch((err) => {
                    assert.equal(err.message, 'Rate exceeded');
                    return resolve();
                });
            }).then(done);
        });
    });
    describe('#checkQuery()', () => {
        it('should return true when query succeeded', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.checkQuery('queryid', config).then((data) => {
                    assert.equal(data, true);
                    return resolve();
                });
            }).then(done);
        });
        it('should return false when query running', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                mockAthena.getQueryExecution = runningGetQueryExecution;
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.checkQuery('queryid', config).then((data) => {
                    assert.equal(data, false);
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when query canceled', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                mockAthena.getQueryExecution = cancelGetQueryExecution;
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.checkQuery('queryid', config).catch((err) => {
                    assert.equal(err.message, 'FAILED: Query CANCELLED');
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when query failed', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                mockAthena.getQueryExecution = failGetQueryExecution;
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.checkQuery('queryid', config).catch((err) => {
                    assert.equal(err.message, 'FAILED: Execution Error');
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when query status unknown', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                mockAthena.getQueryExecution = unknownGetQueryExecution;
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.checkQuery('queryid', config).catch((err) => {
                    assert.equal(err.message, 'FAILED: UnKnown State HOGE');
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when get query failed', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                mockAthena.getQueryExecution = errorGetQueryExecution;
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.checkQuery('queryid', config).catch((err) => {
                    assert.equal(err.message, 'can not check query');
                    return resolve();
                });
            }).then(done);
        });
        it('should retry when get ThrottlingException', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                mockAthena.getQueryExecution = throttlingErrorExecution;
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.checkQuery('queryid', config).catch((err) => {
                    assert.equal(err.message, 'Rate exceeded');
                    return resolve();
                });
            }).then(done);
        });
    });
    describe('#stopQuery()', () => {
        it('should return success when success to stopQuery', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.stopQuery('queryid', config).then((data) => {
                    assert.equal(data, undefined);
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when fail to stopQuery', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                mockAthena.stopQueryExecution = errorStopQueryExecution;
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.stopQuery('queryid', config).catch((err) => {
                    assert.equal(err.message, 'can not stop query');
                    return resolve();
                });
            }).then(done);
        });
        it('should retry when get ThrottlingException', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                mockAthena.stopQueryExecution = throttlingErrorExecution;
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                request.stopQuery('queryid', config).catch((err) => {
                    assert.equal(err.message, 'Rate exceeded');
                    return resolve();
                });
            }).then(done);
        });
    });
    describe('#getResultsStream()', () => {
        it('should return getResultsStream', (done) => {
            new Promise((resolve) => {
                const mockAthena = getMockAthena();
                const mockS3 = getMockS3();
                const request = new request_1.AthenaRequest(mockAthena, mockS3);
                const readStream = request.getResultsStream('s3://xxxx/yyyy');
                return resolve();
            }).then(done);
        });
    });
});
//# sourceMappingURL=request.js.map