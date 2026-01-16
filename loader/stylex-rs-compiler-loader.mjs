/**
 * StyleX pre-transform loader (ESM)
 *
 * Why this loader exists:
 * - When SWC is configured with `env: { mode: 'usage' }` (targets from `.browserslistrc`), it may downlevel
 *   certain syntax for older browsers (notably computed properties in object literals).
 * - StyleX's compiler needs to statically analyze calls like `stylex.create({ [breakpoints.mobile]: { ... } })`.
 * - If SWC runs first, it can rewrite the object literal into helper calls (e.g. `_define_property(...)`),
 *   and StyleX may fail to evaluate the expression, resulting in errors like "Referenced constant is not defined".
 *
 * So we run StyleX *before* SWC env/downleveling:
 *   directive-loader  ->  (this loader: StyleX)  ->  swc-loader (env usage + polyfills)
 *
 * Notes:
 * - This loader only transforms files that (a) match StyleX include/exclude rules and (b) actually contain
 *   StyleX import sources, so the overhead is limited.
 * - We use `createRequire()` because `@stylexswc/rs-compiler` is published as CommonJS.
 */

import { Buffer } from 'node:buffer';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalizeRsOptions, shouldTransformFile, transform } = require('@stylexswc/rs-compiler');

function stripQuery(filePath) {
  const queryIndex = filePath.indexOf('?');
  return queryIndex === -1 ? filePath : filePath.slice(0, queryIndex);
}

function hasStyleXCode(rsOptions, inputCode) {
  const importSources = rsOptions?.importSources;
  if (!Array.isArray(importSources) || importSources.length === 0) return false;

  return importSources.some(importName => {
    if (typeof importName === 'string') return inputCode.includes(importName);
    if (importName && typeof importName === 'object' && typeof importName.from === 'string') {
      return inputCode.includes(importName.from);
    }
    return false;
  });
}

export default function stylexRsCompilerLoader(source, inputSourceMap) {
  this.cacheable?.(true);

  // Rspack/Webpack loader API: we use async callback style for compatibility.
  const callback = this.async();
  const rawOptions = this.getOptions?.() ?? {};
  const filename = stripQuery(this.resourcePath || this.resource || '');

  let rsOptions;
  try {
    // Normalizes defaults (including importSources) to match the unplugin behavior.
    rsOptions = normalizeRsOptions(rawOptions.rsOptions || {});
  } catch (e) {
    callback(e);
    return;
  }

  try {
    // Keep include/exclude checks consistent with StyleX's own tooling.
    const include = rsOptions.include;
    const exclude = rsOptions.exclude;

    if (!shouldTransformFile(filename, include, exclude)) {
      callback(null, source, inputSourceMap);
      return;
    }

    const inputCode = Buffer.isBuffer(source) ? source.toString('utf8') : String(source);

    if (!hasStyleXCode(rsOptions, inputCode)) {
      callback(null, source, inputSourceMap);
      return;
    }

    // `transform()` expects options without include/exclude.
    const transformOptions = { ...rsOptions };
    delete transformOptions.include;
    delete transformOptions.exclude;

    const result = transform(filename, inputCode, transformOptions);

    let outputMap = result.map;
    if (typeof outputMap === 'string') {
      try {
        outputMap = JSON.parse(outputMap);
      } catch {
        // Leave as-is if it isn't valid JSON.
      }
    }

    callback(null, result.code, outputMap || inputSourceMap);
  } catch (e) {
    callback(e);
  }
}
