# 部署说明

## 服务器准备

- Node.js 26.x
- pnpm 10.x
- 可访问的 MySQL 8

## 拉取代码

```bash
cd /www/wwwroot
sudo mkdir -p LsoShop
sudo chown -R ubuntu:ubuntu LsoShop
git clone https://github.com/gaoyuUp/LsoShop.git LsoShop
cd LsoShop
```

## 生产环境变量

复制模板并填写真实值：

```bash
cp deploy/env.production.example .env.production
chmod 600 .env.production
```

`.env.production` 已在 `.gitignore` 中屏蔽，不要提交真实数据库密码或密钥。

## 初始化

```bash
pnpm install
pnpm db:migrate
pnpm db:seed
mkdir -p storage/uploads
pnpm build
pnpm start
```

生产环境建议用 PM2 常驻，并在宝塔/Nginx 配置反向代理到 `127.0.0.1:3000`。
