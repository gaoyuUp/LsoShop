# 灵搜小店

精选 AI 账号与订阅服务的数字商品小店。前台面向游客购买、订单查询与交付查看；后台管理商品、规格、库存、订单、邮件记录与站点设置。默认「模拟支付宝支付 + 未配置邮箱降级」，拿到资质后可在后台切换真实支付和邮件配置，无需改业务代码。

## 在线预览（本地）

- 前台：<http://localhost:3000>
- 后台：<http://localhost:3000/admin>
- 后台账号：`admin`，密码见 `.env.local` 中的 `ADMIN_PASSWORD`

## 功能

### 前台

- 极光玻璃风格首页：动态光晕、网格、颗粒、Logo 描边、商品悬浮/轨道动画
- 商品分类筛选：按后台分类切换「全部 / Muse AI / Plus成品」，带数量角标
- 商品卡片：3D 倾斜、主题色光晕、库存状态、价格与规格数量
- 商品详情：分类标识、规格选择、数量、收件邮箱、醒目购买警告、可折叠购买须知时间轴
- 游客下单：无需注册；下单后生成唯一 12 位查询口令，订单页清晰展示并可一键复制
- 支付宝（当前模拟）：二维码 + 倒计时 + 「模拟支付成功」；切换到真实支付宝后复用同一页面
- 自动发货：付款后从库存取交付内容，展示在订单页并提供逐份/全部复制
- 邮件留底：交付内容同步发送到买家邮箱，邮件内附带查单方式；未启用邮箱时只记录不发送，后台配置后立即生效
- 客服支持：后台可配置 QQ / 微信 / 邮箱 / Telegram；导航栏「客服」按钮点击下拉展示渠道，订单页底部也有「联系支持」弹窗
- 我的订单：本机订单保存、状态批量刷新；支持「订单号 + 查询口令」或「订单号 + 下单邮箱」跨设备查询
- 代理分销：`/r/:入口码`（代理推广码或价位码）展示代理客户价并归因，`/join` 邀请码开通、邮箱验证码登录；主站默认展示最高价，商品详情可输入优惠码即时调价
- 代理推广后台：概览、订单、排行榜、客户价、客户、提现、联系方式七个模块
- 邀请制代理：一码一账号，代理账号与管理员账号完全分离；普通前台不展示登录/注册入口
- 白天 / 夜间模式：像素日夜开关（可点击/拖动，带开关音效）+ 液体墨迹 View Transition 换肤
- 全站响应式，中文文案，i18n 字典已预留多语言扩展位

### 后台

- 独立登录页与 JWT 会话（HttpOnly Cookie，7 天，Proxy 保护 `/admin`）
- 侧栏可收起为图标模式，并用 Cookie 记住收起状态；整体字号偏大、两栏间距更紧凑
- 内容区自适应铺满、始终贴紧侧栏，宽屏下不再居中留白
- 总览：今日成交额/订单、待发货、可售库存、近 7 天成交、库存水位、最近订单
- 商品管理：新建、编辑、上下架、复制、删除（有订单时保护）、排序、主题色
- 分类管理：独立分类页，支持新建、改名、改 slug、排序、删除；每个商品必须选择分类
- 后台确认弹窗：删除、清空库存、取消/退款等统一使用 AlertDialog，不再是浏览器原生 confirm
- 后台路由切换：轻量淡入 + 轻微上浮 + 顶部扫光，不阻塞导航和接口请求
- 商品图：直接填写 URL 或上传图片，存放于 `storage/uploads`（随项目备份）
- 购买须知编辑：醒目警告（每行一条）+ 可增删排序的「标题 + 内容」条目
- 规格管理：每个商品独立规格，价格/划线价/限购/自动或人工发货/上下架
- 库存管理：按规格批量导入（`---` 分隔多份）、状态筛选、内容展开预览、删除可售库存、清空可售
- 订单管理：状态标签筛选、订单号/邮箱/商品搜索、分页
- 订单详情：手动确认收款、手动发货、编辑交付内容、重发邮件、取消/退款、管理备注
- 邮件记录：发送状态统计、收件人、对应订单、HTML 邮件实时预览
- 邮件服务：后台直接管理 SMTP，支持测试发信；授权码加密入库
- 站点设置：首页公告、四渠道客服联系方式、管理员密码修改、服务状态、备份命令
- 所有后台页面与操作均有服务端鉴权

## 技术栈

- Next.js 16（App Router / Turbopack / Server Actions / Proxy）
- React 19 + TypeScript + Tailwind CSS 4
- shadcn/ui（Radix UI）后台组件；Motion 前台动效
- Drizzle ORM + MySQL 8（全链路 UTC 存储，北京时间展示）
- Nodemailer（SMTP）、qrcode、jose、bcryptjs、Zod

