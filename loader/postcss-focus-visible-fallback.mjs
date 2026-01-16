/* global console */
import postcss from 'postcss';

const splitSelectorList = selectorText => {
  // Splits on commas that are not inside parentheses.
  const parts = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < selectorText.length; i++) {
    const ch = selectorText[i];

    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);

    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) parts.push(current.trim());

  return parts;
};

const hasOutlineDecl = rule => {
  let found = false;
  rule.walkDecls(decl => {
    if (decl.prop && decl.prop.toLowerCase() === 'outline') {
      found = true;
      return false;
    }
  });
  return found;
};

const shouldProcessSelector = selector => {
  if (!selector.includes(':focus-visible')) return false;

  // Avoid generating nonsense from patterns like :focus:not(:focus-visible)
  // which are already the recommended modern-browser pattern.
  if (selector.includes(':not(:focus-visible')) return false;

  return true;
};

const toFallbackSelector = selector => selector.replaceAll(':focus-visible', ':focus');

const postcssFocusVisibleFallback = (opts = {}) => {
  const options = { verbose: false, ...opts };

  return {
    postcssPlugin: 'postcss-focus-visible-fallback',
    Once(root) {
      const supportsNotRule = postcss.atRule({
        name: 'supports',
        params: 'not selector(:focus-visible)',
      });

      if (root && root.source) {
        supportsNotRule.source = root.source;
      }

      const addedSelectors = new Set();
      let processedRuleCount = 0;
      let generatedSelectorCount = 0;

      root.walkRules(rule => {
        // Skip anything already inside an @supports block to avoid
        // recursion / duplicate fallbacks.
        if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'supports') {
          return;
        }

        if (!rule.selector || !rule.selector.includes(':focus-visible')) {
          return;
        }

        // Only generate fallback if the :focus-visible rule touches `outline`.
        if (!hasOutlineDecl(rule)) {
          return;
        }

        processedRuleCount++;

        const selectors = splitSelectorList(rule.selector);
        const newFallbackSelectors = [];

        for (const sel of selectors) {
          if (!shouldProcessSelector(sel)) continue;

          const fallbackSel = toFallbackSelector(sel);
          if (addedSelectors.has(fallbackSel)) continue;

          addedSelectors.add(fallbackSel);
          newFallbackSelectors.push(fallbackSel);
        }

        if (newFallbackSelectors.length === 0) {
          return;
        }

        generatedSelectorCount += newFallbackSelectors.length;

        const fallbackRule = postcss.rule({
          selector: newFallbackSelectors.join(', '),
        });

        if (rule && rule.source) {
          fallbackRule.source = rule.source;
        }

        // The goal for legacy browsers is to remove the focus ring
        // (Chrome 64 shows a default blue outline on :focus).
        fallbackRule.append(
          postcss.decl({
            prop: 'outline',
            value: 'none',
          })
        );

        supportsNotRule.append(fallbackRule);

        if (options.verbose) {
          console.log(
            `[focus-visible-fallback] + ${newFallbackSelectors.length} selector(s) from: ${rule.selector}`
          );
        }
      });

      if (supportsNotRule.nodes && supportsNotRule.nodes.length > 0) {
        root.append(supportsNotRule);

        if (options.verbose) {
          console.log(
            `[focus-visible-fallback] done: processed ${processedRuleCount} rule(s), generated ${generatedSelectorCount} selector(s)`
          );
        }
      } else if (options.verbose) {
        console.log('[focus-visible-fallback] no :focus-visible + outline rules found');
      }
    },
  };
};

postcssFocusVisibleFallback.postcss = true;

export default postcssFocusVisibleFallback;
