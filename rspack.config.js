import { defineConfig } from '@meteorjs/rspack';
import browserslist from 'browserslist';
import deepmerge from 'deepmerge';

/**
 * SWC config: compile to ES2015 for broader browser support
 * @param {'usage' | 'entry'} mode
 * @returns
 */
const es2015Options = {
  env: {
    targets: browserslist.loadConfig({ path: '.' }),
    mode: 'usage',
    coreJs: '3.47',
  },
  jsc: { transform: { react: { runtime: 'automatic' } } },
};

const es2022Options = {
  jsc: { target: 'es2022', transform: { react: { runtime: 'automatic' } } },
};

const codeTest = /\.(?:[mc]?js|jsx|[mc]?ts|tsx)$/i;
const codeExclude = /node_modules|\.meteor\/local/;

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
export default defineConfig((Meteor) => {
  // Ensure SWC target is not set, as we handle it via env.targets
  delete Meteor.swcConfigOptions.jsc.target;

  return {
    // Cache can prevent styles from updating after Meteor restarts (awaiting upstream fix)
    ...Meteor.setCache(false),

    /**
     * Main code processing rules
     */
    ...(Meteor.isClient
      ? {
          module: {
            rules: [
              { test: /\.css$/, use: ['postcss-loader'], type: 'css' },
              {
                test: codeTest,
                exclude: codeExclude,
                use: [
                  {
                    loader: 'builtin:swc-loader',
                    options: deepmerge(Meteor.swcConfigOptions, es2015Options),
                  },
                  // Must run before swc(env->ES2015) or lowered syntax breaks StyleX static analysis
                  {
                    loader: './loader/stylex-rs-compiler-loader.mjs',
                    options: {
                      rsOptions: {
                        dev: Meteor.isDevelopment,
                        treeshakeCompensation: true,
                        unstable_moduleResolution: { type: 'ESModules' },
                      },
                    },
                  },
                  // Strip server-only code
                  {
                    loader: './loader/directive-loader.mjs',
                    options: { targetEnv: 'client' },
                  },
                ],
              },
            ],
          },
        }
      : {
          module: {
            rules: [
              {
                test: codeTest,
                exclude: codeExclude,
                use: [
                  {
                    loader: 'builtin:swc-loader',
                    options: deepmerge(Meteor.swcConfigOptions, es2022Options),
                  },
                  {
                    loader: './loader/stylex-rs-compiler-loader.mjs',
                    options: {
                      rsOptions: {
                        dev: Meteor.isDevelopment,
                        treeshakeCompensation: true,
                        unstable_moduleResolution: { type: 'ESModules' },
                      },
                    },
                  },
                  // In SSR, do not run effects; keep hook order by replacing callbacks with no-op
                  { loader: './loader/noop-useeffect-loader.mjs' },
                  // Strip client-only code
                  {
                    loader: './loader/directive-loader.mjs',
                    options: { targetEnv: 'server' },
                  },
                ],
              },
            ],
          },
        }),

    /**
     * Uses ES2020+ features internally; recompile to ES2015
     */
    ...(Meteor.isClient &&
      Meteor.compileWithRspack(
        [
          // rsuite and dependencies
          'rsuite',
          'date-fns',

          // @reduxjs/toolkit and dependencies
          '@reduxjs/toolkit',
          'react-redux',
          'immer',
          'reselect',

          // No additional dependencies
          '@dr.pogodin/react-helmet',
          'react-router',
        ],
        es2015Options
      )),

    /**
     * Exported as CommonJS modules; must be compiled by Meteor
     */
    ...(Meteor.isClient
      ? Meteor.compileWithMeteor(['quill-delta', 'quill2-delta-to-html'])
      : Meteor.compileWithMeteor([
          // Uses require internally; Rspack can't statically analyze, list manually
          'sharedb-mongo',
          // Internal deps are complex; static bundling fails
          'mongodb',
          'heapdump',
          'wechatpay-node-v3',
          'alipay-sdk',
          'bullmq',
          'ws',
          'qiniu',
          'react-router',
        ])),

    /**
     * Remove unnecessary packages per environment to reduce bundle size
     */
    ...(Meteor.isClient
      ? {
          resolve: {
            alias: {
              // Add more server-only package aliases here to reduce client bundle size
              deepmerge: false,
            },
          },
        }
      : {
          resolve: {
            alias: {
              // Add more client-only package aliases here to reduce server bundle size
              deepmerge: false,
            },
          },
        }),
  };
});
