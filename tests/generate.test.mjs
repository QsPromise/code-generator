/**
 * 非交互功能测试：验证 react 生成器三种类型的文件生成路径
 */
import nodePlop from 'node-plop';
import { fileURLToPath } from 'url';

const plopfilePath = fileURLToPath(new URL('../plopfile.js', import.meta.url));
const plop = await nodePlop(plopfilePath);
const gen = plop.getGenerator('react');

const cases = [
  { type: 'page', name: 'TestPage' },
  { type: 'component', name: 'TestComp' },
  { type: 'pages_component', pageName: 'TestPage', name: 'TestInner' }
];

for (const answers of cases) {
  const result = await gen.runActions(answers);
  const changes = result.changes.map((c) => c.path);
  console.log(`✔ [${answers.type}]`, changes);
  if (result.failures.length) {
    console.error('✘ failures:', result.failures);
    process.exit(1);
  }
}
console.log('ALL PASS');
