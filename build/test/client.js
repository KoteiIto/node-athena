"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const fs = require("fs");
const client_1 = require("../lib/client");
const request_1 = require("../lib/request");
const config = {
    bucketUri: 's3://xxxx',
    pollingInterval: 5,
};
const successStartQuery = (query, requestConfig) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return resolve('id');
        }, 10);
    });
};
const failStartQuery = (query, requestConfig) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return reject(new Error('can not start query'));
        }, 10);
    });
};
const successCheckQuery = (queryId, requestConfig) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return resolve(true);
        }, 10);
    });
};
const runningCheckQuery = (queryId, requestConfig) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return resolve(false);
        }, 10);
    });
};
const failCheckQuery = (queryId, requestConfig) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return reject(new Error('can not check query'));
        }, 10);
    });
};
const successStopQuery = (queryId, requestConfig) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return resolve();
        }, 10);
    });
};
const successGetQueryExecution = (queryId, requestConfig) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return resolve({
                ResultConfiguration: {
                    OutputLocation: 's3://xxxx/yyyy.csv',
                },
                QueryExecutionId: 'id',
            });
        }, 10);
    });
};
const failStopQuery = (queryId, requestConfig) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            return reject(new Error('can not stop query'));
        }, 10);
    });
};
const successGetResultsStream = (s3Uri) => {
    return fs.createReadStream('./src/test/test.csv');
};
const failGetResultsStream = (s3Uri) => {
    throw new Error('can not get object');
};
function getMockRequest() {
    const mock = new request_1.AthenaRequest(null, null);
    mock.startQuery = successStartQuery;
    mock.checkQuery = successCheckQuery;
    mock.stopQuery = successStopQuery;
    mock.getResultsStream = successGetResultsStream;
    mock.getQueryExecution = successGetQueryExecution;
    return mock;
}
describe('Array', () => {
    describe('#execute()', () => {
        it('should return success when success to execute query (callback)', (done) => {
            const mockReqest = getMockRequest();
            const client = new client_1.AthenaClient(mockReqest, config);
            client.execute('query', (err, result) => {
                assert.equal(result.records.length, 10);
                assert.equal(result.queryExecution.QueryExecutionId, 'id');
                done();
            });
        });
        it('should return success when success to execute query (promise)', (done) => {
            new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                const mockReqest = getMockRequest();
                const client = new client_1.AthenaClient(mockReqest, config);
                const result = yield client.execute('query').toPromise();
                assert.equal(result.records.length, 10);
                assert.equal(result.records[2].name, 'hoge3');
                assert.equal(result.records[7].id, '8');
                assert.equal(result.queryExecution.QueryExecutionId, 'id');
                resolve();
            })).then(done);
        });
        it('should return success when success to execute query (stream)', (done) => {
            new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                const mockReqest = getMockRequest();
                const client = new client_1.AthenaClient(mockReqest, config);
                const stream = yield client.execute('query').toStream();
                const records = [];
                stream.on('data', (record) => {
                    records.push(record);
                });
                stream.on('query_end', (queryExecution) => {
                    assert.equal(queryExecution.QueryExecutionId, 'id');
                });
                stream.on('end', () => {
                    assert.equal(records.length, 10);
                    assert.equal(records[2].name, 'hoge3');
                    assert.equal(records[7].id, '8');
                    resolve();
                });
            })).then(done);
        });
        it('should return success when execute query multiple (promise)', (done) => {
            new Promise((resolve) => {
                const mockReqest = getMockRequest();
                const client = new client_1.AthenaClient(mockReqest, config);
                const promises = [];
                for (let i = 0; i < 5; i++) {
                    promises.push(client.execute('query').toPromise());
                }
                Promise.all(promises).then((results) => {
                    results.forEach((result) => {
                        assert.equal(result.records.length, 10);
                        assert.equal(result.queryExecution.QueryExecutionId, 'id');
                    });
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when fail to start query (callback)', (done) => {
            const mockReqest = getMockRequest();
            mockReqest.startQuery = failStartQuery;
            const client = new client_1.AthenaClient(mockReqest, config);
            client.execute('query', (err, data) => {
                assert.equal(err.message, 'can not start query');
                assert.equal(data, undefined);
                done();
            });
        });
        it('should return error when fail to start query (promise)', (done) => {
            new Promise((resolve) => {
                const mockReqest = getMockRequest();
                mockReqest.startQuery = failStartQuery;
                const client = new client_1.AthenaClient(mockReqest, config);
                client
                    .execute('query')
                    .toPromise()
                    .catch((err) => {
                    assert.equal(err.message, 'can not start query');
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when fail to start query (stream)', (done) => {
            new Promise((resolve) => {
                const mockReqest = getMockRequest();
                mockReqest.startQuery = failStartQuery;
                const client = new client_1.AthenaClient(mockReqest, config);
                const stream = client.execute('query').toStream();
                stream.on('error', (err) => {
                    assert.equal(err.message, 'can not start query');
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when fail to check query (callback)', (done) => {
            const mockReqest = getMockRequest();
            mockReqest.checkQuery = failCheckQuery;
            const client = new client_1.AthenaClient(mockReqest, config);
            client.execute('query', (err, data) => {
                assert.equal(err.message, 'can not check query');
                assert.equal(data, null);
                done();
            });
        });
        it('should return error when fail to check query (promise)', (done) => {
            new Promise((resolve) => {
                const mockReqest = getMockRequest();
                mockReqest.checkQuery = failCheckQuery;
                const client = new client_1.AthenaClient(mockReqest, config);
                client
                    .execute('query')
                    .toPromise()
                    .catch((err) => {
                    assert.equal(err.message, 'can not check query');
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when fail to check query (stream)', (done) => {
            new Promise((resolve) => {
                const mockReqest = getMockRequest();
                mockReqest.checkQuery = failCheckQuery;
                const client = new client_1.AthenaClient(mockReqest, config);
                const stream = client.execute('query').toStream();
                stream.on('error', (err) => {
                    assert.equal(err.message, 'can not check query');
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when fail to get result stream (callback)', (done) => {
            const mockReqest = getMockRequest();
            mockReqest.getResultsStream = failGetResultsStream;
            const client = new client_1.AthenaClient(mockReqest, config);
            client.execute('query', (err, data) => {
                assert.equal(err.message, 'can not get object');
                assert.equal(data, null);
                done();
            });
        });
        it('should return error when fail to get result stream (promise)', (done) => {
            new Promise((resolve) => {
                const mockReqest = getMockRequest();
                mockReqest.getResultsStream = failGetResultsStream;
                const client = new client_1.AthenaClient(mockReqest, config);
                client
                    .execute('query')
                    .toPromise()
                    .catch((err) => {
                    assert.equal(err.message, 'can not get object');
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when fail to get result stream (stream)', (done) => {
            new Promise((resolve) => {
                const mockReqest = getMockRequest();
                mockReqest.getResultsStream = failGetResultsStream;
                const client = new client_1.AthenaClient(mockReqest, config);
                const stream = client.execute('query').toStream();
                stream.on('error', (err) => {
                    assert.equal(err.message, 'can not get object');
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when query timeout (callback)', (done) => {
            const mockReqest = getMockRequest();
            mockReqest.checkQuery = runningCheckQuery;
            const client = new client_1.AthenaClient(mockReqest, Object.assign({}, config, { queryTimeout: 100, pollingInterval: 20 }));
            client.execute('query', (err, data) => {
                assert.equal(err.message, 'query timeout');
                done();
            });
        });
        it('should return error when query timeout (promise)', (done) => {
            new Promise((resolve) => {
                const mockReqest = getMockRequest();
                mockReqest.checkQuery = runningCheckQuery;
                const client = new client_1.AthenaClient(mockReqest, Object.assign({}, config, { queryTimeout: 100, pollingInterval: 20 }));
                client
                    .execute('query')
                    .toPromise()
                    .catch((err) => {
                    assert.equal(err.message, 'query timeout');
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when query timeout (stream)', (done) => {
            new Promise((resolve) => {
                const mockReqest = getMockRequest();
                mockReqest.checkQuery = runningCheckQuery;
                const client = new client_1.AthenaClient(mockReqest, Object.assign({}, config, { queryTimeout: 100, pollingInterval: 20 }));
                const stream = client.execute('query').toStream();
                stream.on('error', (err) => {
                    assert.equal(err.message, 'query timeout');
                    return resolve();
                });
            }).then(done);
        });
        it('should return error when fail to stop query (callback)', (done) => {
            const mockReqest = getMockRequest();
            mockReqest.checkQuery = runningCheckQuery;
            mockReqest.stopQuery = failStopQuery;
            const client = new client_1.AthenaClient(mockReqest, Object.assign({}, config, { queryTimeout: 10, pollingInterval: 100 }));
            client.execute('query', (err, data) => {
                assert.equal(err.message, 'can not stop query');
                assert.equal(data, null);
                done();
            });
        });
    });
});
//# sourceMappingURL=client.js.map