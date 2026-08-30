module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/server.js", "!src/seed.js"],
  coverageDirectory: "../coverage/server",
  testTimeout: 20000
};

