"use strict";

const convict = require("convict");
// convict.configureProvider(require("../index"));

let config = convict({
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
});

let c = require("../index")(config);

// config = config.load();