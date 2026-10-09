/**
 * 代码生成器入口（分支驱动）
 * 约定：分支即生成器，加载固定槽位 generator/index.js（内容随分支而不同）
 * main 分支仅提供说明文档与共享代码（shared/），禁止运行 npm run new
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { resolveBranch, listGeneratorBranches } from './shared/branch.js';

const REPO_ROOT = path.dirname(fileURLToPath(import.meta.url));

export default async function (plop) {
  const branch = resolveBranch();
  const entry = path.join(REPO_ROOT, 'generator', 'index.js');
  if (!fs.existsSync(entry)) {
    console.error(`⛔ 当前分支 '${branch || '未知'}' 没有对应生成器（generator/index.js 不存在）`);
    console.error('本项目为分支驱动：main 分支仅提供说明文档与共享代码，禁止运行 npm run new');
    const branches = listGeneratorBranches();
    if (branches.length) {
      console.error('可用生成器分支：');
      for (const b of branches) console.error(`  git checkout ${b}`);
    }
    console.error('新增生成器请见 generator/README.md');
    process.exit(1);
  }
  const mod = await import(pathToFileURL(entry).href);
  await mod.default(plop);
}
