import { jsxRenderer } from 'hono/jsx-renderer';
import { Link } from 'honox/server';

export default jsxRenderer(({ children, title }) => {
  const pageTitle = title
    ? `${title} | Practitioner FHIR`
    : 'Practitioner FHIR';

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
        <link rel="icon" href="/favicon.ico" />
        <Link href="/app/style.css" rel="stylesheet" />
        <script
          async
          src={import.meta.env.PROD ? '/static/client.js' : '/app/client.ts'}
          type="module"
        ></script>
        <script
          src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.10/dist/htmx.min.js"
          integrity="sha384-H5SrcfygHmAuTDZphMHqBJLc3FhssKjG7w/CeCpFReSfwBWDTKpkzPP8c+cLsK+V"
          crossorigin="anonymous"
        ></script>
      </head>
      <body>
        <header class="border-b border-slate-200 bg-white">
          <nav class="page-shell flex items-center justify-between py-4">
            <a class="text-sm font-semibold text-slate-950" href="/patients">
              Practitioner FHIR
            </a>
            <a class="text-sm font-medium" href="/patients">
              Patients
            </a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
});
