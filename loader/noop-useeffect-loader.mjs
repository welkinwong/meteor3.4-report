/* global Buffer */
/**
 * no-op useEffect callback loader (ESM)
 *
 * Server-side React rendering doesn't execute effects, but effect callbacks can
 * pull in heavy deps and add parse/compile overhead to the server bundle.
 *
 * This loader rewrites:
 *   useEffect(() => { ... }, deps)
 *   useLayoutEffect(() => { ... }, deps)
 * into:
 *   useEffect(() => {}, deps)
 *   useLayoutEffect(() => {}, deps)
 *
 * It preserves hook order by keeping the call expression intact.
 */

const isIdentChar = ch => /[A-Za-z0-9_$]/.test(ch);

const skipWhitespaceAndComments = (src, start) => {
  let i = start;
  while (i < src.length) {
    const ch = src[i];

    // whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f') {
      i += 1;
      continue;
    }

    // line comment
    if (ch === '/' && src[i + 1] === '/') {
      i += 2;
      while (i < src.length && src[i] !== '\n') i += 1;
      continue;
    }

    // block comment
    if (ch === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < src.length) {
        if (src[i] === '*' && src[i + 1] === '/') {
          i += 2;
          break;
        }
        i += 1;
      }
      continue;
    }

    return i;
  }
  return i;
};

const readFirstArgRange = (src, argsOpenParenIndex) => {
  // argsOpenParenIndex points at '(' of the call
  let i = skipWhitespaceAndComments(src, argsOpenParenIndex + 1);
  const firstArgStart = i;

  // Parse until top-level ',' or ')'
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (; i < src.length; i += 1) {
    const ch = src[i];
    const next = src[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inSingle) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === "'") {
        inSingle = false;
      }
      continue;
    }

    if (inDouble) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inDouble = false;
      }
      continue;
    }

    if (inTemplate) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '`') {
        inTemplate = false;
      }
      continue;
    }

    // comment starts
    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    // string starts
    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      continue;
    }

    // nesting
    if (ch === '(') {
      parenDepth += 1;
      continue;
    }
    if (ch === ')') {
      if (parenDepth > 0) {
        parenDepth -= 1;
        continue;
      }

      // This is the end of the call args; first arg ends here.
      return { firstArgStart, firstArgEnd: i, hasComma: false };
    }

    if (ch === '[') {
      bracketDepth += 1;
      continue;
    }
    if (ch === ']') {
      if (bracketDepth > 0) bracketDepth -= 1;
      continue;
    }

    if (ch === '{') {
      braceDepth += 1;
      continue;
    }
    if (ch === '}') {
      if (braceDepth > 0) braceDepth -= 1;
      continue;
    }

    if (ch === ',' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      return { firstArgStart, firstArgEnd: i, hasComma: true };
    }
  }

  return null;
};

const looksLikeEffectCallback = expr => {
  const trimmed = expr.trim();
  if (!trimmed) return false;

  // Common shapes:
  // - () => {}
  // - async () => {}
  // - function () {}
  // - async function () {}
  if (/^(?:async\s+)?function\b/.test(trimmed)) return true;
  if (trimmed.includes('=>')) return true;

  return false;
};

const EFFECT_TOKENS = ['useEffect', 'useLayoutEffect'];

const transformNoopEffectCallbacks = source => {
  if (!EFFECT_TOKENS.some(t => source.includes(t))) return source;

  let out = '';
  let last = 0;

  // Track whether we're in strings/comments to avoid matching inside them.
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (inSingle) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === "'") {
        inSingle = false;
      }
      continue;
    }

    if (inDouble) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inDouble = false;
      }
      continue;
    }

    if (inTemplate) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '`') {
        inTemplate = false;
      }
      continue;
    }

    // Start of comment
    if (ch === '/' && next === '/') {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i += 1;
      continue;
    }

    // Start of string
    if (ch === "'") {
      inSingle = true;
      continue;
    }
    if (ch === '"') {
      inDouble = true;
      continue;
    }
    if (ch === '`') {
      inTemplate = true;
      continue;
    }

    // Try to match effect tokens (useEffect/useLayoutEffect)
    if (ch !== 'u') continue;

    for (const token of EFFECT_TOKENS) {
      if (!source.startsWith(token, i)) continue;

      const prev = source[i - 1];
      const nextAfter = source[i + token.length];

      // Ensure identifier boundary: not preceded/followed by identifier chars.
      if ((prev && isIdentChar(prev)) || (nextAfter && isIdentChar(nextAfter))) continue;

      // Find the opening paren
      let j = skipWhitespaceAndComments(source, i + token.length);
      if (source[j] !== '(') continue;

      const firstArg = readFirstArgRange(source, j);
      if (!firstArg) continue;

      const { firstArgStart, firstArgEnd } = firstArg;
      const firstArgExpr = source.slice(firstArgStart, firstArgEnd);

      if (!looksLikeEffectCallback(firstArgExpr)) continue;

      // Apply replacement
      out += source.slice(last, firstArgStart);
      out += '() => {}';
      last = firstArgEnd;

      // Continue scanning from end of replaced segment.
      i = firstArgEnd - 1;
      break;
    }
  }

  if (!out) return source;
  out += source.slice(last);
  return out;
};

export default function noopUseEffectLoader(source) {
  this.cacheable?.(true);

  const inputCode = Buffer.isBuffer(source) ? source.toString('utf8') : String(source);
  const outputCode = transformNoopEffectCallbacks(inputCode);
  return outputCode;
}
