import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tailwind from "eslint-plugin-tailwindcss";
import parser from "vue-eslint-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends("plugin:vue/vue3-recommended", "prettier"),
  {
    rules: {
      "tailwindcss/no-custom-classname": "off",
      "vue/multi-word-component-names": "off",
      "vue/first-attribute-linebreak": "off",
    },
  },
  {
    files: ["**/*.vue"],

    languageOptions: {
      parser: parser,
    },
  },
  ...tailwind.configs["flat/recommended"],
];
