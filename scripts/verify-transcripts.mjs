import { spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const update = process.argv.includes('--update');
const cli = join(repo, 'dist/main.js');
const config = join(repo, 'plugins.config.json');
const transcriptDir = join(repo, 'doc/transcript');

function fixture(label) {
  const dir = mkdtempSync(join(tmpdir(), `svg-transcript-${label}-`));
  mkdirSync(join(dir, 'docs'));
  mkdirSync(join(dir, 'plugins'));
  writeFileSync(join(dir, 'demo.svg'), '<svg width="10" height="10"><rect width="10" height="10"/></svg>', 'utf8');
  writeFileSync(join(dir, 'package.json'), '{}\n', 'utf8');
  writeFileSync(join(dir, '.env'), 'HIDDEN=1\n', 'utf8');
  writeFileSync(join(dir, 'other.svg'), '<svg width="100" height="100"><rect width="100" height="100"/></svg>', 'utf8');
  return dir;
}

function run(input, cwd, args) {
  const logDir = mkdtempSync(join(tmpdir(), 'svg-transcript-log-'));
  const out = join(logDir, 'stdout');
  const err = join(logDir, 'stderr');
  const outFd = openSync(out, 'w');
  const errFd = openSync(err, 'w');
  const inFd = openSync(input, 'r');
  try {
    const result = spawnSync(process.execPath, [cli, ...args], {
      cwd,
      stdio: [inFd, outFd, errFd],
      env: { ...process.env, NO_COLOR: '1' },
    });
    if (result.error) throw result.error;
    const stdout = readFileSync(out, 'utf8');
    const stderr = readFileSync(err, 'utf8');
    if (result.status !== 0) throw new Error(`CLI exited ${result.status}: ${stderr}`);
    if (stderr.trim() !== '') throw new Error(`unexpected stderr:\n${stderr}`);
    return stdout;
  } finally {
    closeSync(inFd); closeSync(outFd); closeSync(errFd);
    rmSync(logDir, { recursive: true, force: true });
  }
}

function expected(name) { return join(transcriptDir, 'expected', `${name}.out`); }

function normalize(text) { return text.replace(/\r\n/g, '\n'); }

function compare(name, actual) {
  if (update) {
    writeFileSync(expected(name), actual, 'utf8');
    process.stdout.write(`updated ${name}\n`);
    return;
  }
  const wanted = normalize(readFileSync(expected(name), 'utf8'));
  if (normalize(actual) !== wanted) throw new Error(`${name} differs from ${expected(name)}`);
  process.stdout.write(`ok ${name}\n`);
}

const dirs = [];
try {
  const base = fixture('base'); dirs.push(base);
  compare('cli-1', run(join(transcriptDir, 'cli-1.txt'), base, ['--no-plugins']));

  for (const name of ['cli-box', 'cli-extra']) {
    const a = fixture(`${name}-a`); const b = fixture(`${name}-b`); dirs.push(a, b);
    const code = run(join(transcriptDir, `${name}.txt`), a, []);
    const configured = run(join(transcriptDir, `${name}.txt`), b, ['--config', config]);
    compare(name, code);
    if (code !== configured) throw new Error(`${name}: code/config assembly output differs`);
    process.stdout.write(`ok ${name} dual assembly\n`);
  }
} finally {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
}
