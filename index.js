'use strict';
const _each = require('lodash.foreach');
const awsParamStore = require('aws-param-store');
var results = {};

class paramStoreProvider {
  constructor(basePath) {
    let parameters = awsParamStore.newQuery(basePath).executeSync();

    _each(parameters, function(requestResult) {
      let key = requestResult.Name.split('/').pop();
      results[key] = requestResult.Value;
    });
  }
  
  get(key) {
    return results[key];
  }
}

module.exports = paramStoreProvider;