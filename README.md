<!--
 * @author qingshanscript
 * @create 2025-05-19 14:21 PM
 * @license MIT
 * @filePath \code-generator\README.md
 * @desc 分支驱动代码生成器
-->
# 代码生成器（分支驱动）

全局 CLI 代码生成器。**分支名即生成器名**：每个生成器生活在自己的同名分支上，main 分支只提供说明文档与共享代码，禁止运行 `npm run new`。

## 目录结构

```text
plopfile.js        # 瘦入口：分支门禁 + 动态加载 generator/<branch>/index.js
shared/            # 共享代码（只在 main 上修改）
  config.js        #   配置读写（.plop-config.json）
  branch.js        #   分支检测
  apidoc.js        #   接口文档解析与 API 代码生成辅助
generator/         # main 上为空（仅有 README.md 约定文档）
tests/             # main 只保留分支门禁测试
```

## 使用方式

```bash
git checkout <生成器分支>   # 如 react、official-workflow
npm install
npm run new                 # 只会出现当前分支对应的生成器
```

在 main 或其他无生成器的分支上运行会直接报错并列出可用分支。

## 生成器分支

| 分支 | 生成器 | 说明 |
| --- | --- | --- |
| `react` | `react` | 生成页面/公共组件/私有组件文件；支持 `-path` 临时路径模式（仅本次生效，不写配置） |
| `official-workflow` | `official-workflow` | 按 c2m frontend《新工作流开发指南》2.7 节清单生成官方工作流配套文件（manifest/定义/启动表单/参数表单/节点渲染器），支持提供 API 接口文档自动生成 `src/api/<id>.ts` 并接线 |

## 通用能力（shared）

- **首次初始化**：无 `.plop-config.json` 时引导配置并保存
- **每日首次确认**：每个自然日第一次使用提示是否沿用已保存路径
- **`-path` 临时路径**：`npm run new -- -path` 临时指定路径，不写配置
- **接口文档生成 API**：提供 JSON（OpenAPI `paths` 或 `{endpoints:[...]}`）自动产出接口调用

## 新增生成器

见 `generator/README.md`。要点：从 main 切同名分支 → 新建 `generator/<name>/index.js` → 共享能力从 `shared/` 导入，不复制。共享代码改动只在 main 上进行，各生成器分支定期 `git merge main`。

## 测试

```bash
node tests/branch.test.mjs   # main：分支门禁
# 各生成器分支上：node tests/<branch>.test.mjs
```
