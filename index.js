"use strict";
const _each = require("lodash.foreach");
const awsParamStore = require("aws-param-store");
const AWS = require("aws-sdk");
const AWSConfig = new AWS.Config();

// declare a global results object
var results = {};

function getBasePath(path) {
  var a = path.split("/");
  a.pop();
  return a.join("/");
}

module.exports = function(path) {
  if (AWSConfig.credentials == null) {
    console.log(
      "WARNING: No AWS credentials, not connecting to SSM for secrets..."
    );
  } else if (!AWSConfig.region) {
    console.log(
      "WARNING: No AWS region configured, not connecting to SSM for secrets..."
    );
  } else if (process.env.AWS_SSM == "false") {
    console.log(
      "INFO: AWS_SSM is set to false, not connecting to SSM for secrets..."
    );
  } else {
    // get the last part of the path
    let key = path.split("/").pop();

    // get the basePath (everything except the key) from the SSM path
    // ie /test/staging/FOO's basePath is just /test/staging
    // this way we can have multiple path patterns in our config.js.
    // although idk why you'd actually want to do that.

    let basePath = getBasePath(path);

    // declare a local results object
    let r = {};

    try {
      // if we don't already have results globally from this particular path, go ahead and query AWS
      if (!results[basePath]) {
        // do this sync because we need variables before app bootup anyway
        let parameters = awsParamStore.newQuery(basePath).executeSync();

        // filter through the results and give them a nice key/value structure
        _each(parameters, function(requestResult) {
          let k = requestResult.Name.split("/").pop();
          r[k] = requestResult.Value;
        });

        // add the results from the query to the global results object keyed under their basepath
        results[basePath] = r;
      }

      // return the results for this particular basePath/key pair
      return results[basePath][key];
    } catch (err) {
      console.log(err);
    }
  }
};
