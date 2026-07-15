import type { ErrorHandler } from 'hono';

const handler: ErrorHandler = (_error, c) => {
  c.status(500);
  return c.render(
    <main class="page-shell">
      <h1 class="section-title">Something went wrong</h1>
      <p class="mt-2 text-sm text-slate-600">Please try again in a moment.</p>
    </main>,
  );
};

export default handler;
