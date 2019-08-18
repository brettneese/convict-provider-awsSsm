// Wallaby is an alternative test runner.

// FakeAuth for AWS, if using LocalStack

// process.env.AWS_ENDPOINT_EC2 = "http://localhost:4597"; // etc

module.exports = function() {
  return {
    setup: function(wallaby) {
      var mocha = wallaby.testFramework;
      mocha.timeout(5000);
    },
    files: [
      { pattern: "lib/**.js", load: true },
      { pattern: "lib/aws-param-store/lib/**.js", load: true },
      { pattern: "lib/**.spec.js", ignore: true },
      { pattern: "node_modules/**", ignore: true },
      { pattern: "node_modules/aws-param-store/**", ignore: false }
    ],

    tests: [
      // functions
      { pattern: "lib/**.spec.js", load: true },
      { pattern: "node_modules/**", ignore: true }
    ],
    env: {
      type: "node",
      runner: "node"
    },
    setup: function(wallaby) {},

    teardown: function(wallaby) {}
  };
};
