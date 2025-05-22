/**
 * @author :qingshanscript
 * @create :2025-05-19 14:30 PM
 * @license :MIT
 * @LastEditor :qingshanscript
 * @lastEditTime :2025-05-22 09:44 AM
 * @filePath :\code-generator\plopfile.js
 * @desc :
 */

import fs from 'fs';
import path from 'path';
const CONFIG_PATH = path.join(process.cwd(), '.plop-config.json');

// 隐藏的初始化生成器（不显示在交互菜单）
const initGenerator = {
  name: '!!init!!', // 特殊前缀隐藏生成器
  description: 'Hidden initializer',
  prompts: [
    {
      type: 'input',
      name: 'projectRoot',
      message: '默认项目根路径',
      default: process.cwd()
    },
    // {
    //   type: 'list',
    //   name: 'projectType',
    //   message: '项目类型',
    //   choices: [
    //     { name: 'vue', value: 'vue' },
    //     { name: 'react', value: 'react' },
    //     { name: '小程序', value: 'weapp' }
    //   ],
    //   default: "vue"
    // },
    // {
    //   type: 'list',
    //   name: 'projectStyle',
    //   message: '样式预处理器',
    //   choices: [
    //     { name: '无需预处理器', value: 'css' },
    //     { name: 'SCSS/SASS', value: 'scss' },
    //     { name: 'LESS', value: 'less' },
    //     { name: 'Stylus', value: 'stylus' }
    //   ],
    //   default: "css",
    //   when: (answers) => answers.projectType === 'vue' // 只有当选择了VUE时才显示
    // },
  ],
  actions: (answers) => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(answers, null, 2));
    console.log('✅ 配置已初始化');
    return [];
  }
};

export default async function (plop) {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.log('🛠 首次使用，正在初始化配置...');
    const inquirer = (await import('inquirer')).default;
    const answers = await inquirer.prompt(initGenerator.prompts);
    initGenerator.actions(answers); // 关键点：以编程方式执行
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
        when: (answers) => answers.type === 'pages_component' // 只有当选择了高阶组件时才显示
      },
      {
        type: 'input',
        name: 'name',
        message: (answers)=>{
          if (answers.type === 'pages_component') return '请输入该私有组件名称'
          if (answers.type === 'component')return '请输入组件名称'
          return '请输入页面名称'
        },
        validate: (input) => {
          if (!input) {
            return '❌ 名称不能为空'; // 返回错误信息
          }
          return true; // 验证通过
        }
      },

    ],    // 用户交互提示
    actions: function (app) {
      const config = plop.getGenerator('react');
      if (app.type==='components') return [
        {
          type: 'add',  // 添加文件
          path: 'src/components/{{name}}/{{name}}.js',
          templateFile: 'templates/component.hbs',
          data: { description: app.description ?? config.description }
        },
      ]
      if (app.type==='page') return [
        {
          type: 'add',  // 添加文件
          path: 'src/page/{{moduleName}}/{{name}}/index.js',
          templateFile: 'templates/component.hbs',
          data: { description: app.description ?? config.description }
        },
      ]
      // const path = app.type==='page' ? 'page' : 'components'
      console.log('app=>',app);
      return [
        {
          type: 'add',  // 添加文件
          path: 'src/{{moduleName}}/{{pageName}}/components/{{name}}.js',
          templateFile: 'templates/component.hbs',
        },
      ]
    }  // 执行的操作
  });
  const cleanUp = () => {
    try {
      fs.unlink(TEMP_CONFIG);
    } catch { }
  };

  process.on('beforeExit', cleanUp);
  process.on('SIGINT', cleanUp);
  process.on('uncaughtException', cleanUp);
};