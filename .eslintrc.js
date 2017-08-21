module.exports = {
  'extends': ['eslint:recommended','google'],
  'parserOptions': {
    'ecmaVersion': 6,
  },
  'env':{
    'es6': true,
    'mocha': true,
    'node': true
  },
  'rules': {
    'no-multiple-empty-lines': ['error',{'max': 1}],
    'arrow-spacing': ['error'],
    'no-console': ['off'],
    'indent': ['warn', 2,{'MemberExpression': 1}]
  }
};
