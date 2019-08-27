"use strict";
const awsParamStore = require("aws-param-store");
const AWS = require("aws-sdk");
const utils = require("convict-provider-utils");

// global results object, for caching
let RESULTS = {};
let _ = {};

/**
 * A parameter from AWS SSM
 * @see @link{https://docs.aws.amazon.com/systems-manager/latest/APIReference/API_GetParameter.html}
 * @typedef {Object} Parameter
 * @property {string} ARN
 * @property {number} LastModifiedDate
 * @property {string} Name - name of the parameter, including its full path (ie, "/staging/foo/bar")
 * @property {string} Selector
 * @property {string} SourceResult
 * @property {string} Type
 * @property {string} Value - value of the parameter (ie, "xyzzy")
 * @property {string} Version
 */

/**
 *
 * Set options to be passed when calling AWS via env vars.
 * This is mostly useful for testing, where we mock SSM using localstack
 * and a local SSM endpoint, which is currently the only option supported.
 *
 */

_.awsOptions = function () {
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

_.checkIfAuthed = function () {
  const AWSConfig = new AWS.Config();

  if (AWSConfig.credentials == null) {
    console.warn(
      "convictProviderAwsSSM: No AWS credentials, not connecting to SSM for secrets..."
    );
    return false;
  }

  if (!AWSConfig.region) {
    console.warn(
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
 * @param {string} basePath - A basePath, see @link{_.getBasePath}
 * @return {Parameter[]} an array of parameter objects
 *
 */

_.getSSMParameters = function (basePath) {
  try {
    let parameters = awsParamStore
      .newQuery(basePath, _.awsOptions())
      .executeSync();

    return parameters;
  } catch (err) {
    console.error("convictProviderAwsSSM: error retrieving parameter", err);

    return [{}];
  }
};

/**
 *
 * Given an array of parameters fetched from SSM, parse them into keys and values,
 * using only the key at the end of the path as the key and the parameter value as a parameter.
 *
 * There isn't a risk of collision, as this is only used within the scope of a basePath.
 *
 * @param {Parameter[]} - An array of parameters.
 * @return {Object} the parsed object of simple key/values pairs.
 *
 * @example
 *
 * // Given an array of parameters fetched from AWS that looks this:
 * let parameters = [{
 *  Name: "/foo/bar"
 *  Value: "xyzzy"
 * }]
 *
 * console.log(parseParameters(parameters))
 * // {
 * //  bar: "xyzzy"
 * // }
 *
 *
 */

_.parseParameters = function (parameters) {
  let r = {};

  if (parameters.length > 0) {
    parameters.forEach(function (parameter) {
      let k = _.key(parameter.Name);
      r[k] = parameter.Value;
    });
  }

  return r;
};

/**
 *
 * Get the basePath (everything except the key) from the SSM path.
 * This allows us to use multiple paths in our Convict schema.
 * @param {string} path - A path to a key, ie "/i/am/a/key"
 * @return {String} the key, ie "key"
 * @example
 *  console.log(_.key('/i/am/a/key')) // "/i/am/a"
 */

_.basePath = function (path) {
  let basePath = path
    .split("/")
    .slice(0, -1)
    .join("/");

  return basePath;
};

/**
 *
 * Given a path, get just the key.
 * @param {string} path - A path to a key, ie "/i/am/a/key"
 * @return {String} the key, ie "key"
 *
 * @example
 *  console.log(_.key('/i/am/a/key')) // "key"
 *
 */
_.key = function (path) {
  return path.split("/").pop();
};

/**
 *
 * Given a path, get the value from the local results cache or SSM itself.
 * @param {string} path - A path to a key, ie "/foo/bar"
 * @return {String} the value, ie "xyzzy"
 *
 */
_.getValue = function (path) {
  let key = _.key(path);
  let basePath = _.basePath(path);

  // if we don't already have results globally from this particular path, go ahead and query AWS
  if (!RESULTS[basePath]) {
    let parameters = _.getSSMParameters(basePath);
    let r = _.parseParameters(parameters, basePath);

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

_.parseConvictConfig = function (schema) {
  if (_.checkIfAuthed() == false) {
    return {};
  }

  let r = utils.getValues(schema, "SSM", _.getValue);
  return r;
};

module.exports = _.parseConvictConfig;
module.exports._ = _;
