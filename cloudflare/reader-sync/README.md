# 部署 OneBox 云端 Worker（macOS）

这个 Worker 用 D1 保存账号与结构化数据，用 R2 保存卡包图片。书籍正文和封面保存在用户自己的 GitHub Gist，不会写入 Cloudflare。

## 第一次部署

### 1. 创建卡包图片 bucket

在 Cloudflare Dashboard 打开 **R2 Object Storage → Create bucket**，名称填写：

```text
onebox-user-files
```

这个 bucket 只用于卡包原图，不存书籍。

### 2. 安装 Wrangler 并登录

在 Mac 打开「终端」，切换到项目目录：

```bash
cd /你的路径/onebox/cloudflare/reader-sync
```

如果还没有 Node.js，先从 <https://nodejs.org/> 安装 LTS 版本。然后运行：

```bash
npx wrangler login
npx wrangler whoami
```

浏览器会打开 Cloudflare 授权页面；完成后，`whoami` 应显示你的 Cloudflare 账号。

### 3. 设置 Worker 签名密钥

在终端生成随机密钥：

```bash
openssl rand -hex 32
```

复制终端输出，再运行：

```bash
npx wrangler secret put SESSION_SECRET
```

终端提示输入时粘贴刚才生成的内容。这个密钥只保存在 Cloudflare Worker Secrets，不要发到聊天、代码仓库或网页配置中。

### 4. 应用 D1 数据库迁移

此项目的 Wrangler 配置已经填写 D1 数据库名称和 ID。运行：

```bash
npx wrangler d1 migrations apply onebox-reader-sync --remote
```

确认提示后等待命令完成。项目若提示找不到数据库，先检查 Cloudflare Dashboard 中当前账号是否有配置里的 D1 数据库。

### 5. 部署

保持终端在 `cloudflare/reader-sync/` 目录，运行：

```bash
npx wrangler deploy
```

成功后终端会显示 Worker URL，形如：

```text
https://onebox.<你的-workers.dev-子域>.workers.dev
```

打开下面的地址，页面应显示 `ok: true`：

```text
https://onebox.<你的-workers.dev-子域>.workers.dev/healthz
```

### 6. 填入前端 Worker URL

在仓库文件 `dist/reader-sync-config.js` 中，把空字符串替换为终端显示的完整 Worker URL：

```js
window.ONEBOX_READER_SYNC_API = window.ONEBOX_READER_SYNC_API || 'https://onebox.<你的-workers.dev-子域>.workers.dev';
window.ONEBOX_CLOUD_API = window.ONEBOX_CLOUD_API || window.ONEBOX_READER_SYNC_API;
```

不要把 `/healthz` 加到 URL 末尾。提交并发布前端后，`/admin/`、云端迁移页和前台同步都会访问这个 Worker。

## Cloudflare Git Builds 配置

如果通过 Cloudflare Dashboard 连接 GitHub 自动部署 Worker：

- Worker 名称：`onebox`
- Root directory：`cloudflare/reader-sync`
- Deploy command：`npx wrangler deploy`
- 先在 Worker 的 **Settings → Variables and Secrets** 中新增 Secret：`SESSION_SECRET`
- 确认 D1 binding `DB` 和 R2 binding `USER_FILES_BUCKET` 与 `wrangler.toml` 一致

Cloudflare Git Builds 不一定会自动应用新的 D1 migrations。第一次部署或新增 migration 时，先在终端执行上面的 `npx wrangler d1 migrations apply onebox-reader-sync --remote`。

## 账号与后台

Worker 会使用 GitHub OAuth access token 查询当前 GitHub 用户，只把 GitHub 用户 ID、登录名和 OneBox 数据写入 D1。前端令牌不进入 D1。配置中的 `BOOTSTRAP_SUPERADMIN_GITHUB_IDS` 当前是 `9962337`；该 GitHub 账号第一次登录 `/admin/` 后成为超级管理员。超级管理员可按角色邀请其他管理员。

如果部署时报 R2 bucket 不存在，回到第一步检查 bucket 拼写必须是 `onebox-user-files`。这里不再创建或绑定 `onebox-reader-books`。
