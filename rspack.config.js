const { defineConfig } = require('@meteorjs/rspack');

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
    // [Rspack Client Error] node:internal/modules/esm/resolve:314
    //   return new ERR_PACKAGE_PATH_NOT_EXPORTED(
    //          ^
    // Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './package.json' is not defined by "exports" in /Users/welkin/code/meteor3.4-report/node_modules/@dr.pogodin/react-helmet/package.json
    //     at exportsNotFound (node:internal/modules/esm/resolve:314:10)
    //     at packageExportsResolve (node:internal/modules/esm/resolve:661:9)
    //     at resolveExports (node:internal/modules/cjs/loader:661:36)
    //     at Function._findPath (node:internal/modules/cjs/loader:753:31)
    //     at Function._resolveFilename (node:internal/modules/cjs/loader:1391:27)
    //     at Function.resolve (node:internal/modules/helpers:145:19)
    //     at pkgDir (/Users/welkin/code/meteor3.4-report/node_modules/@meteorjs/rspack/lib/meteorRspackHelpers.js:11:28)
    //     at Array.map (<anonymous>)
    //     at compileWithRspack (/Users/welkin/code/meteor3.4-report/node_modules/@meteorjs/rspack/lib/meteorRspackHelpers.js:41:51)
    //     at Meteor.compileWithRspack (/Users/welkin/code/meteor3.4-report/node_modules/@meteorjs/rspack/rspack.config.js:268:5) {
    //   code: 'ERR_PACKAGE_PATH_NOT_EXPORTED'
    // }
    ...Meteor.compileWithRspack(['@dr.pogodin/react-helmet']),

    // Directly using the include configuration in Rspack works normally.
    // module: {
    //   rules: [
    //     {
    //       test: /\.(?:[mc]?js|jsx|[mc]?ts|tsx)$/i,
    //       include: [
    //         './node_modules/@dr.pogodin/react-helmet',
    //       ],
    //       loader: 'builtin:swc-loader',
    //       options: {
    //         jsc: {
    //           baseUrl: './',
    //           paths: { '/*': ['*', '/*'] },
    //           parser: { syntax: 'typescript', tsx: true },
    //           target: 'es5',
    //           transform: { react: { development: false, refresh: false } },
    //           externalHelpers: true,
    //         },
    //       },
    //     },
    //   ],
    // },
  };
});
