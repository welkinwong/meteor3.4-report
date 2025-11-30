const { defineConfig } = require('@meteorjs/rspack');
const StyleXPlugin = require('@stylexswc/unplugin/rspack');
const { demoRspackPlugin } = require('./demo-unplugin');

/**
 * Rspack configuration for Meteor projects.
 *
 * Provides typed flags on the `Meteor` object, such as:
 * - `Meteor.isClient` / `Meteor.isServer`
 * - `Meteor.isDevelopment` / `Meteor.isProduction`
 * - …and other flags available
 *
 * Use these flags to adjust your build settings based on environment.
 */
module.exports = defineConfig((Meteor) => {
  return {
    plugins: [
      demoRspackPlugin(),
      StyleXPlugin({
        useCssPlaceholder: true,
        rsOptions: {
          dev: Meteor.isDevelopment,
        },
      }),
    ],
  };
});
