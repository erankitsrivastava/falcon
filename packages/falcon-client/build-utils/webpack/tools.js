const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const deepMerge = require('deepmerge');
const webpack = require('webpack');
const Logger = require('@deity/falcon-logger');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const clearConsole = require('react-dev-utils/clearConsole');
const paths = require('./../paths');

const colors = {
  deityGreen: '#a9cf38'
};

function logDeityGreenInfo(x) {
  Logger.info(chalk.hex(colors.deityGreen)(x));
}

function exitIfBuildingItself() {
  if (paths.ownPath === paths.appPath) {
    Logger.error(
      chalk.red(
        'Error: falcon-client is not intended to starting or building itself. It hosts your application instead!\n'
      )
    );
    Logger.info(
      "If you don't known how to start see this: https://github.com/deity-io/falcon/tree/master/packages/create-falcon-app"
    );
    Logger.info(
      'If you want more information about falcon-client see this: https://github.com/deity-io/falcon/tree/master/packages/falcon-client'
    );

    process.exit(1);
  }
}

/**
 * Exit if required files does no exist
 * @param {FalconClientBuildConfig} config falcon-client build config
 * @returns {void}
 */
function exitIfNoRequiredFiles(config) {
  const filesToCheck = [paths.appIndexJs, config.useWebmanifest && paths.appWebmanifest].filter(x => x);
  if (!checkRequiredFiles(filesToCheck)) {
    process.exit(1);
  }
}

function webpackCompiler(config) {
  let compiler;
  try {
    compiler = webpack(config);
  } catch (error) {
    Logger.error(chalk.red('Failed to compile.'));
    Logger.error(error);

    process.exit(1);
  }

  return compiler;
}

function webpackCompileAsync(config, emitWarningsAsErrors = false) {
  return new Promise((resolve, reject) => {
    const compiler = webpackCompiler(config);
    compiler.run((error, stats) => {
      if (error) {
        return reject(error);
      }

      const { errors, warnings } = formatWebpackMessages(stats.toJson({}, true));
      if (errors.length) {
        return reject(new Error(errors.join('\n\n')));
      }
      if (emitWarningsAsErrors && warnings.length) {
        Logger.warn(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\nMost CI servers set it automatically.\n'
          )
        );
        return reject(new Error(warnings.join('\n\n')));
      }

      return resolve({
        stats,
        warnings
      });
    });
  });
}

function removePreviousBuildAssets(appBuild, appBuildPublic) {
  if (fs.existsSync(appBuild)) {
    const productionPublicDirName = path.relative(appBuild, appBuildPublic);
    fs.readdirSync(appBuild)
      .filter(x => x !== productionPublicDirName)
      .forEach(file => fs.removeSync(path.join(appBuild, file)));
  }
}

function requireOrExit(id) {
  try {
    // eslint-disable-next-line
    return require(id);
  } catch (e) {
    clearConsole();
    Logger.error(`File ${path.basename(id)} is invalid (${id}).`, e);
    process.exit(1);
  }
}

/**
 * @typedef {object} FalconClientBuildConfig
 * @property {number} devServerPort webpack dev server port
 * @property {boolean} CI if Continuos Integration env
 * @property {boolean} clearConsole if clear console
 * @property {boolean} useWebmanifest is process Web App Manifest
 * @property {object} i18n i18n falcon client webpack plugin configuration
 * @property {string[]} envToBuildIn env vars to build in bundle
 * @property {(function|string)[]} plugins razzle compatible plugins
 * @property {object} moduleOverride dictionary of module names to override
 */

/**
 * Get falcon-client build config
 * @param {string} buildConfigFileName='falcon-client.build.config.js' falcon-client build time config relative path
 * @returns {FalconClientBuildConfig} falcon-client build time config
 */
function getBuildConfig(buildConfigFileName = 'falcon-client.build.config.js') {
  const buildConfigFilePath = paths.resolveApp(buildConfigFileName);
  const buildConfig = fs.existsSync(buildConfigFilePath) ? requireOrExit(buildConfigFilePath) : {};

  const buildConfigDefaults = {
    clearConsole: true,
    CI: false,
    devServerPort: 3001,
    useWebmanifest: false,
    i18n: {},
    envToBuildIn: [],
    plugins: [],
    moduleOverride: {}
  };

  const config = deepMerge(buildConfigDefaults, buildConfig, { arrayMerge: (destination, source) => source });

  return config;
}

function getFullIcuPath() {
  if (process.env.NODE_ICU_DATA !== undefined) {
    return process.env.NODE_ICU_DATA;
  }

  return paths.resolvePackageDir('full-icu');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} Bytes`;
  else if (bytes < 1048576) return `${(bytes / 1024).toFixed(3)} KB`;
  else if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(3)} MB`;
  return `${(bytes / 1073741824).toFixed(3)} GB`;
}

module.exports = {
  colors,
  logDeityGreenInfo,
  exitIfBuildingItself,
  exitIfNoRequiredFiles,
  getBuildConfig,
  getFullIcuPath,
  removePreviousBuildAssets,
  webpackCompiler,
  webpackCompileAsync,
  formatBytes
};
