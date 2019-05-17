const path = require('path');
const jest = require('jest');

module.exports = async ({ packagePath }) => {
  process.env.NODE_ENV = 'test';

  // eslint-disable-next-line
  const packageJson = require(path.join(packagePath, 'package.json'));
  const createConfig = require('./jest/create');
  const config = {
    ...createConfig({ packagePath }),
    ...(packageJson.jest ? packageJson.jest : {})
  };

  await jest.run(['--config', JSON.stringify(config), '--watch']);
};
