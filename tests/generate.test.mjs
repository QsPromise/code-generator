/**
 * 非交互功能测试（沙箱隔离，不污染项目与真实配置）：
 * 1. 首次运行：无配置 → 写入配置并生成文件
 * 2. 每日确认-沿用：lastConfirmDate 非今日 → 使用已保存路径生成
 * 3. 每日确认-修改：不沿用并传入新路径 → 更新配置并按新路径生成
 */
import nodePlop from 'node-plop';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const root = path.dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const plopfilePath = path.join(root, 'plopfile.js');
const configPath = path.join(root, '.plop-config.json');
const sandbox = path.join(root, 'tests-result', 'sandbox');

const backup = fs.readFileSync(configPath, 'utf-8');

const assert = (cond, msg) => {
  if (!cond) {
    console.error(`✘ ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`✔ ${msg}`);
  }
};

const loadGenerator = async () => {
  const plop = await nodePlop(plopfilePath);
  return plop.getGenerator('react');
};

const readConfig = () => JSON.parse(fs.readFileSync(configPath, 'utf-8'));

try {
  // ---- 用例 1：首次运行（无配置文件）----
  fs.rmSync(configPath);
  let gen = await loadGenerator();
  await gen.runActions({
    projectRoot: sandbox,
    pathPage: 'pages/{{name}}.js',
    pathComponent: 'components/{{name}}.js',
    pathPagesComponent: 'pages/{{pageName}}/parts/{{name}}.js',
    templateComponent: 'templates/component.hbs',
    type: 'page',
    name: 'FirstPage'
  });
  let config = readConfig();
  assert(fs.existsSync(path.join(sandbox, 'pages', 'FirstPage.js')), '首次运行：页面文件按自定义路径生成');
  assert(config.paths.page === 'pages/{{name}}.js', '首次运行：配置已写入自定义路径');
  assert(config.lastConfirmDate !== '', '首次运行：已记录确认日期');

  // ---- 用例 2：每日确认 - 沿用已保存路径 ----
  config.lastConfirmDate = '2000-01-01'; // 模拟新的一天
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  gen = await loadGenerator();
  await gen.runActions({ useSavedPaths: true, type: 'component', name: 'KeepComp' });
  config = readConfig();
  assert(fs.existsSync(path.join(sandbox, 'components', 'KeepComp.js')), '每日确认-沿用：按已保存路径生成组件');
  assert(config.lastConfirmDate === new Date().toISOString().slice(0, 10), '每日确认-沿用：确认日期已更新为今日');

  // ---- 用例 3：每日确认 - 不沿用并修改路径 ----
  config.lastConfirmDate = '2000-01-01';
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  gen = await loadGenerator();
  await gen.runActions({
    useSavedPaths: false,
    pathComponent: 'lib/{{name}}.js',
    type: 'component',
    name: 'NewComp'
  });
  config = readConfig();
  assert(fs.existsSync(path.join(sandbox, 'lib', 'NewComp.js')), '每日确认-修改：按新路径生成组件');
  assert(config.paths.component === 'lib/{{name}}.js', '每日确认-修改：新路径已保存到配置');
} finally {
  // 恢复真实配置并清理沙箱
  fs.writeFileSync(configPath, backup);
  fs.rmSync(sandbox, { recursive: true, force: true });
}

console.log(process.exitCode ? 'FAIL' : 'ALL PASS');
