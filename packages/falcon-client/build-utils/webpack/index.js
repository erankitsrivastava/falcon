const fs = require('fs-extra');
const chalk = require('chalk');
const Logger = require('@deity/falcon-logger');
const WebpackDevServer = require('webpack-dev-server-speedy');
const clearConsole = require('react-dev-utils/clearConsole');
const { measureFileSizesBeforeBuild, printFileSizesAfterBuild } = require('react-dev-utils/FileSizeReporter');

const paths = require('./../paths');
const {
  exitIfBuildingItself,
  exitIfNoRequiredFiles,
  getBuildConfig,
  getFullIcuPath,
  removePreviousBuildAssets,
  webpackCompiler,
  webpackCompileAsync,
  logDeityGreenInfo
} = require('./tools');
const createConfig = require('./config/create');
const { generateSW } = require('./workbox');

module.exports.startDevServer = async () => {
  exitIfBuildingItself();
  const falconConfig = getBuildConfig();
  exitIfNoRequiredFiles(falconConfig);

  if (falconConfig.clearConsole) {
    clearConsole();
  }
  logDeityGreenInfo('Starting development server...');

  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  process.env.BABEL_ENV = process.env.NODE_ENV;

  const fullIcuPath = getFullIcuPath();
  if (fullIcuPath) {
    process.env.NODE_ICU_DATA = fullIcuPath;
  }

  try {
    removePreviousBuildAssets(paths.appBuild, paths.appBuildPublic);

    const options = {
      env: process.env.NODE_ENV,
      inspect: process.argv.find(x => x.match(/--inspect-brk(=|$)/) || x.match(/--inspect(=|$)/)) || undefined,
      paths
    };

    const clientConfig = createConfig('web', options, falconConfig);
    const serverConfig = createConfig('node', options, falconConfig);

    // Compile our assets with webpack
    const clientCompiler = webpackCompiler(clientConfig);
    const serverCompiler = webpackCompiler(serverConfig);

    // Start our server webpack instance in watch mode after assets compile
    clientCompiler.plugin('done', () => {
      serverCompiler.watch(
        {
          quiet: true,
          stats: 'none'
        },
        /* eslint-disable no-unused-vars */
        stats => {}
      );
    });

    // Create a new instance of Webpack-dev-server for our client assets.
    const clientDevServer = new WebpackDevServer(clientCompiler, clientConfig.devServer);
    clientDevServer.listen(falconConfig.devServerPort, error => {
      if (error) {
        Logger.error(error);
      }
    });
  } catch (error) {
    Logger.error('Compilation failed!');

    throw error;
  }
};

module.exports.build = async () => {
  exitIfBuildingItself();
  const falconConfig = getBuildConfig();
  exitIfNoRequiredFiles(falconConfig);

  if (falconConfig.clearConsole) {
    clearConsole();
  }
  logDeityGreenInfo('Creating an optimized production build...');

  process.env.NODE_ENV = 'production';
  process.env.BABEL_ENV = process.env.NODE_ENV;

  try {
    const options = {
      env: process.env.NODE_ENV,
      publicPath: process.env.PUBLIC_PATH || '/',
      paths
    };

    const previousBuildSizes = await measureFileSizesBeforeBuild(paths.appBuildPublic);
    fs.emptyDirSync(paths.appBuild);
    fs.copySync(paths.appPublic, paths.appBuildPublic, { dereference: true });

    // First compile the client. We need it to properly output assets.json
    // (asset manifest file with the correct hashes on file names BEFORE we can start the server compiler).

    const clientConfig = createConfig('web', options, falconConfig);
    const clientCompilation = await webpackCompileAsync(clientConfig, falconConfig.CI);

    const serverConfig = createConfig('node', options, falconConfig);
    // ContextReplacementPlugin https://webpack.js.org/plugins/context-replacement-plugin/
    /* const serverCompilation = */ await webpackCompileAsync(serverConfig, falconConfig.CI);

    const warnings = [...clientCompilation.warnings]; // , ...serverCompilation.warnings]

    if (warnings.length) {
      Logger.warn(chalk.yellow('\nCompiled with warnings.\n'));
      Logger.warn(warnings.join('\n\n'));
      Logger.log();
    } else {
      Logger.log(chalk.green('\nCompiled successfully.\n'));
    }

    Logger.log('File sizes after gzip:\n');
    const { stats } = clientCompilation;
    printFileSizesAfterBuild(stats, previousBuildSizes, paths.appBuild);

    Logger.log();

    generateSW();
  } catch (error) {
    Logger.error(`${chalk.red('\nFailed to compile.\n')}`);
    Logger.error(error);
    Logger.log();

    process.exit(1);
  }
};

module.exports.size = async () => {
  exitIfBuildingItself();
  const falconConfig = getBuildConfig();
  exitIfNoRequiredFiles(falconConfig);

  if (falconConfig.clearConsole) {
    clearConsole();
  }
  logDeityGreenInfo('Creating an optimized production build...');

  process.env.NODE_ENV = 'production';
  process.env.BABEL_ENV = process.env.NODE_ENV;

  try {
    const options = {
      env: process.env.NODE_ENV,
      publicPath: process.env.PUBLIC_PATH || '/',
      paths,
      analyze: true
    };

    fs.emptyDirSync(paths.appBuild);
    fs.copySync(paths.appPublic, paths.appBuildPublic, { dereference: true });

    Logger.log('Compiling client...');
    const clientConfig = createConfig('web', options, falconConfig);
    const { warnings } = await webpackCompileAsync(clientConfig);

    if (warnings.length) {
      Logger.warn(chalk.yellow('\nCompiled client with warnings.\n'));
      Logger.warn(warnings.join('\n\n'));
      Logger.log();
    } else {
      Logger.log(chalk.green('\nCompiled client successfully.\n'));
    }

    Logger.log();
  } catch (error) {
    Logger.error(`${chalk.red('\nFailed to compile client.\n')}`);
    Logger.error(error);
    Logger.log();

    process.exit(1);
  }
};
