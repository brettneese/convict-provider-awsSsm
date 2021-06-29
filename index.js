"use strict";
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

module.exports = function (rootPath) {
  let output = {};

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
    let parameters = awsParamStore.getParametersByPathSync(rootPath);

    parameters.forEach((element) => {
      const name = element.Name.split(rootPath)[1];
      output[name] = element.Value;
    });
  }

  return output;
};
