# 电研工作台

面向电力系统科研人员的单用户私有工作台。项目、论文、专利、成长计划、任务和晋升证据使用同一个 SQLite 数据库，并支持私有附件、BibTeX 导入及完整备份。

## 功能

- 行动优先的科研驾驶舱：逾期、近期节点、项目风险、科研管线与晋升缺口。
- 项目、论文、专利和成长记录的完整增删改查、筛选、归档与详情页。
- 跨模块任务、里程碑、附件和研究成果关联。
- 可配置晋升周期、自动计数指标、必达项和加权完成度。
- BibTeX 预览、重复识别、跳过或合并导入。
- 单管理员安全会话、登录限速、CSRF/来源校验和强制初始密码修改。
- 版本化 ZIP 备份，包含数据、附件、清单与 SHA-256 校验值。

## 本地开发

需要 Node.js 22。

```powershell
Copy-Item .env.example .env.local
```

将 `.env.local` 中的路径改为本机路径，例如：

```dotenv
DATABASE_PATH=./data/workbench.db
UPLOAD_DIR=./data/uploads
EXPORT_DIR=./data/exports
ADMIN_EMAIL=you@example.com
ADMIN_INITIAL_PASSWORD=至少十二位的随机初始密码
COOKIE_SECURE=false
TRUSTED_ORIGIN=http://localhost:3000
```

随后运行：

```powershell
npm install
npm run dev
```

首次访问前，应用会自动执行版本化迁移，并使用环境变量创建唯一管理员。首次登录后应立即在“系统设置”中修改密码，然后从环境文件删除 `ADMIN_INITIAL_PASSWORD`。

## Docker 部署

1. 复制 `.env.example` 为 `.env`，设置真实邮箱、随机初始密码及公网 `TRUSTED_ORIGIN`。
2. 保持容器内数据路径为 `/data/...`。
3. 构建并启动：

```bash
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:3100/api/health
```

服务仅监听 VPS 的 `127.0.0.1:3100`。请使用现有 Nginx 或 Caddy 将独立子域名反向代理到该端口，并启用 HTTPS。

## Nginx 示例

```nginx
server {
    listen 443 ssl http2;
    server_name research.example.com;

    client_max_body_size 110m;
    proxy_read_timeout 120s;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

## Caddy 示例

```caddy
research.example.com {
    request_body {
        max_size 110MB
    }
    reverse_proxy 127.0.0.1:3100
}
```

## 备份与恢复

- 在“系统设置 → 数据备份”下载完整 ZIP。
- ZIP 内含 `data.json`、`manifest.json` 和 `attachments/`，清单记录每个文件的 SHA-256。
- 网页恢复只允许在业务表为空的新实例中执行。迁移到新服务器时，先启动空实例并创建管理员，再上传备份。
- `data/` 是唯一必须持久化的目录；仍建议在 VPS 层面对该目录做定期快照。

## 升级

1. 先从网页下载完整备份，并对 `data/` 创建服务器快照。
2. 拉取新版本并执行 `docker compose up -d --build`。
3. 应用首次连接数据库时按顺序应用未执行的迁移。
4. 检查 `/api/health`、登录、首页统计和附件下载。

已执行的 `drizzle/*.sql` 文件不可修改；表结构变化必须追加新的迁移。

## 验证

```bash
npm run typecheck
npm test
npm run build
```

示例数据不会自动写入。如需在非生产环境测试：

```bash
ALLOW_SAMPLE_DATA=true npm run db:seed
```

所有示例记录均带有“示例”字样，不代表真实科研成果。
