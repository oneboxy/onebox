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

## 阅读内容自动同步（Cloudflare）

阅读模块的独立自动同步服务位于 `cloudflare/reader-sync/`：书籍原文件放进 Cloudflare R2 私有存储，书架信息、笔记和阅读进度放进 Cloudflare D1。文件不使用公开 URL；访问需要先用 OneBox 已有的 GitHub 登录令牌换取短期会话。Worker 只用该令牌向 GitHub 验证当前用户，不把它写入数据库或日志。不同 GitHub 用户的数据按用户 ID 隔离。

配置完成后，导入书籍、阅读进度保存、重新联网、重新打开页面和切回页面都会触发自动同步；离线时数据仍保存在本机，恢复网络后补传。书籍文件以 SHA-256 校验，重复同步不会重新上传未改变的文件。单本上限 64 MB，书架最多 80 本。在一台设备删除书籍后，删除也会同步到其他设备。手动 GitHub Gist 备份仍可继续使用。

**Worker 当前尚未部署，书籍尚未上传。** `dist/reader-sync-config.js` 默认留空，避免服务部署完成前发送书籍。启用 Cloudflare R2 并部署 Worker 后，把输出的 Worker URL 填入该文件，再发布 Pages，自动同步才会启用。

### 部署到你自己的 Cloudflare 账户

在有 Cloudflare 登录能力的终端执行：

```bash
npx wrangler login
npx wrangler r2 bucket create onebox-reader-books
npx wrangler d1 create onebox-reader-sync
```

把 D1 命令返回的 `database_id` 填入 `cloudflare/reader-sync/wrangler.toml`，再运行：

```bash
npx wrangler d1 migrations apply onebox-reader-sync --remote --config cloudflare/reader-sync/wrangler.toml
npx wrangler deploy --config cloudflare/reader-sync/wrangler.toml
npx wrangler secret put SESSION_SECRET --config cloudflare/reader-sync/wrangler.toml
```

`SESSION_SECRET` 应使用随机生成的长字符串。部署完成后，把 Wrangler 输出的 `workers.dev` 地址写入 `dist/reader-sync-config.js` 的 `ONEBOX_READER_SYNC_API`，提交并部署 GitHub Pages。服务启用前不执行书籍上传。

## 发布前检查

1. `node --check dist/app.js`、`node --check dist/reader-cloud-sync.js`、`node --check dist/sw.js`、`node --check dist/calendar-data.js`、`node --check cloudflare/reader-sync/src/index.js`。
2. `node --test cloudflare/reader-sync/test/worker.test.js`，覆盖登录会话、用户隔离、进度冲突、文件校验和删除同步。
3. 检查计算器科学函数、日历农历/补班、日程提醒、天气搜索/小时/15 天、翻译失败态、主题/语言设置。
4. 用移动端视口检查顶部安全区颜色、双击按钮不放大、横向天气建议和工具长按排序。
5. 检查 Manifest、Service Worker、离线应用壳和无控制台错误。

仓库不需要 `npm install` 或构建步骤，GitHub Actions 直接发布 `dist/` 目录。

在 iPhone Safari 上，添加收藏时会使用页面声明的 canonical URL。站点会将 `/onebox/` 转到 `/onebox/index.html`，并把后者声明为 canonical；调整入口时须保持两者一致，并保留查询参数和片段，以免收藏回到旧地址或影响 GitHub 授权回跳和工具页链接。
