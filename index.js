'use strict';
const _each = require('lodash.foreach');
const awsParamStore = require('aws-param-store');
var results = {};

function getBasePath(path) {
  var a = path.split('/');
  a.pop();
  return a.join('/');
}

module.exports = function(path) {
  let key = path.split('/').pop();
  let r = {};
  let basePath = getBasePath(path);

  if (!results[basePath]) {

    let parameters = awsParamStore.newQuery(basePath).executeSync();
    _each(parameters, function(requestResult) {
      let k = requestResult.Name.split('/').pop();
      r[k] = requestResult.Value;
    });

    results[basePath] = r;
  }

  return results[basePath][key];
};
