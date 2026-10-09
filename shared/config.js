/**
 * 配置读写（共享）
 * 配置文件位于运行目录的 .plop-config.json，各生成器共用一份
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const CONFIG_PATH = path.join(process.cwd(), '.plop-config.json');

// 默认配置：路径与模板均支持 handlebars 变量（{{name}} / {{pageName}}）
export const DEFAULT_CONFIG = {
  projectRoot: process.cwd(),
  paths: {
    page: 'src/pages/{{name}}/index.js',
    component: 'src/components/{{name}}/index.js',
    pagesComponent: 'src/pages/{{pageName}}/components/{{name}}.js'
  },
  templates: {
    component: 'generator/react/templates/component.hbs'
  },
  lastConfirmDate: ''
};

// 读取配置并与默认值合并，兼容旧版配置文件缺失的字段
export const readConfig = () => {
  const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  return {
    ...DEFAULT_CONFIG,
    ...raw,
    paths: { ...DEFAULT_CONFIG.paths, ...raw.paths },
    templates: { ...DEFAULT_CONFIG.templates, ...raw.templates }
  };
};

export const writeConfig = (config) =>
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

export const today = () => new Date().toISOString().slice(0, 10);
