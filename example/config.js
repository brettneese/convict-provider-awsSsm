"use strict";

const convict = require("@hbkapps/convict");
convict.configureProvider(require("../index"));

module.exports = convict({
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
}).validate().getProperties();