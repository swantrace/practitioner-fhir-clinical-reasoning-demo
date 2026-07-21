import build from '@hono/vite-build/bun';
import tailwindcss from '@tailwindcss/vite';
import honox from 'honox/vite';
import { defineConfig } from 'vite';

const productionServerMiddleware = async (
  appName: string,
  options?: { staticPaths?: string[] },
) => {
  let code = `import { compress } from 'hono/compress'\n`;
  code += `import { serveStatic } from 'hono/bun'\n`;
  code += `if (typeof CompressionStream !== 'undefined') ${appName}.use(compress())\n`;

  for (const path of options?.staticPaths ?? []) {
    code += `${appName}.use('${path}', serveStatic({ root: './' }))\n`;
  }

  return code;
};

export default defineConfig(({ mode }) => ({
  define: {
    // Keep deployment-provided values available in the SSR production bundle.
    'process.env': 'process.env',
  },
  plugins: [
    honox({
      client: { input: ['/app/client.ts', '/app/style.css'] },
    }),
    tailwindcss(),
    build({
      // Recreate the Bun adapter's static hook and compress when the runtime supports it.
      entryContentBeforeHooks: [productionServerMiddleware],
    }),
  ],
  build:
    mode === 'client'
      ? {
          rollupOptions: {
            output: {
              // Global browser enhancements are loaded on every page by the
              // renderer, so keep their production URL stable.
              entryFileNames: 'static/[name].js',
            },
          },
        }
      : undefined,
}));
