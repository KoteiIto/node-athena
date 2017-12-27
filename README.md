[![Build Status](https://travis-ci.org/KoteiIto/node-athena.svg?branch=master)](https://travis-ci.org/KoteiIto/node-athena)
[![Coverage Status](https://coveralls.io/repos/github/KoteiIto/node-athena/badge.svg?branch=master)](https://coveralls.io/github/KoteiIto/node-athena?branch=master)

athena-client - a  simple aws athena client for nodejs and typescript
===========================
This is version 2.x document. 1.x document is [here](https://github.com/KoteiIto/node-athena/tree/1.x)

Install with:

    npm install athena-client

## Usage Example

```js
var clientConfig = {
    bucketUri: 's3://xxxx'
}

var awsConfig = {
    region: 'xxxx', 
}
 
var athena = require("athena-client")
var client = athena.createClient(clientConfig, awsConfig)

// receive result by callback
client.execute('SELECT 1', function(err, data) {
    if (err) {
        return console.error(err)
    }
    console.log(data)
})
 
// receive result by promise
client.execute('SELECT 1').toPromise()
.then(function(data) {
    console.log(data)
}).catch(function(err) {
    console.error(err)
})

// receive result by stream
var stream = client.execute('SELECT 1').toStream()
stream.on('data', (record) => {
  console.log(record)
})
stream.on('query_end', (queryExecution) => {
  console.log(queryExecution)
})
stream.on('end', () => {
  console.log('end')
})
stream.on('error', (e) => {
  console.error(e)
})
```

# API
### athena = require("athena-client")
This module exposes the `createClient` method, which execute query to AWS Athena

### client = athena.createClient([_clientConfig_], [_awsConfig_])
Returns a client instance attached to the account specified by the given clientConfig and awsConfig.

#### `clientConfig` object properties
| Property  | Default   | Description |
|-----------|-----------|-------------|
| bucketUri      | __Required__ | URI of S3 bucket for saving a query results file(*.csv) and a metadata file (*.csv.metadata) |
| pollingInterval      | 1000  |  Interval of polling sql results (ms) |
| queryTimeout      | 0      | Timeout of query execution.  `0` is no timeout |
| concurrentExecMax      | 5      | The number of cuncurrent execution of query max. It should be set `smaller than AWS Service limit`(default is 5) |
| maxBufferSize     | '128M' | Maximum buffer when retrieving query results |

#### `awsConfig` object properties
| Property  | Default   | Description |
|-----------|-----------|-------------|
| region        | __Required__ | Your Athena and S3 region |
| accessKeyId      | undifined  | Your IAM accessKeyId. This is optional |
| secretAccessKey      | undifined | Your IAM secretAccessKey. This is optional |

### client.execute([_query_], [_callback_])
It will return the following result.
If you want to know more about params of `queryExecution`, please refer to the aws-sdk [document](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Athena.html#getQueryExecution-property)  

```json
{
    "records": [
        {"col1": "val1", "col2": "val2"},
        {"col1": "val3", "col2": "val4"}
    ],
    "queryExecution": {
        "Query": "", 
        "QueryExecutionId": "", 
        "ResultConfiguration": {
            "OutputLocation": ""
        }, 
        "Statistics": {
            "DataScannedInBytes": 0, 
            "EngineExecutionTimeInMillis": 137
        }, 
        "Status": {
            "CompletionDateTime": "2017-12-31T16:03:53.493Z", 
            "State": "SUCCEEDED", 
            "SubmissionDateTime": "2017-12-31T16:03:53.209Z"
        }
    }
}
```

### client.execute([_query_]).toPromise()
It will return promise object to get result.

### client.execute([_query_]).toStream()
It will return stream object to get result. If your query results are very `large`, we recommend using this stream. 

```js
// Get record one by one
stream.on('data', (record) => {
  console.log(record) // {"col1": "val1", "col2": "val2"}
})

// When query succeed, this event will emit.
stream.on('query_end', (queryExecution) => {
  console.log(queryExecution) // {"QueryExecutionId": "", ...}
})

stream.on('end', () => {
  console.log('end')
})
stream.on('error', (e) => {
  console.error(e)
})
```