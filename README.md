# OneBox

OneBox 是一个无构建依赖的静态 PWA，把常用工具放进一个可离线使用的盒子，适合直接部署到 GitHub Pages。

## 当前能力

- 计算器：括号、百分比、键盘操作、历史记录，以及 `sin/cos/tan/log/ln/sqrt/幂/阶乘/π/e` 等科学函数，支持度/弧度切换。
- 日历：公历、农历、干支生肖、二十四节气、法定节假日、补班、个人日程；带时间的日程会自动进入右上角提醒中心。
- 天气：Open-Meteo 开源数据；城市/区县搜索、多个天气卡片、长按或拖拽排序、实时天气、小时天气、未来 15 天和出行/运动/穿衣/防晒/爬山建议。
- 转换：长度、重量、面积、体积、速度、时间、数据和温度，支持交换单位和复制结果。
- 翻译：多个公共 LibreTranslate 开源实例自动容错，翻译记录可本地保存；公共实例不可用时会明确提示，不伪造结果。
- 设置：浅色、深色、跟随系统；中文、英文；日语/韩语入口已预留。
- 数据：主题、工具顺序、日程、天气卡片、翻译记录、提醒、导航、阅读书架/进度/笔记和已导入书籍文件都保存在当前设备；可选 GitHub 授权 + 私有 Gist 同步。
- 通知：右上角提醒中心；浏览器允许通知时使用 Service Worker 通知。Safari 主屏幕 Web App 可以申请通知权限，但真正的关闭页面后台推送仍需要服务端 Push/VAPID。

## 本地运行

```bash
python3 -m http.server 4173 -d dist
```

然后打开 <http://localhost:4173>。PWA 的 Service Worker、安装按钮、离线缓存和通知都需要 HTTP(S) 上下文，不能直接双击 `index.html`。

## GitHub 同步

GitHub Pages 是纯静态托管，OneBox 使用 GitHub Device Flow，不把 OAuth Client Secret 放进前端，也不要求用户填写 Client ID。点击“GitHub”后会打开 GitHub 设备授权页；用户登录并授权后，OneBox 会自动完成登录，并使用你的私有 Gist 保存设置、工具配置、导航、日程、天气卡片、翻译记录、通知、阅读书架/进度/笔记及本地导入的书籍文件。书籍二进制内容会拆分为多个 Gist 文件，访问令牌只保存在当前设备，退出 GitHub 会清除本地令牌。

跨设备同步由“上传到 GitHub”和“从 GitHub 恢复”两步完成：先在有最新数据的设备上传，再在另一台设备恢复。账户中有多个 OneBox Gist 时，会按 GitHub 最近更新时间选择备份；上传与恢复都会检查书籍附件是否完整，缺失时明确报错，不再提示成功但只恢复书架目录。

首页订阅内容、节假日和天气接口响应属于网络缓存，不参与同步；GitHub 登录令牌也不会上传到 Gist。

### 多登录方式与数据互通

登录服务商和 OneBox 数据身份需要分开：服务商只负责验证身份，数据应归属稳定的 OneBox 账号，再由不同同步适配器读写。登录弹窗使用 `ACCOUNT_LOGIN_PROVIDERS` 注册表，目前只启用 GitHub；添加其他登录方式时，不应把新的登录名直接当成另一份数据账户。

当前 GitHub 私有 Gist 备份仍与 GitHub 账号绑定，尚不能自动和未来的 Apple 或其他账号互通。要实现互通，需要后端提供稳定的 OneBox 账号 ID 和已验证的身份关联流程；用户关联账号后，再将现有 Gist/书籍数据迁移或合并到该 OneBox 账号。关联必须由用户明确确认，不能只凭相同邮箱或用户名自动合并。

## Cloudflare 云端账号与后台

`cloudflare/reader-sync/` 中的 Cloudflare Worker 负责 GitHub OAuth 会话、私有阅读文件同步和 OneBox 用户云端数据。D1 保存按 GitHub 数字 ID 隔离的用户数据、账号状态、权限、公告、模块开关、回收站和审计记录；R2 保存书籍及用户附件，不提供公开文件 URL。GitHub 令牌只用于向 GitHub 验证身份，不写入 D1 或 R2。Pages 继续托管静态前台、云端授权页和 `/admin/` 后台 PWA。

