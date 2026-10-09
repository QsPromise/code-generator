/**
 * @author :qingshanscript
 * @create :2025-05-19 14:30 PM
 * @license :MIT
 * @LastEditor :qingshanscript
 * @lastEditTime :2026-10-09
 * @filePath :\code-generator\plopfile.js
 * @desc :代码生成器入口，支持自定义输出路径、模板路径，每日首次使用确认路径
 *        所有交互均通过 plop 生成器的 prompts 完成（when 条件控制），
 *        避免引入第二个 inquirer 实例导致 readline 冲突
 */

import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), '.plop-config.json');

// 默认配置：路径与模板均支持 handlebars 变量（{{name}} / {{pageName}}）
const DEFAULT_CONFIG = {
  projectRoot: process.cwd(),
  paths: {
    page: 'src/pages/{{name}}/index.js',
    component: 'src/components/{{name}}/index.js',
    pagesComponent: 'src/pages/{{pageName}}/components/{{name}}.js'
  },
  templates: {
    component: 'templates/component.hbs'
  },
  lastConfirmDate: ''
};

// 读取配置并与默认值合并，兼容旧版配置文件缺失的字段
const readConfig = () => {
  const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  return {
    ...DEFAULT_CONFIG,
    ...raw,
    paths: { ...DEFAULT_CONFIG.paths, ...raw.paths },
    templates: { ...DEFAULT_CONFIG.templates, ...raw.templates }
  };
};
const writeConfig = (config) =>
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

const today = () => new Date().toISOString().slice(0, 10);

