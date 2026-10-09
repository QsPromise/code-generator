/**
 * @author :qingshanscript
 * @create :2025-05-19 14:30 PM
 * @license :MIT
 * @LastEditor :qingshanscript
 * @lastEditTime :2026-10-09
 * @filePath :\code-generator\plopfile.js
 * @desc :代码生成器入口，支持自定义输出路径、模板路径，每日首次使用确认路径
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

// 路径配置相关的提问（初始化与每日确认共用）
const pathPrompts = (config) => [
  {
    type: 'input',
    name: 'page',
    message: '页面文件输出路径（支持 {{name}}）:',
    default: config.paths.page
  },
  {
    type: 'input',
    name: 'component',
    message: '公共组件输出路径（支持 {{name}}）:',
    default: config.paths.component
  },
  {
    type: 'input',
    name: 'pagesComponent',
    message: '私有组件输出路径（支持 {{pageName}} 与 {{name}}）:',
    default: config.paths.pagesComponent
  },
  {
    type: 'input',
    name: 'componentTemplate',
    message: '组件模板文件路径:',
    default: config.templates.component
  }
];

export default async function (plop) {
  const inquirer = (await import('inquirer')).default;

  // 首次使用：初始化配置
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log('🛠 首次使用，正在初始化配置...');
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectRoot',
        message: '默认项目根路径',
        default: DEFAULT_CONFIG.projectRoot
      },
      ...pathPrompts(DEFAULT_CONFIG)
    ]);
    const { componentTemplate, ...paths } = answers;
    writeConfig({
      projectRoot: answers.projectRoot,
      paths: {
        page: paths.page,
        component: paths.component,
        pagesComponent: paths.pagesComponent
      },
      templates: { component: componentTemplate },
      lastConfirmDate: today()
    });
    console.log('✅ 配置已初始化');
  }

  const config = readConfig();

  // 每个自然日第一次使用：提示确认已保存的路径
  if (config.lastConfirmDate !== today()) {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: '今日首次使用，是否沿用已保存的路径配置？',
        default: true
      }
    ]);
    if (!confirmed) {
      const answers = await inquirer.prompt(pathPrompts(config));
      const { componentTemplate, ...paths } = answers;
      config.paths = {
        page: paths.page,
        component: paths.component,
        pagesComponent: paths.pagesComponent
      };
      config.templates.component = componentTemplate;
    }
    config.lastConfirmDate = today();
    writeConfig(config);
    console.log('✅ 路径配置已确认并保存');
  }

  // 创建一个生成器
  plop.setGenerator('react', {
    description: '创建一个新的 React 模板',
    prompts: [
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
      const pathMap = {
        page: config.paths.page,
        component: config.paths.component,
        pages_component: config.paths.pagesComponent
      };
      return [
        {
          type: 'add', // 添加文件
          path: path.join(config.projectRoot, pathMap[app.type]),
          templateFile: config.templates.component
        }
      ];
    }
  });
};
