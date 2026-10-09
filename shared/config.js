/**
 * 配置读写（共享）
 * 配置文件位于运行目录的 .plop-config.json，按分支分区隔离：
 * { "branches": { "react": {...}, "official-workflow": {...} } }
 * 旧版平铺格式自动视为 react 分区的配置（向后兼容）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const CONFIG_PATH = path.join(process.cwd(), '.plop-config.json');

export const today = () => new Date().toISOString().slice(0, 10);

// 读取整个配置文件（旧版平铺格式自动迁移为 branches.react）
const readConfigFile = () => {
  if (!fs.existsSync(CONFIG_PATH)) return { branches: {} };
  const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  if (raw.branches) return raw;
  return { branches: { react: raw } };
};

const mergeSection = (defaults, section) => ({
  ...defaults,
  ...section,
  paths: { ...defaults.paths, ...section?.paths },
  templates: { ...defaults.templates, ...section?.templates }
});

// 该分支是否已有配置分区
export const hasConfig = (branch) => readConfigFile().branches[branch] != null;

// 读取指定分支的配置分区，与生成器自带的默认值合并
export const readConfig = (branch, defaults = {}) =>
  mergeSection(defaults, readConfigFile().branches[branch]);

// 写入指定分支的配置分区（不影响其他分支）
export const writeConfig = (branch, section) => {
  const file = readConfigFile();
  file.branches[branch] = section;
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(file, null, 2));
};
