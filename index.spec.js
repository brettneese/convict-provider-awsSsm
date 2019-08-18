// if in mocha, load the auth env vars for AWS
if (!process.env.WALLABY_PRODUCTION) require("../wallaby");

const chai = require("chai");
const expect = chai.expect;

const handler = require("./handler");

describe("handler", async () => {
  it("should return hello world", async function() {
    let r = await handler.handle();

    expect(r).to.equal("Hello World");
  });
});