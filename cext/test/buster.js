var config = module.exports;

config["My tests"] = {
    rootPath: "../",
    environment: "browser", // or "node"
    sources: [
        "js/*.js"
    ],
    tests: [
        "test/*-test.js"
    ]
};
