/**
 * Construit la version artifact (une seule page HTML autonome) publiable sur claude.ai.
 * React est chargé depuis cdnjs ; le reste (app, CSS Tailwind) est inliné.
 *   node scripts/build-artifact.mjs  →  dist/redpower-artifact.html
 */
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

// React via les globales UMD (window.React / window.ReactDOM).
const reactGlobals = {
  name: "react-globals",
  setup(b) {
    b.onResolve({ filter: /^react(-dom\/client|\/jsx-runtime)?$/ }, (a) => ({ path: a.path, namespace: "rg" }));
    b.onLoad({ filter: /.*/, namespace: "rg" }, (a) => {
      if (a.path === "react") return { contents: "module.exports = window.React;", loader: "js" };
      if (a.path === "react-dom/client") return { contents: "module.exports = window.ReactDOM;", loader: "js" };
      return {
        contents: `const R = window.React;
          const make = (t, p, k) => R.createElement(t, k === undefined ? p : Object.assign({}, p, { key: k }));
          export const Fragment = R.Fragment; export const jsx = make; export const jsxs = make;`,
        loader: "js",
      };
    });
  },
};

// JSON Schemas des réponses, calculés ici pour ne pas embarquer zod dans la page.
const schemaBundle = await build({
  stdin: {
    contents: `import { z } from "zod"; import { CompanyIntelSchema, CampaignPlanSchema } from "./src/lib/schemas";
      export default { company: z.toJSONSchema(CompanyIntelSchema), campaign: z.toJSONSchema(CampaignPlanSchema) };`,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  logLevel: "warning",
});
const schemas = (await import(`data:text/javascript;base64,${Buffer.from(schemaBundle.outputFiles[0].text).toString("base64")}`)).default;
for (const s of Object.values(schemas)) delete s.$schema;

const js = await build({
  entryPoints: [path.join(root, "src/artifact/main.tsx")],
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  alias: { "@": path.join(root, "src") },
  define: { "process.env.NODE_ENV": '"production"', __RP_SCHEMAS__: JSON.stringify(schemas) },
  plugins: [reactGlobals],
  logLevel: "warning",
});

const cssSrc = path.join(root, "src/app/globals.css");
const css = await postcss([tailwind({ base: root, optimize: { minify: true } })]).process(await readFile(cssSrc, "utf8"), { from: cssSrc });

const html = `<title>RedPower</title>
<meta name="description" content="Analyse d'entreprise, communautés Reddit, campagnes et simulation de performance.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
<style>${css.css}</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${js.outputFiles[0].text.replace(/<\/script/g, "<\\/script")}</script>
`;

await mkdir(path.join(root, "dist"), { recursive: true });
const out = path.join(root, "dist/redpower-artifact.html");
await writeFile(out, html);
console.log(`${out} (${(html.length / 1024).toFixed(0)} KB)`);
