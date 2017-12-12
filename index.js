"use strict";
const _each = require("lodash.foreach");
const awsParamStore = require("aws-param-store");

// declare a global results object
var results = {};

function getBasePath(path) {
  var a = path.split("/");
  a.pop();
  return a.join("/");
}

module.exports = function(path) {
  // get the last part of the path
  let key = path.split("/").pop();

  // get the basePath (everything except the key) from the SSM path
  // ie /test/staging/FOO's basePath is just /test/staging
  // this way we can have multiple path patterns in our config.js.
  // although idk why you'd actually want to do that.

  let basePath = getBasePath(path);

  // declare a local results object
  let r = {};

  // if we don't already have results globally from this particular path, go ahead and query AWS
  if (!results[basePath]) {
    // do this sync because we need variables before app bootup anyway
    try {
      let parameters = awsParamStore.newQuery(basePath).executeSync();

      // filter through the results and give them a nice key/value structure
      _each(parameters, function(requestResult) {
        let k = requestResult.Name.split("/").pop();
        r[k] = requestResult.Value;
      });

      // add the results from the query to the global results object keyed under their basepath
      results[basePath] = r;

      return results[basePath][key];

    } catch (err) {
      console.log(err);
    }
  }
};
