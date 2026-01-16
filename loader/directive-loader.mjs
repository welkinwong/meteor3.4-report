const extractEsmExports = source => {
  const exported = new Map();
  let hasDefaultExport = false;

  // Note: this loader runs before SWC, so the source may be TS/TSX.
  // We intentionally keep parsing lightweight (regex-based) since we only
  // need a best-effort list of exported bindings for stub generation.
  const defaultRe = /\bexport\s+default\b/;
  if (defaultRe.test(source)) hasDefaultExport = true;

  // export function foo() {}
  {
    const re = /\bexport\s+(?:declare\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g;
    let match;
    while ((match = re.exec(source))) exported.set(match[1], 'function');
  }

  // export class Foo {}
  {
    const re = /\bexport\s+(?:declare\s+)?class\s+([A-Za-z_$][\w$]*)/g;
    let match;
    while ((match = re.exec(source))) exported.set(match[1], 'value');
  }

  // export enum Foo {}
  {
    const re = /\bexport\s+(?:declare\s+)?enum\s+([A-Za-z_$][\w$]*)/g;
    let match;
    while ((match = re.exec(source))) exported.set(match[1], 'value');
  }

  // export const foo = () => {}   /  export const foo = async () => {}  /  export const foo = function() {}
  // export const foo = bar => {}  /  export const foo = async bar => {}
  {
    const fnConstRe =
      /\bexport\s+(?:declare\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/g;
    let match;
    while ((match = fnConstRe.exec(source))) exported.set(match[1], 'function');
  }

  // export const/let/var foo = ... (fallback as value)
  {
    const re = /\bexport\s+(?:declare\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g;
    let match;
    while ((match = re.exec(source))) {
      if (!exported.has(match[1])) exported.set(match[1], 'value');
    }
  }

  // export { a, b as c } [from 'x']
  const exportListRe = /\bexport\s*{([^}]+)}\s*(?:from\s*['"][^'"]+['"]\s*)?;?/g;
  let listMatch;
  while ((listMatch = exportListRe.exec(source))) {
    const specList = listMatch[1]
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    for (const spec of specList) {
      // spec can be: "a", "a as b", "type A" (TS) — ignore the TS-only keyword.
      const cleaned = spec.replace(/^type\s+/, '').trim();
      if (!cleaned) continue;
      const parts = cleaned.split(/\s+as\s+/i).map(s => s.trim());
      const exportedName = (parts[1] || parts[0]).trim();
      if (exportedName && !exported.has(exportedName)) exported.set(exportedName, 'value');
    }
  }

  // If the module has `export * from ...`, we can't enumerate names safely.
  // In that case we still strip implementation but we won't synthesize names.
  const hasExportStar = /\bexport\s*\*\s*from\s*['"][^'"]+['"]/g.test(source);

  return {
    exported,
    hasDefaultExport,
    hasExportStar,
  };
};

const buildEmptyEsmWithStubs = (source, reason) => {
  const { exported, hasDefaultExport, hasExportStar } = extractEsmExports(source);

  const lines = [`/* Module content stripped by use-directive-loader (${reason}) */`];

  // Preserve default export only if it existed in the original module.
  if (hasDefaultExport) lines.push('export default {};');

  // Best-effort named export stubs to satisfy ESM linking.
  if (!hasExportStar) {
    for (const [name, kind] of exported.entries()) {
      if (name === 'default') continue;

      if (kind === 'function') {
        lines.push(
          `export const ${name} = (...args) => { throw new Error(${JSON.stringify(
            `[use-directive-loader] Stripped module export '${name}' was called in a disallowed environment (${reason}).`
          )}); };`
        );
      } else {
        lines.push(`export const ${name} = undefined;`);
      }
    }
  }

  // Ensure this remains an ESM even if nothing was exported.
  lines.push('export {};');
  return `${lines.join('\n')}\n`;
};

const useDirectiveLoader = function (source) {
  // Mark loader as cacheable to improve build performance
  this.cacheable(true);

  // Get target environment from Rspack options ('client' or 'server')
  const targetEnv = this.getOptions().targetEnv;

  // Check for directives at the top of the file (first 100 characters)
  const head = source.substring(0, 100);
  const useClientDirective = /['"]use client['"]/.test(head);
  const useServerDirective = /['"]use server['"]/.test(head);

  let outputSource = source;

  if (useClientDirective && targetEnv === 'server') {
    // If this is a server build and the file is marked 'use client'
    outputSource = buildEmptyEsmWithStubs(source, 'use client on server');
  } else if (useServerDirective && targetEnv === 'client') {
    // If this is a client build and the file is marked 'use server'
    outputSource = buildEmptyEsmWithStubs(source, 'use server on client');
  }

  return outputSource;
};

export default useDirectiveLoader;
