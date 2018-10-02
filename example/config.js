"use strict";

const convict = require("@hbkapps/convict");
convict.configureProvider(require("../index")(null, {retry: true}));

module.exports = convict({
  ip: {
    default: "127.0.0.1",
    providerPath: "/foo/bar/baz" // can use multiple basePaths, and we'll only need to contact AWS once per path
  },
  port: {
    default: "blah",
    format: "String",
    providerPath: "/foo/bar/bazz"
  }
})
  .validate()
  .getProperties();
