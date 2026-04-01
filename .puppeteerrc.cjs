const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // This forces the browser to download inside your project's .cache folder
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};