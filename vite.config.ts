import build from '@hono/vite-build/node';
import tailwindcss from '@tailwindcss/vite';
import honox from 'honox/vite';
import { defineConfig } from 'vite';

const productionServerMiddleware = async (
  appName: string,
  options?: { staticPaths?: string[] },
) => {
  let code = `import { compress } from 'hono/compress'\n`;
  code += `import { serveStatic } from '@hono/node-server/serve-static'\n`;
  code += `${appName}.use(compress())\n`;

  for (const path of options?.staticPaths ?? []) {
    code += `${appName}.use('${path}', serveStatic({ root: './' }))\n`;
  }

  return code;
};

export default defineConfig({
  define: {
    // Keep deployment-provided values available in the SSR production bundle.
    'process.env': 'process.env',
  },
  plugins: [
    honox({
      client: { input: ['/app/style.css'] },
    }),
    tailwindcss(),
    build({
      port: 8080,
      // The Node adapter's default hook serves static files before the app.
      // Recreate it here so compression also wraps CSS, favicon, and other assets.
      entryContentBeforeHooks: [productionServerMiddleware],
    }),
  ],
});
