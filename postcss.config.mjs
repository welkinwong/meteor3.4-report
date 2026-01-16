import stylexPlugin from '@stylexswc/postcss-plugin';
import postcssPresetEnv from 'postcss-preset-env';
import postcssFocusVisibleFallback from './loader/postcss-focus-visible-fallback.mjs';
import postcssWhereFallback from './loader/postcss-where-fallback.mjs';

export default {
  plugins: [
    stylexPlugin({
      include: ['imports/**/*.{js,jsx,ts,tsx}'],
    }),
    postcssPresetEnv(),
    postcssFocusVisibleFallback(),
    postcssWhereFallback(),
  ],
};
