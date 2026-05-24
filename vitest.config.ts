import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: "./tests/unit",
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html"],
      include: [
        "lib/**/*.ts",
        "db/**/*.ts",
      ],
    },
  },
});