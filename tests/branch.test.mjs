/**
 * 分支门禁测试（可在任意分支运行）：
 * 把入口与 shared/ 复制到无 generator/ 的沙箱中，验证无生成器时拒绝运行并给出引导
 * （扁平化槽位后，门禁取决于 generator/index.js 是否存在，需在无生成器的目录中验证）
 */
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const sandbox = path.join(root, 'tests-result', 'gate-sandbox');

const assert = (cond, msg) => {
  if (!cond) {
    console.error(`✘ ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`✔ ${msg}`);
  }
};

// 搭建沙箱：只有 plopfile.js + shared/，没有 generator/
fs.rmSync(sandbox, { recursive: true, force: true });
fs.mkdirSync(path.join(sandbox, 'shared'), { recursive: true });
fs.copyFileSync(path.join(root, 'plopfile.js'), path.join(sandbox, 'plopfile.js'));
for (const f of fs.readdirSync(path.join(root, 'shared'))) {
  fs.copyFileSync(path.join(root, 'shared', f), path.join(sandbox, 'shared', f));
}

const runOn = (branch) =>
  spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `import nodePlop from 'node-plop'; await nodePlop(${JSON.stringify(path.join(sandbox, 'plopfile.js'))});`],
    { cwd: root, env: { ...process.env, CODEGEN_BRANCH: branch }, encoding: 'utf-8' }
  );

try {
  const mainRun = runOn('main');
  assert(mainRun.status === 1, 'main 分支退出码为 1');
  assert(mainRun.stderr.includes('禁止运行'), 'main 分支提示禁止运行');

  const unknownRun = runOn('nonexistent-branch');
  assert(unknownRun.status === 1 && unknownRun.stderr.includes('nonexistent-branch'), '未知分支拒绝运行并指出分支名');
} finally {
  fs.rmSync(sandbox, { recursive: true, force: true });
}

console.log(process.exitCode ? 'FAIL' : 'ALL PASS');