## 目录结构

```
src/
  app/
    (shop)/            前台布局：首页、products/[slug]、订单列表、订单详情
    (agent-shop)/r/    代理专属价店铺与代理商品详情
    (agent)/promote/   代理推广后台（登录后）
    (admin)/admin/     后台页面（登录页在 app/admin/login）
    join/              邀请码开通 / 代理邮箱验证码登录
    api/               下单、查单、归因、代理上传与导出、支付回调
    robots.ts          搜索引擎抓取规则
    sitemap.ts         动态商品 sitemap
  components/
    site/              前台组件（Hero、商品卡、结账、订单、须知…）
    agent/             代理后台壳、推广卡片、二维码上传
    join/              代理开通/登录表单
    admin/             后台组件（Shell、商品表单、库存导入、徽章…）
    ui/                shadcn/ui 基础组件
  db/                  Drizzle 连接与 schema
  lib/
    actions/           后台 Server Actions（鉴权在每个 action 内复核）
    auth/              后台会话与登录校验
    admin-data.ts      后台查询
    orders.ts          下单、锁库存、支付、发货、查单核心逻辑
    payment/           支付渠道抽象（mock / alipay 占位）
    mail/              SMTP 发信 + 邮件 HTML 模板
  i18n/                中文字典与语言注册（预留多语言）
  lib/seo.ts           站点 URL、canonical、JSON-LD 与 OG 配置
public/
  logo.png             品牌 Logo（Organization 结构化数据）
  og-image.png         1200×630 社交分享图
  products/            初始商品图
scripts/               迁移、种子、数据库导出
drizzle/               迁移 SQL 与快照
storage/uploads/       后台上传图片（运行时生成）
```

## 本地开发

要求：Node.js >= 20、pnpm 10、MySQL 8。

```bash
pnpm install

# 1. 准备环境变量
cp .env.example .env.local
# 修改 DATABASE_URL、ADMIN_PASSWORD、AUTH_SECRET

# 2. 建库 + 迁移 + 种子数据（自动创建数据库）
pnpm db:setup

# 3. 启动
pnpm dev
```

默认地址 <http://localhost:3000>。种子会创建 3 个商品（Muse AI、Muse AI Token、GPT Plus 成品号）、对应规格与演示库存，并创建管理员账号。

