"use strict";

const convict = require("convict");
const getParams = require("../index");

const config = {
  ip: {
    default: "127.0.0.1",
  },
  port: {
    default: 0,
    format: "port",
  },
};

const ssmParams = getParams("/example-app/");

module.exports = convict(config).load(ssmParams).validate().getProperties();
