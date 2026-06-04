#!/bin/bash
# ============================================================
# GlobeTimeZone 服务器配置备份脚本
# 用途: 每日备份 Nginx 配置、SSL 证书等
# 位置: /opt/scripts/backup-config.sh
# Cron:  0 3 * * * /opt/scripts/backup-config.sh
# ============================================================

set -euo pipefail

# ==================== 配置变量 ====================
BACKUP_BASE="/backups/globetimezone"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/globetimezone-backup.log"
HOSTNAME=$(hostname)

# ==================== 颜色输出 ====================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ==================== 创建备份目录 ====================
BACKUP_DIR="${BACKUP_BASE}/${DATE}"
mkdir -p "${BACKUP_DIR}"
mkdir -p "$(dirname "${LOG_FILE}")"

log "开始备份 - 目标目录: ${BACKUP_DIR}"

# ==================== 1. Nginx 配置备份 ====================
if [ -d "/etc/nginx" ]; then
    log "备份 Nginx 配置..."
    cp -r /etc/nginx "${BACKUP_DIR}/nginx-config"
    echo "Nginx 配置文件数量: $(find /etc/nginx -type f | wc -l)" >> "${BACKUP_DIR}/backup-meta.txt"
else
    warn "Nginx 配置目录不存在，跳过"
fi

# ==================== 2. SSL 证书备份 ====================
if [ -d "/etc/letsencrypt" ]; then
    log "备份 SSL 证书..."
    cp -r /etc/letsencrypt/live "${BACKUP_DIR}/ssl-certs" 2>/dev/null || warn "SSL live 目录不存在"
    cp -r /etc/letsencrypt/renewal "${BACKUP_DIR}/ssl-renewal" 2>/dev/null || warn "SSL renewal 目录不存在"
fi

# ==================== 3. 系统信息快照 ====================
log "记录系统信息..."
{
    echo "=== 备份时间: $(date) ==="
    echo "主机名: ${HOSTNAME}"
    echo ""
    echo "=== 磁盘使用 ==="
    df -h /
    echo ""
    echo "=== 内存使用 ==="
    free -m
    echo ""
    echo "=== Nginx 状态 ==="
    systemctl status nginx --no-pager 2>/dev/null || echo "Nginx 状态不可用"
    echo ""
    echo "=== 运行进程 ==="
    ps aux --sort=-%mem | head -15
} > "${BACKUP_DIR}/system-info.txt"

# ==================== 4. 网站文件备份（如果部署在本机） ====================
WEB_ROOT="/var/www/globetimezone"
if [ -d "${WEB_ROOT}" ]; then
    log "备份网站文件（排除 node_modules）..."
    tar -czf "${BACKUP_DIR}/webroot.tar.gz" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        -C "$(dirname "${WEB_ROOT}")" \
        "$(basename "${WEB_ROOT}")" 2>/dev/null || warn "网站文件备份失败"
fi

# ==================== 5. Crontab 备份 ====================
log "备份 Crontab..."
crontab -l > "${BACKUP_DIR}/crontab.txt" 2>/dev/null || warn "无 crontab 配置"

# ==================== 6. 打包压缩 ====================
log "压缩备份..."
ARCHIVE="${BACKUP_BASE}/globetimezone-backup-${DATE}.tar.gz"
tar -czf "${ARCHIVE}" -C "$(dirname "${BACKUP_DIR}")" "$(basename "${BACKUP_DIR}")"

# 计算大小
ARCHIVE_SIZE=$(du -h "${ARCHIVE}" | cut -f1)
log "备份完成: ${ARCHIVE} (${ARCHIVE_SIZE})"

# ==================== 7. 上传到远程存储（可选） ====================
# S3 上传示例（需要先配置 awscli）:
# if command -v aws &>/dev/null; then
#     aws s3 cp "${ARCHIVE}" "s3://globetimezone-backups/configs/globetimezone-backup-${DATE}.tar.gz"
#     log "已上传到 S3"
# fi

# Cloudflare R2 上传示例（需要先配置 rclone）:
# if command -v rclone &>/dev/null; then
#     rclone copy "${ARCHIVE}" "r2:globetimezone-backups/configs/"
#     log "已上传到 R2"
# fi

# ==================== 8. 清理旧备份 ====================
log "清理 ${RETENTION_DAYS} 天前的备份..."
find "${BACKUP_BASE}" -name "globetimezone-backup-*.tar.gz" -mtime +${RETENTION_DAYS} -delete 2>/dev/null
find "${BACKUP_BASE}" -type d -name "202*" -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null

# 清理临时目录
rm -rf "${BACKUP_DIR}"

log "备份流程完成! (保留 ${RETENTION_DAYS} 天)"
echo "---" >> "${LOG_FILE}"

exit 0
