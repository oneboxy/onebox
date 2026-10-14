# OneBox

OneBox 是一个无构建依赖的静态 PWA，前端托管在 GitHub Pages。工具可离线使用；启用账号同步后，跨设备数据由 OneBox Cloudflare Worker 提供服务。

## 存储边界

| 数据 | 存储位置 |
| --- | --- |
| 设置、日历、天气、足迹、通知、书架信息与阅读进度 | Cloudflare D1 |
| 卡包原图 | Cloudflare R2 |
| 书籍正文和封面 | 用户自己的 GitHub 秘密 Gist |
| GitHub 访问令牌 | 当前设备；只经 HTTPS 发给 Worker 验证，不写入 D1 |

书架同步到 D1 时只包含元数据；前端与 Worker 都会剔除书籍正文和图片数据。书籍原文件和封面继续通过个人 Gist 同步。秘密 Gist 不是真正的私有存储，任何拿到链接的人都可能访问。Cloudflare 后台管理员可按分配的角色访问相应账号数据。

首次启用云端同步时，打开 `cloud-sync.html`，先在前台恢复旧 Gist 备份，再在页面确认迁移范围并授权迁移。自动同步需要在此设备单独开启；自定义同步选项决定要同步的数据模块。

## Cloudflare Worker 部署

Worker 项目在 `cloudflare/reader-sync/`，Wrangler 配置使用已有 D1 数据库，并将 R2 绑定用于卡包图片。书籍不会上传到 Cloudflare。

1. 在 Cloudflare R2 创建名为 `onebox-user-files` 的 bucket。
2. 在 `cloudflare/reader-sync/` 目录应用 D1 migrations，再部署 Worker。详细步骤见 [`cloudflare/reader-sync/README.md`](cloudflare/reader-sync/README.md)。
3. 为 Worker 设置 `SESSION_SECRET` 密钥，并确认 Workers.dev 地址已启用。
4. 将实际的 Workers.dev URL 写进 `dist/reader-sync-config.js` 的 `ONEBOX_READER_SYNC_API`。同一个 Worker URL 会供前台同步、迁移和 `/admin/` 管理后台使用。

管理员 GitHub 数字 ID 通过 `BOOTSTRAP_SUPERADMIN_GITHUB_IDS` 配置；当前配置值为 `9962337`。其他管理员由超级管理员在 `/admin/` 中邀请并分配角色。

## 本地运行

```bash
python3 -m http.server 4173 -d dist
```

然后打开 <http://localhost:4173>。PWA 的 Service Worker、安装按钮和离线缓存需要 HTTP(S) 上下文。

## 发布与同步注意事项

- 仓库不需要 `npm install` 或前端构建，GitHub Pages 直接发布 `dist/`。
- Cloudflare Worker 使用 `npx wrangler deploy`，不要使用没有入口参数的 `npx wrangler versions upload`。
- 部署 Worker 后，先访问其 `/healthz` 确认服务可用，再配置前端 URL。
- 从旧 Gist 迁移后，下一次 Gist 同步会把当前版本缩减为书籍文件清单与书籍文件，并移除当前版本中的旧卡包图片。GitHub Gist 的历史 revisions 无法通过 API 改写；如需清除旧 revisions 中的个人数据，需在 GitHub 删除旧 Gist 并重新创建。

在 iPhone Safari 上，添加收藏时会使用页面声明的 canonical URL。站点入口和授权回跳链接应保持一致，并保留查询参数和片段。
