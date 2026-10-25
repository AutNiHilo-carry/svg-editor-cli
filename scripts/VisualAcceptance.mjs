import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, unlinkSync, rmdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

class VisualAcceptance {
  #root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

  runCli(commands) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/main.ts'], {
      cwd: this.#root,
      input: commands.join('\n'),
      encoding: 'utf8',
      timeout: 15_000,
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(result.stdout, /^error:/m);
  }

  async run() {
    const source = join(this.#root, 'examples', 'flowchart.svg');
    const output = join(this.#root, 'doc', 'previews');
    const temporary = mkdtempSync(join(tmpdir(), 'svg-visual-'));
    let browser;
    try {
      mkdirSync(output, { recursive: true });
      const variants = [
        { name: 'baseline', path: source, commands: [] },
        { name: 'moved', path: join(temporary, 'moved.svg'), commands: ['move node2 0 100'] },
        { name: 'scaled', path: join(temporary, 'scaled.svg'), commands: ['scale flowchart 0.8'] },
        { name: 'undo-restored', path: join(temporary, 'restored.svg'), commands: ['move node2 0 100', 'undo'] },
      ];
      for (const variant of variants.slice(1)) {
        this.runCli([`read ${JSON.stringify(source)}`, ...variant.commands, `save ${JSON.stringify(variant.path)}`]);
      }
      browser = await chromium.launch(process.env.SVG_BROWSER_PATH
        ? { executablePath: process.env.SVG_BROWSER_PATH, headless: true }
        : { channel: 'msedge', headless: true });
      const context = await browser.newContext({ viewport: { width: 840, height: 640 }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const report = { browser: browser.version(), source: 'examples/flowchart.svg',
        sourceSha256: createHash('sha256').update(readFileSync(source)).digest('hex'), scenarios: [] };
      for (const variant of variants) {
        await page.goto(pathToFileURL(variant.path).href);
        await page.evaluate(async () => { await document.fonts.ready; });
        const observation = await page.evaluate(() => {
          const bounds = element => {
            const box = element.getBBox();
            return { x: box.x, y: box.y, width: box.width, height: box.height };
          };
          const start = document.getElementById('start');
          const process = document.getElementById('process');
          const startLabel = document.getElementById('start-label');
          const processLabel = document.getElementById('process-label');
          const line = document.getElementById('arrow1');
          return {
            elementCount: document.querySelectorAll('svg [id]').length,
            start: bounds(start), process: bounds(process),
            startLabel: { text: startLabel.textContent, ...bounds(startLabel) },
            processLabel: { text: processLabel.textContent, ...bounds(processLabel) },
            fills: [getComputedStyle(start).fill, getComputedStyle(process).fill],
            line: bounds(line),
          };
        });
        assert.equal(observation.elementCount, 8);
        assert.equal(observation.startLabel.text, '开始');
        assert.equal(observation.processLabel.text, '处理数据 v2');
        assert.deepEqual(observation.fills, ['rgb(74, 144, 217)', 'rgb(245, 166, 35)']);
        for (const [rect, label] of [[observation.start, observation.startLabel], [observation.process, observation.processLabel]]) {
          assert.ok(label.x >= rect.x && label.x + label.width <= rect.x + rect.width, `${variant.name}: 文本水平越界`);
          assert.ok(label.y >= rect.y && label.y + label.height <= rect.y + rect.height, `${variant.name}: 文本垂直越界`);
        }
        const factor = variant.name === 'scaled' ? 0.8 : 1;
        assert.ok(Math.abs(observation.start.x - 120 * factor) < 0.001);
        assert.ok(Math.abs(observation.start.width - 160 * factor) < 0.001);
        assert.ok(Math.abs(observation.process.y - (variant.name === 'moved' ? 200 : 100 * factor)) < 0.001);
        const screenshot = `${variant.name}.png`;
        await page.locator('svg').screenshot({ path: join(output, screenshot), animations: 'disabled' });
        report.scenarios.push({ name: variant.name, screenshot, ...observation });
      }
      assert.ok(readFileSync(join(output, 'baseline.png')).equals(readFileSync(join(output, 'undo-restored.png'))), '撤销后的截图与原图不一致');
      report.undoScreenshotMatchesBaseline = true;
      writeFileSync(join(output, 'measurements.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
      console.log('四种状态渲染及几何检查通过，撤销前后截图一致。输出：doc/previews/');
    } finally {
      if (browser) await browser.close();
      // 临时目录中只生成 SVG 文件，逐个删除，避免递归删除目录。
      for (const name of readdirSync(temporary)) unlinkSync(join(temporary, name));
      rmdirSync(temporary);
    }
  }
}

await new VisualAcceptance().run();
