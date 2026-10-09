# 生成器约定

本目录在 `main` 分支上**保持为空**（仅有本说明）。每个生成器生活在自己的同名分支上：

```
generator/<分支名>/index.js        # 导出 default async function (plop)
generator/<分支名>/templates/      # 该生成器自己的模板
tests/<分支名>.test.mjs            # 该生成器的测试（各分支自管）
```

## 新增一个生成器

1. 基于 main 切分支：`git checkout main && git checkout -b <name>`
2. 新建 `generator/<name>/index.js`，默认导出 `async function (plop)`，在其中 `plop.setGenerator(...)`
3. 模板放入 `generator/<name>/templates/`
4. 共享能力从 `shared/` 导入，不要复制：
   - `shared/config.js` —— 配置读写（`readConfig` / `writeConfig` / `DEFAULT_CONFIG` / `today`）
   - `shared/branch.js` —— 分支检测
   - `shared/apidoc.js` —— 接口文档解析与 API 代码生成辅助
5. 新建 `tests/<name>.test.mjs`，用 `process.env.CODEGEN_BRANCH = '<name>'` 模拟分支后测试
6. 提交到 `<name>` 分支

## 合流约定

- 共享代码只在 `main` 上修改，各生成器分支定期 `git merge main` 同步
- 生成器专属代码只在自己的分支上修改，**不回合** main（main 的 generator/ 永远为空）