普通用户在 OneBox 前台连接 GitHub 后，打开 `/cloud-sync.html` 查看本机数据概况并明确勾选授权，才会把 OneBox 数据和附件迁移到云端。迁移完成后可在页面开启此设备的自动同步；本机和云端更改按更新时间合并。现有 GitHub Gist 不会自动导入，需先在前台恢复到本机，再进行迁移。后台用户列表只包含已连接云端的账号。

后台地址是 `/admin/`。超级管理员可按 GitHub 数字 ID 邀请管理员，并分配超级管理员、用户管理员、个人数据管理员、内容运营或只读审计角色。个人数据导出与删除权限可单独授权；查看、编辑、导出、删除和恢复等操作会写入审计记录。用户删除会进入 30 天回收站；到期后由 Worker 定时清除。后台导出为 ZIP，包含用户 JSON 与附件文件。模块开关隐藏模块入口并阻止直接访问，保留用户数据；广告按页面位置及起止时间发布，公告可发给全体或指定用户并记录已读状态。后台 PWA 离线时仅显示外壳，不缓存或展示个人数据。

**这套云端服务目前尚未部署，`dist/reader-sync-config.js` 的 Worker URL 仍为空。** 页面发布后，在 Worker 部署并配置好之前，云端同步和后台会显示未配置状态，不会上传本机内容。

### 部署 Cloudflare Worker

`wrangler.toml` 使用 `onebox-reader-sync` D1 数据库、`onebox-reader-books` R2 存储桶，并将 GitHub 数字 ID `9962337` 作为初始超级管理员。确认该 ID 对应预期管理员后，在已登录 Cloudflare 的终端执行：

```bash
npx wrangler login
npx wrangler d1 migrations apply onebox-reader-sync --remote --config cloudflare/reader-sync/wrangler.toml
npx wrangler deploy --config cloudflare/reader-sync/wrangler.toml
npx wrangler secret put SESSION_SECRET --config cloudflare/reader-sync/wrangler.toml
```

如果目标账号尚未有配置中的 D1 数据库或 R2 存储桶，先运行 `npx wrangler d1 create onebox-reader-sync` 与 `npx wrangler r2 bucket create onebox-reader-books`，并把新数据库的 `database_id` 写回 `wrangler.toml`。部署前要按顺序应用 `0001_reader_books.sql` 和 `0002_onebox_cloud_admin.sql`。`SESSION_SECRET` 使用随机长字符串。

Worker 部署后，将其 `workers.dev` URL 填入 `dist/reader-sync-config.js` 的 `ONEBOX_READER_SYNC_API`；`ONEBOX_CLOUD_API` 会自动沿用该地址。再发布 Pages，才能启用云端账号、迁移页和 `/admin/` 后台。书籍同步仍使用原有阅读 API；通用 OneBox 数据迁移需要用户在授权页明确同意后才启动。

## 发布前检查

1. `node --check dist/app.js`、`node --check dist/reader-cloud-sync.js`、`node --check dist/sw.js`、`node --check dist/calendar-data.js`、`node --check cloudflare/reader-sync/src/index.js`。
2. `node --test cloudflare/reader-sync/test/worker.test.js`，覆盖登录会话、用户隔离、进度冲突、文件校验和删除同步。
3. 检查计算器科学函数、日历农历/补班、日程提醒、天气搜索/小时/15 天、翻译失败态、主题/语言设置。
4. 用移动端视口检查顶部安全区颜色、双击按钮不放大、横向天气建议和工具长按排序。
5. 检查 Manifest、Service Worker、离线应用壳和无控制台错误。

仓库不需要 `npm install` 或构建步骤，GitHub Actions 直接发布 `dist/` 目录。

在 iPhone Safari 上，添加收藏时会使用页面声明的 canonical URL。站点会将 `/onebox/` 转到 `/onebox/index.html`，并把后者声明为 canonical；调整入口时须保持两者一致，并保留查询参数和片段，以免收藏回到旧地址或影响 GitHub 授权回跳和工具页链接。
