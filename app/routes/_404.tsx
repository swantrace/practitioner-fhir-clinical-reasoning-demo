import { createRoute } from 'honox/factory';

export default createRoute((c) => {
  c.status(404);
  return c.render(<main class="page-shell">Not found</main>);
});
