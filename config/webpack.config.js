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
      background: PATHS.src + '/background.js',
      "Scholar/getScholarRanks": PATHS.src + '/Scholar/getScholarRanks.js',
      "Google/getGoogleRanks": PATHS.src + '/Google/getGoogleRanks.js',
      "Scopus/getScopusRanks": PATHS.src + '/Scopus/getScopusRanks.js',
      "Bing/getBingRanks": PATHS.src + '/Bing/getBingRanks.js'
    },
    devtool: argv.mode === 'production' ? false : 'source-map',
  });

module.exports = config;
