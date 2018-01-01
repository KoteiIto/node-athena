[![Build Status](https://travis-ci.org/KoteiIto/node-athena.svg?branch=master)](https://travis-ci.org/KoteiIto/node-athena)
[![Coverage Status](https://coveralls.io/repos/github/KoteiIto/node-athena/badge.svg?branch=master)](https://coveralls.io/github/KoteiIto/node-athena?branch=master)

athena-client - a nodejs simple aws athena client
===========================
Install with:

    npm install athena-client

## Usage Example

```js
var awsConfig = {
    region: 'xxxx',
}
var clientConfig = {
    bucketUri: 's3://xxxx'
}
 
var athena = require("athena-client")
var client = athena.createClient(clientConfig, awsConfig)
 
client.execute('SELECT 1', function(err, data) {
    if (err) {
        return console.error(err)
    }
    console.log(data)
})
 
// You can also execute query with promises
client.execute('SELECT 1').toPromise()
.then(function(data) {
    console.log(data)
}).catch(function(err) {
    console.error(err)
})
```

# API
### athena = require("athena-client")
This module exposes the `createClient` method, which execute query to AWS Athena

### client = athena.createClient([_clientConfig_], [_awsConfig_])
Returns a client instance attached to the account specified by the given clientConfig and awsConfig .


#### `clientConfig` object properties
| Property  | Default   | Description |
|-----------|-----------|-------------|
| bucketUri      | __Required__ | URI of S3 bucket for saving a query results file(*.csv) and a metadata file (*.csv.metadata) |
| pollingInterval      | 1000  |  Interval of polling sql results (ms) |
| queryTimeout      | 0      | Timeout of query execution.  `0` is no timeout |
| concurrentExecMax      | 5      | The number of cuncurrent execution of query max. it should be set `smaller than AWS Service limit`(default is 5) |


The awsConfig can be specified as an object with `region` and `accessKeyId` and `secretAccessKey` members  such as the following:

```javascript
var awsConfig = {
    region: 'xxxx',
    accessKeyId: 'xxxx', // Optional
    secretAccessKey: 'xxxx', // Optional
}
```

### client.execute([_query_], [_callback_])
Returns query result.

```javascript
client.execute('SELECT 1', function(err, data) {
    if (err) {
        return console.error(err)
    }
    console.log(data)
})

client.execute('SELECT 1').toPromise()
.then(function(data) {
    console.log(data)
}).catch(function(err) {
    console.error(err)
})

```
