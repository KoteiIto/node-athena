'use strict'

const AWS = require('aws-sdk')
const Request = require('./lib/request')
const Client = require('./lib/client')

const createClient = (clientConfig, awsConfig) => {
    clientConfig = clientConfig || {}
    if (clientConfig.format) {
        console.log('[WARN] The config "format" will be unusable in the next major version update')
    }
    AWS.config.update(awsConfig)
    let athena = new AWS.Athena({ apiVersion: '2017-05-18' })
    let request = Request.create(athena)
    return Client.create(request, clientConfig)
}

const client = (awsConfig, clientConfig) => {
    console.log('[WARN] The function "Client([awsConfig], [clientConfig])" will be unusable in the next major version update. Please use "createClient([clientConfig], [awsConfig])".')
    return createClient(clientConfig, awsConfig)
}

exports.createClient = createClient
exports.Client = client
