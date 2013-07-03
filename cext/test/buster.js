var config = module.exports;

config["My tests"] = {
	//autoRun: false,
    rootPath: "../",
    libs: [ 'require.config','lib/require.js' ],
    environment: "browser", // or "node"
    sources: [
        //"js/*.js"
    ],
    resources: ["js/*.js"],
    tests: [
        "test/*-test.js"
    ]
    //extensions: [require("buster-amd")]
};
