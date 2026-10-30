# AGENTS.md — b64file 英文站（b64file.com）

## 项目是什么

中文站 `../b64file` 的英文对应站，面向 Google 检索。独立仓库、独立部署（Vercel），**不要**跟中文站共用一次提交。

## 技术栈与构建

```bash
pnpm build   # tsc && vite build
pnpm test    # 95 个测试，必须全绿
```

- Vite + TypeScript，30 个页面，`page-registry.json` 驱动
- 主题存储 key 是 `b64file-theme`（曾经有 `b64theme` 的旧值散布在 29 个 `index.html` 里，导致换主题闪一下；别再改回去）

## 当前视觉状态（重要）

**首页是旧版样式，不是瑞士版。** 2026-10-30 曾上线过瑞士版首页（commit `5ba0717`），当天按用户要求 revert（`0cd42dc`）回到旧版，瑞士版全站改造未做。

- `src/home-swiss.css` 已随 revert 删除，不要在没被要求时重新引入
- 中文站已经是瑞士版全站，两站**视觉不一致是有意为之**，等用户明确要求再铺

## 不能动的东西

- `tests/tool-dom.test.ts` 的 3 个 `.mode-tab`、`to-file` 的 `tabIndex === 0` 断言
- `NO_EN_COUNTERPART`：中文站 4 个长尾页（base64-to-word-garbled / jwt-expiry / data-url-too-long / wechat-miniprogram-base64）在英文站没有对应页，**不能输出 hreflang alternate**
- `public/` 里的 IndexNow key（32 位 hex）与验证文件

## 部署

```bash
npx vercel --prod --yes
```

- 生产域 `b64file.com`，Vercel 项目已关联仓库
- 部署后核对：`curl -s https://b64file.com/ | grep -c "sw-"`（现在应为 0）
- **生产部署需用户确认**

## Git

- 分支 `main`，远端 `github.com/rie2899/b64fileen`（public）
