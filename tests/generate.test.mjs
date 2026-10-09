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

const loadWorkflowGenerator = async () => {
  const plop = await nodePlop(plopfilePath);
  return plop.getGenerator('official-workflow');
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

  // ---- 用例 4：-path 临时路径模式（不保存）----
  config.lastConfirmDate = '2000-01-01'; // 即使在需要每日确认的日子里，-path 也应跳过确认且不写配置
  const beforeOverride = JSON.stringify(config, null, 2);
  fs.writeFileSync(configPath, beforeOverride);
  process.argv.push('-path');
  gen = await loadGenerator();
  await gen.runActions({
    pathPage: 'tmp/{{name}}.js',
    type: 'page',
    name: 'TempPage'
  });
  process.argv.pop();
  assert(fs.existsSync(path.join(sandbox, 'tmp', 'TempPage.js')), '-path 模式：按临时路径生成文件');
  assert(fs.readFileSync(configPath, 'utf-8') === beforeOverride, '-path 模式：配置文件未被修改');

  // ---- 用例 5：官方工作流配套文件（以 abc 为例）----
  let wgen = await loadWorkflowGenerator();
  await wgen.runActions({ id: 'abc', needForm: true, needPanel: true });
  const wfBase = path.join(sandbox, 'src');
  assert(fs.existsSync(path.join(wfBase, 'data/official-workflows/manifests/abc.ts')), '工作流：manifest 生成');
  assert(fs.existsSync(path.join(wfBase, 'pages/workflows/studio/official/definitions/abc.ts')), '工作流：definition 生成');
  assert(fs.existsSync(path.join(wfBase, 'pages/workflows/studio/official/forms/abc/AbcStartForm.vue')), '工作流：启动表单生成');
  assert(fs.existsSync(path.join(wfBase, 'pages/workflows/studio/official/panels/abc/AbcResultPanel.vue')), '工作流：结果面板生成');
  const manifestContent = fs.readFileSync(path.join(wfBase, 'data/official-workflows/manifests/abc.ts'), 'utf-8');
  assert(manifestContent.includes("id: 'abc'") && manifestContent.includes('workflowAbcName'), '工作流：manifest 内容渲染正确');
  const todoDef = fs.readFileSync(path.join(wfBase, 'pages/workflows/studio/official/definitions/abc.ts'), 'utf-8');
  assert(todoDef.includes('TODO: 实现 abc 的启动接口适配'), '工作流：跳过接口文档时 definition 保留 TODO');

  // ---- 用例 6：提供接口文档 → 生成 API 调用并接线 ----
  wgen = await loadWorkflowGenerator();
  await wgen.runActions({
    id: 'abcapi',
    needForm: false,
    needPanel: false,
    apiDocSource: 'path',
    apiDocPath: path.join(root, 'tests', 'fixtures', 'api-doc.json'),
    startApi: { name: 'createAbcRun', method: 'POST', path: '/official-workflows/abc/runs', description: '启动 abc 工作流' },
    statusApi: { name: 'getAbcRunStatus', method: 'GET', path: '/official-workflows/abc/runs/{runId}', description: '查询运行状态' }
  });
  const apiFile = path.join(sandbox, 'src', 'api', 'abcapi.ts');
  assert(fs.existsSync(apiFile), 'API文档：api 模块生成');
  const apiContent = fs.readFileSync(apiFile, 'utf-8');
  assert(apiContent.includes('export function createAbcRun(payload: Record<string, unknown>)'), 'API文档：启动接口函数签名正确');
  assert(apiContent.includes("http.post(`/official-workflows/abc/runs`, payload)"), 'API文档：启动接口请求正确');
  assert(apiContent.includes('export function getAbcRunStatus(runId: string)'), 'API文档：状态接口路径参数提取正确');
  assert(apiContent.includes('http.get(`/official-workflows/abc/runs/${runId}`)'), 'API文档：状态接口路径插值正确');
  const wiredDef = fs.readFileSync(path.join(sandbox, 'src', 'pages', 'workflows', 'studio', 'official', 'definitions', 'abcapi.ts'), 'utf-8');
  assert(wiredDef.includes("import { createAbcRun, getAbcRunStatus } from '../../../../../api/abcapi'"), 'API文档：definition 导入 API 模块');
  assert(wiredDef.includes('await createAbcRun(payload)') && wiredDef.includes('await getAbcRunStatus(runId)'), 'API文档：definition 已接线 API 调用');

  // ---- 生成 abc 示例到 tests-result/abc-demo 供人工检查（不清理）----
  config.projectRoot = path.join(root, 'tests-result', 'abc-demo');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  wgen = await loadWorkflowGenerator();
  await wgen.runActions({ id: 'abc', needForm: true, needPanel: true });
  console.log('DEMO 已生成到 tests-result/abc-demo');
} finally {
  // 恢复真实配置并清理沙箱
  fs.writeFileSync(configPath, backup);
  fs.rmSync(sandbox, { recursive: true, force: true });
}

console.log(process.exitCode ? 'FAIL' : 'ALL PASS');
