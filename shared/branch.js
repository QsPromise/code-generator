/**
 * 分支检测（共享）
 * 分支名即生成器名：generator/<branch>/index.js 存在才可运行
 */
import { execSync } from 'child_process';

export const resolveBranch = () => {
  if (process.env.CODEGEN_BRANCH) return process.env.CODEGEN_BRANCH; // 测试覆盖用
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
};

// 列出本地可用的生成器分支（排除文档主干分支）
export const listGeneratorBranches = () => {
  try {
    return execSync('git branch --format=%(refname:short)', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .split('\n')
      .map((s) => s.trim())
      .filter((b) => b && b !== 'main' && b !== 'master');
  } catch {
    return [];
  }
};
