const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // This ensures the browser is saved INSIDE your project folder
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};