const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
  babelrc: false,
  ...require('../babel/babel.config')
});
