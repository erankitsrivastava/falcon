const rimraf = require('rimraf');

module.exports = async () =>
  new Promise((resolve, reject) => {
    rimraf('dist', error => {
      if (error) {
        reject(error);
      }

      resolve();
    });
  });
