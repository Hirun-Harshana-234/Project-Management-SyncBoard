import "@testing-library/jest-dom";

Object.defineProperty(global.navigator, "onLine", { value: true, configurable: true });
if (!global.crypto.randomUUID) global.crypto.randomUUID = () => "test-uuid";

