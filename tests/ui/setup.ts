import "./dom-setup";
import { afterEach, expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extend Bun's expect with jest-dom matchers (e.g. toBeInTheDocument)
// biome-ignore lint/suspicious/noExplicitAny: Required for jest-dom matchers
expect.extend(matchers as any);

// Automatically clean up DOM after each test
afterEach(async () => {
  const { cleanup } = await import("@testing-library/react");
  cleanup();
});
