const chai = require("chai");
const expect = chai.expect;
const lib = require(".");
const hooks = require("./test/hooks");
const sinon = require("sinon");

describe("awsOptions()", async function() {
  it("if the AWS_ENDPOINT_SSM env var is set, should set the endpoint", async function() {
    process.env.AWS_ENDPOINT_SSM = "http://localhost:8000";
    expect(lib.awsOptions().endpoint).to.equal("http://localhost:8000");
  });

  it("if the AWS_ENDPOINT_SSM env var is not set, should return an empty object", async function() {
    process.env.AWS_ENDPOINT_SSM = "";
    expect(lib.awsOptions()).to.be.an("Object").that.is.empty;
  });
});

describe("checkIfAuthed()", async function() {
  describe("check if not authed", async function() {
    before(async function() {
      hooks.mockAwsLogout();
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
      hooks.mockAwsAuth();
    });

    it("if auth'd with Amazon, should return true", async function() {
      let r = lib.checkIfAuthed();
      expect(r).to.equal(true);
    });
  });
});

describe("getSSMParameters()", async function() {
  before(async function() {
    hooks.mockAwsAuth();

    await hooks.addSsmParams();
  });

  it("should get all the parameters under a basepath", async function() {
    let path = "/foo/bar";
    let params = lib.getSSMParameters(path);

    expect(params.length).to.equal(3);
  });

  after(async function() {
    await hooks.removeSsmParams();
  });
});

describe("parseParameters()", async function() {
  it("should parse the parameters", async function() {
    mockSSMParameterResponse = [
      {
        Name: "/foo/bar/baz",
        Value: "xyzzy",
        Type: "String"
      }
    ];

    let r = lib.parseParameters(mockSSMParameterResponse);

    expectedResponse = {
      baz: "xyzzy"
    };

    expect(r).to.deep.equal(expectedResponse);
  });
});

describe("basePath()", async function() {
  it("given a full key path, should return the basepath", async function() {
    let r = lib.basePath("/foo/bar/baz");
    expect(r).to.equal("/foo/bar");
  });
});

describe("key()", async function() {
  it("given a full key path, should return the key", async function() {
    let r = lib.key("/foo/bar/baz");
    expect(r).to.equal("baz");
  });
});

describe("getKey()", async function() {
  before(async function() {
    hooks.mockAwsAuth();
    sinon.spy(lib, "getSSMParameters");
    await hooks.addSsmParams();
  });

  it("given a full key path, should return the value", async function() {
    let r = lib.getValue("/foo/bar/baz");
    expect(r).to.equal("xyzzy");
  });

  it(`when querying values under the same basepath, 
      should read from cache and call this.getSSMParameters only once`, async function() {
    // @todo use sinon spies to ensure we're only calling `this.getSSMParameters` once

    let r = lib.getValue("/foo/bar/baz");
    expect(r).to.equal("xyzzy");

    r = lib.getValue("/foo/bar/foobar");
    expect(r).to.equal("fred");

    expect(lib.getSSMParameters.calledOnce).to.be.true;
  });

  it(`when querying values under different baspaths, 
  should read from cache and call this.getSSMParameters twice`, async function() {
    let r = lib.getValue("/foo/bar/baz");
    expect(r).to.equal("xyzzy");

    r = lib.getValue("/foo/bar/baz/qux");
    expect(r).to.equal("waldo");

    expect(lib.getSSMParameters.calledTwice).to.be.true;
  });

  after(async function() {
    await hooks.removeSsmParams();
  });
});

describe("parseConvictConfig()", async function() {
  before(async function() {
    hooks.mockAwsAuth();

    let awsOptions = {
      endpoint: process.env.AWS_ENDPOINT_SSM
    };

    this.schema = {
      baz: {
        default: "fred",
        format: "String",
        SSM: "/foo/bar/baz" // can use multiple basePaths, and we'll only need to contact AWS once per path
      },
      qux: {
        default: 0,
        format: "String",
        SSM: "/foo/bar/baz/qux"
      }
    };

    await hooks.addSsmParams();
  });

  it("parses the config", async function() {
    let r = lib.parseConvictConfig(this.schema);

    let expectedResponse = {
      baz: "xyzzy",
      qux: "waldo"
    };

    expect(r).to.deep.equal(expectedResponse);
  });

  after(async function() {
    await hooks.removeSsmParams();
  });
});
