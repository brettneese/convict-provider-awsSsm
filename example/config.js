"use strict";

const convict = require("convict");
const provider = require("./index")

let configSchema = {
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
}

let config = convict(configSchema).load(configSchema);

// config = config.load();