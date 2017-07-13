'use strict'

const AWS = require('aws-sdk')
const Request = require('./lib/request')
const Client = require('./lib/client')

exports.Client = (credentials, config) => {
    config = config || {}
    AWS.config.update(credentials)
    let athena = new AWS.Athena({apiVersion: '2017-05-18'})
    let request = Request.create(athena)
    return Client.create(request, config)
}