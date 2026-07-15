import type {} from 'hono';
import type { HtmlEscapedString } from 'hono/utils/html';
import 'typed-htmx';

declare module 'hono' {
  interface ContextRenderer {
    (
      content: HtmlEscapedString | Promise<HtmlEscapedString>,
      props?: { title?: string },
    ): Response | Promise<Response>;
  }
}

declare module 'hono/jsx' {
  namespace JSX {
    interface HTMLAttributes extends HtmxAttributes {}
  }
}