### 常用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 本地开发 |
| `pnpm build` / `pnpm start` | 生产构建 / 本地启动验证（线上请使用 standalone） |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm db:generate` | 修改 schema 后生成迁移 |
| `pnpm db:migrate` | 执行迁移（线上同样执行） |
| `pnpm db:seed` | 创建/更新管理员，空库时写入初始商品（可重复执行） |
| `pnpm db:export` | 导出完整数据库到 `backups/lsoshop-时间.sql` |
| `pnpm db:studio` | Drizzle Studio 可视化管理数据 |

## 代理系统（一期）

### 角色与入口

| 角色 | 入口 | 登录 |
|---|---|---|
| 普通客户 | `/` | 不需要账号，直接购买系统价 |
| 代理客户 | `/r/:代理码` 或 `/r/:价位码` | 不需要账号，展示代理客户价并归因 |
| 代理本人 | `/join` 开通 / 登录 | 邮箱验证码，进入 `/promote` |
| 管理员 | `/admin` | 管理员账号密码（独立 Cookie） |

普通前台、导航和订单页不展示登录注册；`/join`、`/promote`、`/r/*` 均为 `noindex`。

### 代理开通

1. 管理员在 **后台 → 代理** 创建邀请码，复制 `/join?invite=...` 开通链接。
2. 代理填写邀请码 + 邮箱，收验证码后开通；每个邀请码只能开通一个账号。
3. 验证码 10 分钟有效，60 秒重发间隔，单码最多尝试 5 次；邮件使用后台已配置的 SMTP。
4. 代理登录态存放在独立 `lso_affiliate` HttpOnly Cookie，与管理员 `lso_admin` 完全分离。

### 归因和价格

- 访问 `/r/:代理码` 或 `/r/:价位码`（可带 `?src=wechat`）进入代理店铺；店铺内链接保持当前入口码，刷新仍保留优惠。
- 主站未登录且没有优惠码时，按**划线原价**展示和成交；没有划线原价则按系统售价。商品详情可手动输入优惠码，服务端校验后即时显示代理价和节省金额。
- 已登录代理在主站可按自己的代理价购买（代理自购）。
- 新生成的价位码为 6 位，并与代理推广码全局去重；旧 8 位价位码继续兼容，已分享链接不会失效。
- 代理客户价按**商品规格**保存；未单独设置时回退代理主价，再回退系统价。
- 代理价边界：`当前系统售价 ≤ 代理客户价 ≤ 划线原价`（无划线原价则最高为系统售价）；不能低于管理员设置的代理成本价。
- 下单服务端重新校验当前提交的优惠码并计算价格，不信任客户端金额，也不读取历史归因 Cookie 定价；同时保存系统价、成本价、代理价、推广码、价位码和 `src` 快照。
- 代理自购（下单邮箱 = 代理邮箱，或登录代理使用自己的码）标记为 `self`，不返佣。
- 自动发货订单付款后结算佣金；人工发货订单发货后结算；退款/关闭撤销未提现佣金。
- 同一客户邮箱永久绑定首位代理；会员到期不会解除绑定。

### 代理后台

登录后进入 `/promote`：

- 概览：开张引导、佣金/客户统计、待打款、推广码/二维码、推广规则、推广效果趋势与分码统计
- 订单：客户单 / 自购单、时间筛选、CSV 导出、订单详情
- 排行榜：按动态商品筛选，销售额/单数，今日/本周/本月/全部
- 客户价：分类 + 规格级价格、价位码创建/启用/分享
- 客户：搜索、状态筛选、备注
- 提现：¥50 起（后台可调）、支付宝人工打款、单笔 pending 限制
- 联系方式：微信/二维码/QQ/Telegram，独立于平台客服

### 测试验证码收件箱

真实 SMTP 关闭时，代理验证码仍会写入 `affiliate_email_codes`。管理员可打开：

`http://localhost:3000/admin/dev/codes`

- 直接读取最新验证码，支持按邮箱筛选、复制、5 秒自动刷新
- 内置 2FA / 邮件正文解析器，粘贴文本即可提取 6 位验证码
- 生产环境默认 404；如确需在生产测试，显式设置 `ALLOW_TEST_CODE_INBOX=1`

### 代理数据表

`affiliates`、`affiliate_invites`、`affiliate_email_codes`、`price_codes`、`affiliate_pricing`、`affiliate_clicks`、`customer_bindings`、`commissions`、`withdrawals`；订单与商品规格增加推广/成本快照字段。迁移文件位于 `drizzle/`，执行 `pnpm db:migrate`。

## SEO 与收录

- 公开路由：`/`、`/products/[slug]`
- 旧商品地址 `/p/:slug` 永久跳转到 `/products/:slug`
- 私有路由（`/orders`、`/order/[orderNo]`、`/admin/*`、`/api/*`）全部 `noindex`，并同步发送 `X-Robots-Tag`
- 自动生成 `/sitemap.xml` 与 `/robots.txt`，sitemap 只包含首页和在售商品
- 首页、商品页输出 canonical、Open Graph、Twitter Card
- 输出 `Organization` / `WebSite` / `ItemList` / `Product` / `BreadcrumbList` JSON-LD
- `SITE_URL` 必须是正式 HTTPS 域名，线上才会允许搜索引擎收录

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | `mysql://用户:密码@127.0.0.1:3306/lsoshop` |
| `SITE_URL` | 站点地址，用于邮件链接和支付回调，线上填 `https://你的域名` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 首次 `db:seed` 时创建后台账号；改密码后重新 seed 会重置 |
| `AUTH_SECRET` | JWT 签名密钥，线上必须更换：`openssl rand -hex 32` |
| `PAYMENT_MODE` | `mock`（当前）/ `alipay`（拿到资质后） |
| `ORDER_EXPIRE_MINUTES` | 未支付订单超时时间，默认 15 分钟 |
| `MAIL_HOST` 等 | 邮件初始 / 兜底配置；更推荐在后台「设置 → 邮件服务」管理（优先级更高、密码加密） |
| `MAIL_FROM` | 发件人名称与地址 |
| `UPLOAD_DIR` | 商品图存储目录，默认 `./storage/uploads` |

## 支付与邮件接入

### 支付宝

当前 `PAYMENT_MODE=mock`，订单页展示二维码并提供「模拟支付成功」按钮，完整走通下单、发货、邮件与查询流程。

拿到支付宝当面付资质后：

1. 在 `.env.local` 配置 `PAYMENT_MODE=alipay`、`ALIPAY_APP_ID`、私钥/公钥；
2. 在 `src/lib/payment/index.ts` 的 `alipayProvider.createPayment` 中调用 `alipay.trade.precreate`，返回二维码内容；
3. 在 `src/app/api/payment/alipay/notify/route.ts` 中验签，确认 `TRADE_SUCCESS` / `TRADE_FINISHED` 与金额后调用 `markOrderPaid(out_trade_no, trade_no)`；
4. 返回纯文本 `success`。

订单、锁库存、自动/人工发货、邮件通知逻辑均已就绪，无需改动。

### 邮件

登录后台，进入「设置 → 邮件服务」，填写：

- SMTP 服务器（如 `smtp.qiye.aliyun.com`）
- 端口与加密方式（465 SSL，或 587 STARTTLS）
- 发件邮箱与授权码
- 发件人显示（可带品牌名）
- 勾选「启用真实发信」后保存

保存后立即生效，可直接在下方发送测试邮件。每封发货邮件都会在后台「邮件」页留底。授权码使用 AES-256-GCM 加密后写入数据库，导出 SQL 时不会出现明文。

首次部署也可以先用环境变量初始化，再执行 `pnpm db:seed`：

```env
MAIL_HOST=smtp.qiye.aliyun.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=你的邮箱
MAIL_PASSWORD=授权码
MAIL_FROM="灵搜小店 <你的邮箱>"
```

seed 只写入缺失的配置，不会覆盖后台已经保存的值。旧版 `SMTP_*` 变量仍兼容。未启用时状态为「未配置邮箱」，仅记录内容，买家仍可在订单页查看交付内容。

## 查询凭证与客服支持

### 订单查询口令

每笔订单创建时会生成一个唯一的 12 位查询口令（数据库只保存 SHA-256 哈希）。付款完成后，订单页会展示「订单查询凭证」，可以一键复制：

- 订单号 + 查询口令
- 订单号 + 下单邮箱

两种方式都可以在「我的订单」页查询同一笔订单；邮件交付内容里也附带了查单方式。

### 客服渠道

后台「设置 → 站点内容 → 联系支持」可以填写 QQ、微信、邮箱、Telegram，四项互相独立：

- 只显示已填写的渠道，未填写的不会出现
- 前台导航栏会显示「客服」按钮，点击后在按钮下方弹出渠道列表
- 订单详情页底部也会显示「联系支持」入口
- 点击后弹窗按 QQ / 微信 / 邮箱 / Telegram 顺序展示，并支持复制联系方式
- 邮箱支持直接唤起邮件客户端，Telegram 支持跳转 `t.me`

## 数据库备份与上线

### 导出 / 导入

```bash
pnpm db:export
# 生成 backups/lsoshop-YYYYMMDD-HHMMSS.sql

# 线上导入
mysql -u用户 -p 数据库名 < backups/lsoshop-20260101-120000.sql
```

商品图片位于 `storage/uploads`，请与 SQL 备份、`.env.local` 一起备份。

### 部署建议（Node 服务器）

```bash
pnpm install
pnpm db:migrate        # 线上建表 / 升级
pnpm build
pnpm start             # 或使用 PM2 / systemd 守护
```

`next.config.ts` 已开启 `output: "standalone"`，也可以只部署 `.next/standalone`：

```bash
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public
cp -r storage .next/standalone/storage
node .next/standalone/server.js
```

线上注意：

- `SITE_URL` 改为 https 域名；
- 更换 `AUTH_SECRET`；
- 确保 MySQL、`storage/uploads` 可写；
- 使用 Nginx/Caddy 反向代理并启用 HTTPS；
- 备份数据库与上传目录；
- 邮件配置随数据库迁移；如果线上更换了 `AUTH_SECRET`，需要在后台重新填写一次邮箱授权码（旧密文无法解密）。

## 已预留 / 后续迭代

- **客户账号**：当前采用游客购买 + 订单口令/邮箱查询，不建普通用户表；如后续需要跨设备账号体系，再单独设计登录与订单归属。
- **多语言**：`src/i18n/` 为字典注册模式，目前只有 `zh-CN`。新增语言时复制 `zh-CN.ts` 翻译，在 `index.ts` 注册 locale，并将 `I18nProvider` 的 locale 接入路由即可。
- **真实支付宝**：支付渠道抽象与异步通知路由已留好。
- **真实邮件**：后台配置 SMTP 即启用。

## 设计说明

前台使用「极光 + 玻璃 + 光晕 + 微交互」的视觉体系：背景持续漂移的极光、细网格与颗粒，商品卡 3D 倾斜和流光边框，商品图悬浮与轨道环，状态切换和支付倒计时的动效保持克制，保证信息可读。后台采用更安静的 shadcn 风格：固定侧栏、数据卡片、状态徽章，强调效率与清晰度。全站支持日夜模式与移动端。
