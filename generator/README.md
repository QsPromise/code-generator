# 生成器约定

本目录是**固定槽位**：在 `main` 分支上保持为空（仅有本说明）；每个生成器分支把自己的生成器直接放进本目录：

```
generator/index.js        # 导出 default async function (plop)
generator/templates/      # 该生成器自己的模板
tests/<分支名>.test.mjs   # 该生成器的测试（各分支自管）
```

不同分支的 `generator/` 内容不同，分支名即生成器身份，不再需要子目录重复表达。

## 新增一个生成器

1. 基于 main 切分支：`git checkout main && git checkout -b <name>`
2. 新建 `generator/index.js`，默认导出 `async function (plop)`，在其中 `plop.setGenerator(...)`
3. 模板放入 `generator/templates/`
4. 共享能力从 `shared/` 导入，不要复制：
   - `shared/config.js` —— 配置读写（`hasConfig` / `readConfig` / `writeConfig` / `today`，按分支分区）
   - `shared/branch.js` —— 分支检测
   - `shared/apidoc.js` —— 接口文档解析与 API 代码生成辅助
5. 新建 `tests/<name>.test.mjs`，用 `process.env.CODEGEN_BRANCH = '<name>'` 模拟分支后测试
6. 提交到 `<name>` 分支

## 合流约定

- 共享代码只在 `main` 上修改，各生成器分支定期 `git merge main` 同步
- 生成器代码只在自己的分支上修改，**不回合** main（main 的 generator/ 永远为空）
- 生成器分支之间**不互相合并**（固定槽位意味着同名路径必然整体冲突）
