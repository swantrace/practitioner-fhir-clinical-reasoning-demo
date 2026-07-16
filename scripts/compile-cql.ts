import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifactRoot = resolve(
  root,
  'clinical-artifacts/hypertension-bp-followup',
);
const cqlPath = resolve(artifactRoot, 'cql/HypertensionBpFollowup.cql');
const elmPath = resolve(artifactRoot, 'elm/HypertensionBpFollowup.json');
const libraryPath = resolve(
  artifactRoot,
  'fhir/Library-HypertensionBpFollowup.json',
);
const pomPath = resolve(root, 'tools/cql-translator/pom.xml');
const mavenSettingsPath = resolve(root, 'tools/cql-translator/settings.xml');

await mkdir(dirname(elmPath), { recursive: true });

const compiler = spawn(
  'mvn',
  [
    '--quiet',
    '--settings',
    mavenSettingsPath,
    '--file',
    pomPath,
    'exec:java',
    '-Dexec.mainClass=org.cqframework.cql.cql2elm.cli.Main',
    `-Dexec.args=--input ${cqlPath} --output ${elmPath} --format JSON --error-level Warning`,
  ],
  { cwd: root, stdio: 'inherit' },
);

const exitCode = await new Promise<number | null>((resolveExit, reject) => {
  compiler.once('error', reject);
  compiler.once('exit', resolveExit);
});
if (exitCode !== 0) {
  throw new Error(`CQL compilation failed with exit code ${exitCode}.`);
}

const [cql, rawElm, library] = await Promise.all([
  readFile(cqlPath, 'utf8'),
  readFile(elmPath, 'utf8'),
  readFile(libraryPath, 'utf8').then(JSON.parse),
]);
const elm = `${rawElm.trimEnd()}\n`;
await writeFile(elmPath, elm);

library.content = [
  {
    contentType: 'text/cql',
    data: Buffer.from(cql, 'utf8').toString('base64'),
    title: 'HypertensionBpFollowup CQL source',
  },
  {
    contentType: 'application/elm+json',
    data: Buffer.from(elm, 'utf8').toString('base64'),
    title: 'HypertensionBpFollowup executable ELM',
  },
];

await writeFile(libraryPath, `${JSON.stringify(library, null, 2)}\n`);
console.log(`Compiled ${cqlPath}`);
console.log(`Wrote ${elmPath}`);
console.log(`Packaged CQL and ELM in ${libraryPath}`);