export default function (plop) {
  const configExists = fs.existsSync(CONFIG_PATH);
  const config = configExists ? readConfig() : DEFAULT_CONFIG;
  // -path / --path：本次运行临时指定路径，询问但不保存
  const overridePaths = process.argv.includes('-path') || process.argv.includes('--path');
  // 每个自然日第一次使用需要确认路径（临时路径模式下跳过）
  const needConfirm = !overridePaths && configExists && config.lastConfirmDate !== today();
  // 临时路径模式、首次使用 或 每日确认时选择不沿用 → 显示路径配置提问
  const shouldAskPaths = (answers) =>
    overridePaths || !configExists || (needConfirm && answers.useSavedPaths === false);

  plop.setGenerator('react', {
    description: '创建一个新的 React 模板',
    prompts: [
      {
        type: 'input',
        name: 'projectRoot',
        message: '默认项目根路径:',
        default: config.projectRoot,
        when: !configExists
      },
      {
        type: 'confirm',
        name: 'useSavedPaths',
        message: '今日首次使用，是否沿用已保存的路径配置？',
        default: true,
        when: needConfirm
      },
      {
        type: 'input',
        name: 'pathPage',
        message: '页面文件输出路径（支持 {{name}}）:',
        default: config.paths.page,
        when: shouldAskPaths
      },
      {
        type: 'input',
        name: 'pathComponent',
        message: '公共组件输出路径（支持 {{name}}）:',
        default: config.paths.component,
        when: shouldAskPaths
      },
      {
        type: 'input',
        name: 'pathPagesComponent',
        message: '私有组件输出路径（支持 {{pageName}} 与 {{name}}）:',
        default: config.paths.pagesComponent,
        when: shouldAskPaths
      },
      {
        type: 'input',
        name: 'templateComponent',
        message: '组件模板文件路径:',
        default: config.templates.component,
        when: shouldAskPaths
      },
      {
        type: 'list',
        name: 'type',
        message: '选择模板类型:',
        choices: [
          { name: '页面', value: 'page' },
          { name: '公共组件', value: 'component' },
          { name: '私有组件', value: 'pages_component' }
        ],
        default: 'page'
      },
      {
        type: 'input',
        name: 'pageName',
        message: '请输入该私有组件的所属页面',
        when: (answers) => answers.type === 'pages_component' // 只有当选择了私有组件时才显示
      },
      {
        type: 'input',
        name: 'name',
        message: (answers) => {
          if (answers.type === 'pages_component') return '请输入该私有组件名称';
          if (answers.type === 'component') return '请输入组件名称';
          return '请输入页面名称';
        },
        validate: (input) => {
          if (!input) {
            return '❌ 名称不能为空'; // 返回错误信息
          }
          return true; // 验证通过
        }
      }
    ],
    actions: function (app) {
      const isFirstRun = !configExists;
      const next = {
        projectRoot: isFirstRun ? app.projectRoot : config.projectRoot,
        paths: {
          page: app.pathPage ?? config.paths.page,
          component: app.pathComponent ?? config.paths.component,
          pagesComponent: app.pathPagesComponent ?? config.paths.pagesComponent
        },
        templates: {
          component: app.templateComponent ?? config.templates.component
        },
        lastConfirmDate: today()
      };
      // 首次使用或每日确认后，保存配置（同日后续运行不再打扰）；临时路径模式不写配置
      if (overridePaths) {
        console.log('📌 本次使用临时路径，不会写入配置');
      } else if (isFirstRun || needConfirm) {
        writeConfig(next);
        console.log(isFirstRun ? '✅ 配置已初始化' : '✅ 路径配置已确认并保存');
      }
      const pathMap = {
        page: next.paths.page,
        component: next.paths.component,
        pages_component: next.paths.pagesComponent
      };
      return [
        {
          type: 'add', // 添加文件
          path: path.join(next.projectRoot, pathMap[app.type]),
          templateFile: next.templates.component
        }
      ];
    }
  });

  // 官方工作流配套文件生成器（依据 c2m frontend 新工作流开发指南 2.7 节清单）
  plop.setGenerator('official-workflow', {
    description: '创建官方工作流配套文件（manifest/定义/表单/面板）',
    prompts: [
      {
        type: 'input',
        name: 'id',
        message: '工作流 id（与路由 /workflow/official/:id 一致）:',
        validate: (input) => {
          if (!input) return '❌ id 不能为空';
          if (!/^[a-z][a-z0-9-_]*$/.test(input)) return '❌ id 需以小写字母开头，仅含小写字母/数字/-/_';
          return true;
        }
      },
      {
        type: 'confirm',
        name: 'needForm',
        message: '是否需要专属启动表单？',
        default: true
      },
      {
        type: 'confirm',
        name: 'needPanel',
        message: '是否需要专属结果面板？（共享结果面板可满足时选否）',
        default: false
      }
    ],
    actions: function (app) {
      const cfg = fs.existsSync(CONFIG_PATH) ? readConfig() : DEFAULT_CONFIG;
      const root = cfg.projectRoot;
      const pascalName = app.id.replace(/(^|[-_])([a-z0-9])/gi, (_, __, c) => c.toUpperCase());
      const actions = [
        {
          type: 'add',
          path: path.join(root, 'src/data/official-workflows/manifests/{{id}}.ts'),
          templateFile: 'templates/official-workflow/manifest.ts.hbs'
        },
        {
          type: 'add',
          path: path.join(root, 'src/pages/workflows/studio/official/definitions/{{id}}.ts'),
          templateFile: 'templates/official-workflow/definition.ts.hbs'
        }
      ];
      if (app.needForm) {
        actions.push({
          type: 'add',
          path: path.join(root, `src/pages/workflows/studio/official/forms/{{id}}/${pascalName}StartForm.vue`),
          templateFile: 'templates/official-workflow/StartForm.vue.hbs'
        });
      }
      if (app.needPanel) {
        actions.push({
          type: 'add',
          path: path.join(root, `src/pages/workflows/studio/official/panels/{{id}}/${pascalName}ResultPanel.vue`),
          templateFile: 'templates/official-workflow/ResultPanel.vue.hbs'
        });
      }
      // registry.ts 与 i18n 属于"修改已有文件"，打印人工操作清单
      console.log(`
📋 还需手动完成：
  1. definitions/registry.ts → 在 definitions 映射中以键 '${app.id}' 注册 runtime definition（manifest + launch + resultComponent）
  2. src/i18n/ → 添加 cockpit.workflow${pascalName}Name / cockpit.workflow${pascalName}Description 及节点、表单、状态文案
  3. 确认后端契约：workflow_type、启动/状态/继续执行接口、节点模板与图标映射`);
      return actions;
    }
  });
};
