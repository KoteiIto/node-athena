athena-client - a nodejs simple aws athena client
===========================
Install with:

    npm install athena-client

## Usage Example

```js
var credentials = {
    accessKeyId: 'xxxx',
    secretAccessKey: 'xxxx',
    region: 'xxxx',
}
var config = {
    bucketUri = 's3://bucketname'
}

var Athena = require("athena-client")
var client = Athena.Client(credentials, config)

client.execute('SELECT 1', function(err, data)) {
    if (err) {
        return console.error(err)
    }
    console.log(data)
})

// You can also execute query with promises
client.execute('SELECT 1').then(function(data) {
    console.log(data)
}).catch(function(err) {
    console.error(err)
})
```

# API
### athena = require("athena-client")
This module exposes the `Client` method, which execute query to AWS Athena

### client = athena.Client([_credentials_], [_config_])
Returns a client instance attached to the account specified by the given credentials and config.

The credentials can be specified as an object with `accessKeyId` and `secretAccessKey` and `region` members  such as the following:

```javascript
var credentials = {
    accessKeyId: 'xxxx',
    secretAccessKey: 'xxxx',
    region: 'xxxx',
}
```

#### `config` object properties
| Property  | Default   | Description |
|-----------|-----------|-------------|
| bucketUrl      | __Required__ | URI of s3 bucket|
| pollingInterval      | 500  |  Interval of polling sql results (ms) |
| queryTimeout      | 0      | Timeout of query execution.  `0` is no timeout |
| format | 'array' | If `'array'`, the result of the query is as the following `[ { _col0: '1' } , { _col0: '2' }]` . If `'raw'`,  the  result of query is same with `aws-sdk`  |

### client.execute([_query_], [_options_], [_callback_])
Returns query result. The _options_ can be specified as an object with `timeout` and `format` members  such as the following:

```javascript
var options = {
    timeout: 3000,
    format: 'raw',
}
```

```javascript
client.execute('SELECT 1', function(err, data)) {
    if (err) {
        return console.error(err)
    }
    console.log(data)
})

client.execute('SELECT 1', {timeout: 3000}, function(err, data)) {
    if (err) {
        return console.error(err)
    }
    console.log(data)
})

client.execute('SELECT 1').then(function(data) {
    console.log(data)
}).catch(function(err) {
    console.error(err)
})

```