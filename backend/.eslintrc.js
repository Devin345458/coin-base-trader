module.exports = {
  root: true,
  env: {
    node: true,
    es6:  true,
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: [
    '@nuxtjs',
    'plugin:nuxt/recommended'
  ],
  globals: {
    sails: true,
    _: true
  },
  plugins: [
  ],
  // add your custom rules here
  rules: {
    "no-undef": "off"
  }
}
