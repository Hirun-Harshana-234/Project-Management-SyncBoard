module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.test.{js,jsx}"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.js"],
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  moduleNameMapper: { "\\.(css|less|scss)$": "<rootDir>/src/test/styleMock.cjs" },
  collectCoverageFrom: ["src/**/*.{js,jsx}", "!src/main.jsx"],
  coverageDirectory: "../coverage/client"
};

