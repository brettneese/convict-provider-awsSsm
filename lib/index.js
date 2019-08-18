"use strict";
const _each = require("lodash.foreach");
const awsParamStore = require("aws-param-store");
const AWS = require("aws-sdk");

// global results object, for caching
let RESULTS = {};

/**
 * 
 * Set options to be passed when calling AWS via env vars.
 * This is mostly useful for testing, where we mock SSM using localstack
 * and a local SSM endpoint, which is currently the only option supported.
 ≈
 */

module.exports.awsOptions = function() {
  let awsOptions = {};

  if (process.env.AWS_ENDPOINT_SSM)
    awsOptions.endpoint = process.env.AWS_ENDPOINT_SSM;

  return awsOptions;
};

/**
 *
 * Check if we're authenticated to AWS properly.
 * If we're not, maybe that was intentional, so
 * just log a message and don't do anything.
 *
 */

module.exports.checkIfAuthed = function() {
  const AWSConfig = new AWS.Config();

  if (AWSConfig.credentials == null) {
    console.warning(
      "convictProviderAwsSSM: No AWS credentials, not connecting to SSM for secrets..."
    );
    return false;
  }

  if (!AWSConfig.region) {
    console.warning(
      "convictProviderAwsSSM:  No AWS region configured, not connecting to SSM for secrets..."
    );

    return false;
  }

  if (process.env.AWS_SSM == "false") {
    console.info(
      "convictProviderAwsSSM: AWS_SSM is set to false, not connecting to SSM for secrets..."
    );
    return false;
  }
  return true;
};

/**
 *
 * Given a basepath, get parameters from SSM.
 * @param {string} basePath - A basePath, see @link{this.getBasePath}
 * @return {Object[]} an array of parameter objects as fetched from AWS, see @link{https://docs.aws.amazon.com/systems-manager/latest/APIReference/API_GetParameter.html}
 *
 */

module.exports.getSSMParameters = function(basePath) {
  try {
    let parameters = awsParamStore
      .newQuery(basePath, this.awsOptions())
      .executeSync();

    return parameters;
  } catch (err) {
    console.error("convictProviderAwsSSM: error retrieving parameter", err);

    return {};
  }
};

/**
 *
 * Given a path, get just the key.
 * @param {string} path - A path to a key, ie "/i/am/a/key"
 * @return {String} the key, ie "key"
 * @example
 *  console.log(this.key('/i/am/a/key')) // "key"
 */
module.exports.key = function(path) {
  return path.split("/").pop();
};

/**
 *
 * Given an array of parameters fetched from SSM, parse them into our own structure.
 * @param {Object[]} - An array of parameters.
 * @return {Object} the parsed object of simple key value pairs.
 * @example
 *
 */

module.exports.parseParameters = function(parameters, basePath) {
  let r = {};

  if (parameters.length > 0) {
    // filter through the results and give them a simple key/value structure
    parameters.foreach(function(parameter) {
      let k = key(parameter.Name);
      r[k] = parameter.Value;
    });
  }

  return r;
};

module.exports.getBasePath = function(path) {
  // get the basePath (everything except the key) from the SSM path
  // ie /test/staging/FOO's basePath is just /test/staging
  // this way we can have multiple path patterns in our config.js.
  // although idk why you'd actually want to do that.

  var a = path.split("/");
  a.pop();
  return a.join("/");
};

module.exports.getKey = function(path) {
  // declare a local results object
  let r = {};
  let key = this.key(path);
  let basePath = this.getBasePath(path);

  // if we don't already have results globally from this particular path, go ahead and query AWS
  if (!RESULTS[basePath]) {
    let parameters = this.getSSMParameters(basePath);
    let r = this.parseParameters(parameters, basePath, results);

    // add the results from the query to the global results object keyed under their basepath
    RESULTS[basePath] = r;
  }

  return RESULTS[basePath][key];
};

/**
 * Given a plain object Convict Schema, fetch any values with a `providerPath` from SSM
 * and return a key/value object with values to be merged in with the schema.
 * @param {Object} schema - A Convict configuration schema.
 * @return {Object} A config object with key/values to be merged in
 */

module.exports.parseConvictConfig = function(schema) {
  if (this.checkIfAuthed() == false) {
    return {};
  }

  let returnObj = {};
  let keys = Object.keys(schema);

  keys.forEach(key => {
    // @todo: support deeply nested configs
    let path = schema[key].providerPath;
    let value = this.getKey(path);

    returnObj[key] = value;
  });

  return returnObj;
};
