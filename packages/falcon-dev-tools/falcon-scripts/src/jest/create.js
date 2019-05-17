const path = require('path');

module.exports = ({ packagePath }) => ({
  rootDir: packagePath,
  testEnvironment: 'jsdom',
  testURL: 'http://localhost',
  testMatch: ['**/src/**/__tests__/**/*.{js,jsx,mjs,ts,tsx}', '**/src/**/?(*.)(spec|test).{js,jsx,mjs,ts,tsx}'],
  transform: {
    '^.+\\.(gql|graphql)$': 'jest-transform-graphql',
    '^.+\\.(js|jsx|mjs|ts|tsx)$': path.resolve(__dirname, 'babelTransform.js'),
    '^.+\\.css$': path.resolve(__dirname, 'cssTransform.js'),
    '^(?!.*\\.(js|jsx|mjs|ts|tsx|css|json)$)': path.resolve(__dirname, 'fileTransform.js')
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  moduleNameMapper: {
    '^src(.*)$': '<rootDir>/src$1',
    '^react-native$': 'react-native-web'
  },
  collectCoverageFrom: [
    'src/**/*.js',
    'src/**/*.jsx',
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/index.ts',
    '!src/index.js',
    '!src/index.jsx'
  ],
  coverageReporters: ['html', 'text', 'text-summary', 'lcov'],
  globals: {
    'ts-jest': { diagnostics: false }
  }
});
