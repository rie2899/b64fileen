# 交接说明（英文站 · b64file English）

> 项目路径 `/mnt/d/base64en`（Windows 侧 `D:\base64en`），源码独立仓库，与中文站 `D:\b64file` 完全分开。
> 中文站照旧跑百度，这个站面向 Google / Bing，两站关键词池不重叠、互不打架。

## 一句话现状

**代码全部做完，91 项测试通过、构建通过、22 个页面都在 dist 里。**
**只差两样：域名 + 部署。** 这两样都是你说的"硬配置"部分。

## 你已经拥有的东西

- **完整的站**：首页 + 19 个工具/指南页 + 关于/隐私/条款 + 404，共 22 个页面
- **每页独立 TDK**、canonical、JSON-LD（WebApplication / Article / FAQPage）、OG 标签
- **zh↔en 的 hreflang 三件套**（en / zh-CN / x-default）已和 b64file.cn 配对
- **英文版社交分享图**（1200×630，重做的，不是中文那张）
- **sitemap.xml / robots.txt / llms.txt** 构建时自动生成
- **IndexNow key 文件**已生成（`public/19121240a604f0228657ba90eebbac08.txt`），必应即时收录开箱可用
- **91 项自动化测试**（含内链图不变量、每页 TDK、aria-label、IndexNow key 校验）
- **部署配置** `vercel.json`（含 www→apex 重定向、静态资源长缓存、安全响应头）
- **文档**：`README.md`、`docs/DEPLOY.md`（部署 + GSC + IndexNow + GA4 全流程）、`docs/KEYWORD-MAP.md`（页面关键词地图 + 下一批候选页）

## 你要做的（就这两件）

### 1. 域名
给一个**自有 .com**（不要用 it.com 那种子域、也不要把 b64file.cn 指到海外）。
拿到后告诉我域名，我改 `site.config.json` 的 `siteUrl`（一处改动，全站生效）。

### 2. 部署
Vercel 或 Cloudflare Pages 都行，静态站，免费额度绰绰有余：
- 构建命令 `pnpm build`，产物目录 `dist`
- `vercel.json` 里的 `REPLACE-WITH-DOMAIN.com` 要换成真实域名（我可以代改）
- 你部署完告我一声，我做上线自检（canonical / hreflang / sitemap / 重定向）

### 可选（有账号权限我就能接手）
- **Google Search Console**：验证域名属性 + 提交 sitemap + 申请首页收录
- **Bing Webmaster + IndexNow**：一条命令 `bash scripts/indexnow.sh`
- **GA4**：建资源拿 `G-XXXXXXX`，填进配置
- **AdSense**（跑起来有量之后再说）

## 唯一需要改配置的文件

`site.config.json`：

| 字段 | 含义 | 现在 |
| --- | --- | --- |
| `siteUrl` | 上线域名，决定 canonical / OG / sitemap / hreflang | `https://REPLACE-WITH-DOMAIN.com` |
| `brand` | 品牌名（页头、页脚、结构化数据） | `b64file` |
| `feedbackEmail` | 页脚和条款页的联系邮箱 | `greedy2899@gmail.com` |
| `ga4Id` | GA4 测量 ID，留空=完全不采集 | 空 |
| `zhSiteUrl` | 中文站域名，用于 hreflang 配对 | `https://b64file.cn` |

**域名、品牌名都只在这一处改**，没有别的地方硬编码。

## 纪律（和中文站不同，别照搬）

- **不备案、不上国内服务器、不挂百度统计**——这是出海站，境内合规那套在这里是反向的成本
- **页面 URL 定下就不要再改**（SEO 资产），改标题/描述可以，改路径等于从零开始
- **不在同一语言里建两个抢同一个词的页面**（中文站那边已经吃过一次自相残杀的教训）
- **每页的 `updated` 日期**在 `page-registry.json` 里手改，别用构建日期——每次构建都刷新 lastmod 会被搜索引擎忽略
- **内链是环状**：每页出链 ≤5、入链恰好 5，有测试守着，加页时别破坏
- **hreflang 必须和中文站配对**：任一侧 URL 变了，两边都要改

## 加新页的流程（我或你都一样）

1. `page-registry.json` 加一条（id / path / html / input / priority / updated）
2. 建目录 + 复制一份 `index.html` 壳（改 `data-page`）
3. `src/static-pages.ts` 的 `pageData` 加这页文案，并加进 `PAGE_GROUP` / `SHORT_LABEL`
4. `pnpm test`（91 项 + 新页一致性检查）→ `pnpm build`
5. 部署 → `bash scripts/indexnow.sh https://域名/新路径/`

## 成本

本地开发、构建、部署、IndexNow 全部 **$0**。GA4 免费。除域名年费（¥60-80）外没有固定支出。
