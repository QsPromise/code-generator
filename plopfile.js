/**
 * @author :qingshanscript
 * @create :2025-05-19 14:30 PM
 * @license :MIT
 * @LastEditor :qingshanscript
 * @lastEditTime :2025-05-21 15:30 PM
 * @filePath :\code-generator\plopfile.js
 * @desc :
 */
// import myCache from './cache.js';
const getEmptyProps = (obj)=> {
  return Object.keys(obj).find(key => obj[key] === "");
}
export default function (plop) {
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
      // const value = myCache.get('key');
// console.log('value=>',value);
      // const err = getEmptyProps(app);
      // if (err){
      //   const { message } = config.prompts.find(item => item.name === err);
      //   throw new Error(`❌ ${message.endsWith(':') ? message.slice(0, -1) : message}`);
      // }
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
};