var config = module.exports;

config["My tests"] = {
  autoRun: true,
  rootPath: "../",
  libs: ['lib/require.js', 'requirejs-config.js'],
  environment: "browser",
  sources: ["js/*.js"],
  resources: ["lib/*.js"],
  tests: ["test/*-test.js"],
  extensions: [require("buster-amd")]
};