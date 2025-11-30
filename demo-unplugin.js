import { createUnplugin } from 'unplugin';

export const demoUnplugin = createUnplugin(() => {
  console.log('[demo-unplugin][factory-created]');
  return {
    name: 'demo-unplugin',
    transformInclude(id) {
      const ok =
        id.endsWith('.tsx') ||
        id.endsWith('.ts') ||
        id.endsWith('.jsx') ||
        id.endsWith('.js');

      if (ok) {
        console.log('[demo-unplugin][transformInclude]', id, '=> true');
      }
      return ok;
    },
    transform(code, id) {
      console.log('[demo-unplugin][transform-enter]', id);
      return { code, map: null };
    },
  };
});

export const demoRspackPlugin = demoUnplugin.rspack;