const AWS = require("aws-sdk");

module.exports.ssm = new AWS.SSM({
  endpoint: "http://localhost:4583",
  region: "us-east-1",
  secretAccessKey: "foo",
  accessKeyId: "baz"
});

module.exports.addSsmParams = async function() {
  this.params = [
    {
      Name: "/foo/bar/baz",
      Value: "xyzzy",
      Type: "String"
    },
    {
      Name: "/foo/bar/baz/qux",
      Value: "xyzzy",
      Type: "String"
    }
  ];

  try {
    await this.ssm.putParameter(this.params[0]).promise();
    await this.ssm.putParameter(this.params[1]).promise();
  } catch (e) {
    throw e;
  }
};

module.exports.removeSsmParams = async function() {
  try {
    let awsParams = {
      Names: ["/foo/bar/baz", "/foo/bar/baz/qux"]
    };

    await this.ssm.deleteParameters(awsParams).promise();
  } catch (e) {
    throw e;
  }
};

module.exports.mockAwsAuth = async function() {
  process.env.AWS_ACCESS_KEY_ID = "blah";
  process.env.AWS_SECRET_ACCESS_KEY = "blah";
  process.env.AWS_REGION = "us-east-1";
  process.env.AWS_ENDPOINT_SSM = "http://localhost:4583";
};

module.exports.mockAwsLogout = async function() {
  process.env.AWS_ACCESS_KEY_ID = "";
  process.env.AWS_SECRET_ACCESS_KEY = "";
  process.env.AWS_REGION = "";
};
