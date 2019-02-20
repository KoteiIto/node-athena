"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaultBaseRetryWait = 200;
const defaultRetryWaitMax = 10000;
const defaultRetryCountMax = 10;
class AthenaRequest {
    constructor(athena, s3) {
        this.athena = athena;
        this.s3 = s3;
    }
    startQuery(query, config) {
        return new Promise((resolve, reject) => {
            let retryCount = 0;
            const params = {
                QueryString: query,
                ResultConfiguration: Object.assign({ OutputLocation: config.bucketUri }, (config.encryptionOption && {
                    EncryptionConfiguration: Object.assign({ EncryptionOption: config.encryptionOption }, (config.encryptionKmsKey && {
                        KmsKey: config.encryptionKmsKey,
                    })),
                })),
                QueryExecutionContext: {
                    Database: config.database || 'default',
                },
                WorkGroup: config.workGroup || 'primary',
            };
            const loopFunc = () => {
                this.athena.startQueryExecution(params, (err, data) => {
                    if (err && isRetryException(err) && canRetry(retryCount, config)) {
                        let wait = (config.baseRetryWait || defaultBaseRetryWait) *
                            Math.pow(2, retryCount++);
                        wait = Math.min(wait, config.retryWaitMax || defaultRetryWaitMax);
                        return setTimeout(loopFunc, wait);
                    }
                    else if (err) {
                        return reject(err);
                    }
                    return resolve(data.QueryExecutionId);
                });
            };
            loopFunc();
        });
    }
    checkQuery(queryId, config) {
        return new Promise((resolve, reject) => {
            this.getQueryExecution(queryId, config)
                .then((queryExecution) => {
                const state = queryExecution.Status.State;
                let isSucceed = false;
                let error = null;
                switch (state) {
                    case 'QUEUED':
                    case 'RUNNING':
                        isSucceed = false;
                        break;
                    case 'SUCCEEDED':
                        isSucceed = true;
                        break;
                    case 'FAILED':
                        isSucceed = false;
                        const errMsg = queryExecution.Status.StateChangeReason ||
                            'FAILED: Execution Error';
                        error = new Error(errMsg);
                        break;
                    case 'CANCELLED':
                        isSucceed = false;
                        error = new Error('FAILED: Query CANCELLED');
                        break;
                    default:
                        isSucceed = false;
                        error = new Error(`FAILED: UnKnown State ${state}`);
                }
                if (error) {
                    return reject(error);
                }
                return resolve(isSucceed);
            })
                .catch((err) => {
                return reject(err);
            });
        });
    }
    stopQuery(queryId, config) {
        return new Promise((resolve, reject) => {
            let retryCount = 0;
            const params = {
                QueryExecutionId: queryId,
            };
            const loopFunc = () => {
                this.athena.stopQueryExecution(params, (err) => {
                    if (err && isRetryException(err) && canRetry(retryCount, config)) {
                        const wait = Math.pow(config.baseRetryWait || defaultBaseRetryWait, retryCount++);
                        return setTimeout(loopFunc, wait);
                    }
                    else if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            };
            loopFunc();
        });
    }
    getQueryExecution(queryId, config) {
        return new Promise((resolve, reject) => {
            let retryCount = 0;
            const params = {
                QueryExecutionId: queryId,
            };
            const loopFunc = () => {
                this.athena.getQueryExecution(params, (err, data) => {
                    if (err && isRetryException(err) && canRetry(retryCount, config)) {
                        const wait = Math.pow(config.baseRetryWait || defaultBaseRetryWait, retryCount++);
                        return setTimeout(loopFunc, wait);
                    }
                    else if (err) {
                        return reject(err);
                    }
                    return resolve(data.QueryExecution);
                });
            };
            loopFunc();
        });
    }
    getResultsStream(s3Uri) {
        const arr = s3Uri.replace('s3://', '').split('/');
        const bucket = arr.shift() || '';
        const key = arr.join('/');
        return this.s3
            .getObject({
            Bucket: bucket,
            Key: key,
        })
            .createReadStream();
    }
}
exports.AthenaRequest = AthenaRequest;
function isRetryException(err) {
    return (err.code === 'ThrottlingException' ||
        err.code === 'TooManyRequestsException' ||
        err.message === 'Query exhausted resources at this scale factor');
}
function canRetry(retryCount, config) {
    return retryCount < (config.retryCountMax || defaultRetryCountMax);
}
//# sourceMappingURL=request.js.map