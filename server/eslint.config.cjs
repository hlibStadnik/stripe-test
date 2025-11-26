const babelParser = require("@babel/eslint-parser");
const eslintPluginNode = require("eslint-plugin-node");
const eslintPluginPrettier = require("eslint-plugin-prettier");
const eslintPluginSpellcheck = require("eslint-plugin-spellcheck");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["node_modules/**/*", "dist/**/*", "build/**/*"],
  },
  {
    files: ["**/*.js", "**/*.ts"],
    languageOptions: {
      parser: babelParser,
      ecmaVersion: 2021,
      sourceType: "module",
      parserOptions: {
        requireConfigFile: false,
      },
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "writable",
        Buffer: "readonly",
        global: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
    plugins: {
      node: eslintPluginNode,
      prettier: eslintPluginPrettier,
      spellcheck: eslintPluginSpellcheck,
    },
    rules: {
      ...eslintConfigPrettier.rules,
      "spellcheck/spell-checker": [
        "warn",
        {
          comments: true,
          skipWords: [
            "ondemand",
            "webhook",
            "webhooks",
            "fs",
            "dotenv",
            "cors",
            "ecma",
            "paircode",
            "endregion",
            "misconfigured",
            "usd",
            "devchat",
            "commonjs",
            "axios",
            "markdoc",
          ],
        },
      ],
      "prettier/prettier": [
        "error",
        {
          semi: true,
        },
      ],
    },
  },
];
