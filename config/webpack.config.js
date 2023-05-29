'use strict';

const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const PATHS = require('./paths');

// Merge webpack configuration files
const config = (env, argv) =>
  merge(common, {
    entry: {
      popup: PATHS.src + '/popup.js',
      contentScript: PATHS.src + '/contentScript.js',
      contentGoogle: PATHS.src + '/contentGoogle.js',
      background: PATHS.src + '/background.js',
      "Scholar/getOtherPages": PATHS.src + '/Scholar/getOtherPages.js',
      "Google/getGoogleRanks": PATHS.src + '/Google/getGoogleRanks.js',
    },
    devtool: argv.mode === 'production' ? false : 'source-map',
  });

module.exports = config;
