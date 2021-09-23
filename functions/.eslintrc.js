module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "max-len": ["warn", { "code": 120, "tabWidth": 2 }],
    "indent": ["error", 2],
    "camelcase": "off",
    "@typescript-eslint/naming-convention": "off",
    "require-jsdoc": "off",
    "new-cap": "off",
    "object-curly-spacing": "off",
    "block-spacing": "off",
  },
};
