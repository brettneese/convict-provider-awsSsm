const chai = require("chai");
const expect = chai.expect;
const lib = require(".");
const awsParamStore = require("aws-param-store");

describe("checkIfAuthed()", async function() {
  describe("check if not authed", async function() {
    before(async function() {
      process.env.AWS_ACCESS_KEY_ID = "";
      process.env.AWS_SECRET_ACCESS_KEY = "";
      process.env.AWS_REGION = "";
    });

    it("if nothing is set, should return false", async function() {
      let r = lib.checkIfAuthed();

      process.env.AWS_REGION = "";

      expect(r).to.equal(false);
    });

    it("if region is set but creds are not, should return false", async function() {
      process.env.AWS_REGION = "us-east-1";

      let r = lib.checkIfAuthed();

      expect(r).to.equal(false);
    });
  });

  describe("check if authed", async function() {
    before(async function() {
      process.env.AWS_ACCESS_KEY_ID = "foo";
      process.env.AWS_SECRET_ACCESS_KEY = "bar";
      process.env.AWS_REGION = "us-east-1";
    });

    it("if auth'd with Amazon, should return true", async function() {
      let r = lib.checkIfAuthed();
      console.log(r);
      expect(r).to.equal(true);
    });
  });
});

describe("parseConvictConfig()", async function() {
  before(async function() {
    process.env.AWS_ACCESS_KEY_ID = "blah";
    process.env.AWS_SECRET_ACCESS_KEY = "blah";
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_ENDPOINT_SSM = "http://localhost:4583";

    let awsOptions = {
      endpoint: process.env.AWS_ENDPOINT_SSM
    };

    this.schema = {
      ip: {
        default: "127.0.0.1",
        format: "ipaddress",
        providerPath: "/test/foo/ip" // can use multiple basePaths, and we'll only need to contact AWS once per path
      },
      port: {
        default: 0,
        format: "port",
        providerPath: "/test/PORT"
      }
    };

    let results = awsParamStore.putParameterSync(
      this.schema["ip"].providerPath,
      "192.168.69.69",
      "String",
      awsOptions
    );
  });

  it("parses the config", async function() {
    let r = lib.parseConvictConfig(this.schema);

    console.log(r);
  });
});
