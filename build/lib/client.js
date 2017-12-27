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
const byline_1 = require("byline");
const timers_1 = require("timers");
const stream_1 = require("./stream");
const util = require("./util");
const defaultPollingInterval = 1000;
const defaultQueryTimeout = 0;
const defaultConcurrentExecMax = 5;
const defaultExecRightCheckInterval = 100;
class AthenaClient {
    constructor(request, config) {
        this.request = request;
        this.config = config;
        this.concurrentExecNum = 0;
    }
    execute(query, callback) {
        const currentConfig = Object.assign({}, this.config);
        const athenaStream = new stream_1.AthenaStream(currentConfig);
        this._execute(query, athenaStream, currentConfig);
        if (callback !== undefined) {
            let isEnd = false;
            const records = [];
            let queryExecution;
            athenaStream.on('data', (record) => {
                records.push(record);
            });
            athenaStream.on('query_end', (q) => {
                queryExecution = q;
            });
            athenaStream.on('end', (record) => {
                if (isEnd) {
                    return;
                }
                const result = {
                    records,
                    queryExecution,
                };
                callback(undefined, result);
            });
            athenaStream.on('error', (err) => {
                isEnd = true;
                callback(err);
            });
            return;
        }
        else {
            return {
                toPromise: () => {
                    return new Promise((resolve, reject) => {
                        const records = [];
                        let queryExecution;
                        athenaStream.on('data', (record) => {
                            records.push(record);
                        });
                        athenaStream.on('query_end', (q) => {
                            queryExecution = q;
                        });
                        athenaStream.on('end', (record) => {
                            const result = {
                                records,
                                queryExecution,
                            };
                            return resolve(result);
                        });
                        athenaStream.on('error', (err) => {
                            return reject(err);
                        });
                    });
                },
                toStream: () => {
                    return athenaStream;
                },
            };
        }
    }
    _execute(query, athenaStream, config) {
        return __awaiter(this, void 0, void 0, function* () {
            while (!this.canStartQuery()) {
                yield util.sleep(config.execRightCheckInterval || defaultExecRightCheckInterval);
            }
            let queryExecution;
            try {
                this.startQuery();
                const queryId = yield this.request.startQuery(query, config);
                let isTimeout = false;
                if ((config.queryTimeout || defaultQueryTimeout) !== 0) {
                    timers_1.setTimeout(() => {
                        isTimeout = true;
                    }, config.queryTimeout || defaultQueryTimeout);
                }
                while (!isTimeout && !(yield this.request.checkQuery(queryId, config))) {
                    yield util.sleep(config.pollingInterval || defaultPollingInterval);
                }
                if (isTimeout) {
                    yield this.request.stopQuery(queryId, config);
                    throw new Error('query timeout');
                }
                queryExecution = yield this.request.getQueryExecution(queryId, config);
                athenaStream.emit('query_end', queryExecution);
                this.endQuery();
            }
            catch (err) {
                this.endQuery();
                athenaStream.emit('error', err);
                athenaStream.end(new Buffer(''));
                return;
            }
            try {
                if (!queryExecution.ResultConfiguration ||
                    !queryExecution.ResultConfiguration.OutputLocation) {
                    throw new Error('query outputlocation is empty');
                }
                const resultsStream = this.request.getResultsStream(queryExecution.ResultConfiguration.OutputLocation);
                resultsStream.pipe(new byline_1.LineStream()).pipe(athenaStream);
            }
            catch (err) {
                athenaStream.emit('error', err);
                athenaStream.end(new Buffer(''));
                return;
            }
        });
    }
    canStartQuery() {
        return (this.concurrentExecNum <
            (this.config.concurrentExecMax || defaultConcurrentExecMax));
    }
    startQuery() {
        this.concurrentExecNum = Math.min(this.concurrentExecNum + 1, this.config.concurrentExecMax || defaultConcurrentExecMax);
    }
    endQuery() {
        this.concurrentExecNum = Math.max(this.concurrentExecNum - 1, 0);
    }
}
exports.AthenaClient = AthenaClient;
//# sourceMappingURL=client.js.map