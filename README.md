<!--
 * @author qingshanscript
 * @create 2025-05-19 14:21 PM
 * @license MIT
 * @LastEditor qingshanscript
 * @lastEditTime 2025-05-21 14:43 PM
 * @filePath \code-generator\README.md
 * @desc
-->
# 代码生成器
## 预期功能
1. 在当前目录下生成代码文件。-- ✅已实现
2. 可以自己配置模板文件。-- ✅已实现（`.plop-config.json` 中的 `templates` 字段）
3. 可以指定路径。-- ✅已实现（`.plop-config.json` 中的 `paths` 字段，支持 `{{name}}` / `{{pageName}}` 变量）
4. 可以保存用户指定的路径，避免多次输入。-- ✅已实现（路径保存于 `.plop-config.json`）
5. 每个自然日内第一次使用提示用户确认路径。-- ✅已实现（依据 `lastConfirmDate` 字段判断）

## 基础实现
1. 创建一个项目，并添加一个plop依赖。-- ✅已实现
2. 创建一个交互式命令窗口。-- ✅已实现（`npm run new` 启动交互式生成）

## 使用方式
1. `npm install`
2. `npm run new` —— 首次运行会引导初始化配置（项目根路径、各类文件输出路径、模板路径）
3. 之后每个自然日首次运行会提示是否沿用已保存的路径配置，选择「否」可重新设置并保存
4. `npm run new -- -path` —— 临时指定四个路径，仅本次生效，不写入配置

## 生成器
| 生成器 | 说明 |
| --- | --- |
| `react` | 生成页面/公共组件/私有组件文件 |
| `official-workflow` | 按 c2m frontend《新工作流开发指南》2.7 节清单生成官方工作流配套文件：目录 manifest、运行定义、可选启动表单与结果面板；生成后按提示手动注册 registry 与 i18n |

示例产物见 `tests-result/abc-demo/`（以 id `abc` 生成）。