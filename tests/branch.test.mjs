/**
 * 分支门禁测试（main）：main/未知分支禁止运行并给出引导
 * 生成器的正向加载测试在各生成器自己的分支上（tests/<branch>.test.mjs）
 */
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const plopfilePath = path.join(root, 'plopfile.js');

const assert = (cond, msg) => {
  if (!cond) {
    console.error(`✘ ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`✔ ${msg}`);
  }
};

const runOn = (branch) =>
  spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `import nodePlop from 'node-plop'; await nodePlop(${JSON.stringify(plopfilePath)});`],
    { cwd: root, env: { ...process.env, CODEGEN_BRANCH: branch }, encoding: 'utf-8' }
  );

const mainRun = runOn('main');
assert(mainRun.status === 1, 'main 分支退出码为 1');
assert(mainRun.stderr.includes('禁止运行'), 'main 分支提示禁止运行');

const unknownRun = runOn('nonexistent-branch');
assert(unknownRun.status === 1 && unknownRun.stderr.includes('nonexistent-branch'), '未知分支拒绝运行并指出分支名');

console.log(process.exitCode ? 'FAIL' : 'ALL PASS');
