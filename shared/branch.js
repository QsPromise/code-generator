/**
 * 分支检测（共享）
 * 分支名即生成器名：generator/<branch>/index.js 存在才可运行
 * 注意：git 命令固定在生成器仓库根目录执行，与运行目录无关（全局 CLI 场景）
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const git = (args) =>
  execSync(`git ${args}`, { cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();

export const resolveBranch = () => {
  if (process.env.CODEGEN_BRANCH) return process.env.CODEGEN_BRANCH; // 测试覆盖用
  try {
    return git('rev-parse --abbrev-ref HEAD');
  } catch {
    return '';
  }
};

// 列出本地可用的生成器分支（排除文档主干分支）
export const listGeneratorBranches = () => {
  try {
    return git('branch --format=%(refname:short)')
      .split('\n')
      .map((s) => s.trim())
      .filter((b) => b && b !== 'main' && b !== 'master');
  } catch {
    return [];
  }
};
