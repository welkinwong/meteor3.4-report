/* global console */
import postcss from 'postcss';

const postcssWhereFallback = (opts = {}) => {
  const options = { verbose: false, ...opts };

  return {
    postcssPlugin: 'postcss-where-fallback',
    Once(root) {
      // 1. Create a unique @supports not container; use :where(*) to detect support for :where
      const supportsNotRule = postcss.atRule({
        name: 'supports',
        params: 'not selector(:where(*))',
      });

      // Help sourcemaps: if we generate new nodes without `source`, DevTools
      // often shows them as <no source>.
      if (root && root.source) {
        supportsNotRule.source = root.source;
      }

      let processedCount = 0;

      // 2. Walk all rules
      root.walkRules(rule => {
        // Skip rules already inside @supports
        if (rule.parent && rule.parent.type === 'atrule' && rule.parent.name === 'supports') {
          return;
        }

        const originalSelector = rule.selector;

        // Only process rules that contain :where()
        if (!originalSelector.includes(':where(')) {
          return;
        }

        processedCount++;

        // 3. Generate fallback selectors with robust string replacement
        let fallbackSelector = originalSelector;
        let hasWhere = false;

        // Iteratively replace all :where(...) instances
        let replaceCount = 0;
        const maxReplacements = 10;

        while (fallbackSelector.includes(':where(') && replaceCount < maxReplacements) {
          hasWhere = true;
          replaceCount++;

          const startIdx = fallbackSelector.indexOf(':where(');
          let endIdx = startIdx + 7;
          let bracketDepth = 0;

          // Find matching closing parenthesis
          for (let i = startIdx + 7; i < fallbackSelector.length; i++) {
            if (fallbackSelector[i] === '(') bracketDepth++;
            else if (fallbackSelector[i] === ')') {
              if (bracketDepth === 0) {
                endIdx = i;
                break;
              }
              bracketDepth--;
            }
          }

          if (endIdx > startIdx + 7) {
            const before = fallbackSelector.substring(0, startIdx);
            const inside = fallbackSelector.substring(startIdx + 7, endIdx);
            const after = fallbackSelector.substring(endIdx + 1);
            fallbackSelector = before + inside + after;
          } else {
            // Parentheses mismatch, stop replacing
            if (options.verbose) {
              console.warn(`[where-fallback] Selector parentheses may be unbalanced: ${originalSelector}`);
            }
            break;
          }
        }

        // 4. If :where() was removed, create a fallback rule
        if (hasWhere && fallbackSelector !== originalSelector) {
          // Create fallback rule (selector has :where removed)
          const fallbackRule = postcss.rule({
            selector: fallbackSelector,
          });

          // Preserve source location for sourcemaps.
          if (rule && rule.source) {
            fallbackRule.source = rule.source;
          }

          // Copy all declarations
          rule.nodes.forEach(node => {
            if (node.type === 'decl') {
              fallbackRule.append(node.clone());
            }
          });

          // Append fallback rule to the @supports not container
          supportsNotRule.append(fallbackRule);

          if (options.verbose) {
            console.log(`[where-fallback] Converted: "${originalSelector}" → "${fallbackSelector}"`);
          }
        } else if (options.verbose && !hasWhere) {
          console.log(`[where-fallback] Skipped (no valid :where found): ${originalSelector}`);
        }
      });

      // 5. If any fallback rules were generated, append them to the stylesheet
      if (supportsNotRule.nodes && supportsNotRule.nodes.length > 0) {
        root.append(supportsNotRule);

        if (options.verbose) {
          console.log(`[where-fallback] Done: generated fallbacks for ${processedCount} rules`);
          console.log(`[where-fallback] Fallback rules wrapped in: @supports not selector(:where(*))`);
          console.log(
            `[where-fallback] Note: this fallback relies on legacy browsers (e.g., Chrome 64) leniently parsing @supports not selector(:where(*))`
          );
        }
      } else if (options.verbose) {
        console.log('[where-fallback] No :where() rules needing fallback were found');
      }
    },
  };
};

// Hint for tooling that expects PostCSS plugin creators
postcssWhereFallback.postcss = true;

export default postcssWhereFallback;
