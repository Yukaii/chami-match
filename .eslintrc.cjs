module.exports = {
  root: true,
  overrides: [
    {
      files: ['*.vue'],
      parser: 'vue-eslint-parser',
    },
  ],
  extends: ['plugin:vue/vue3-recommended', 'plugin:tailwindcss/recommended'],
  rules: {
    'tailwindcss/no-custom-classname': 'off',
    'vue/multi-word-component-names': 'off',
  },
}
