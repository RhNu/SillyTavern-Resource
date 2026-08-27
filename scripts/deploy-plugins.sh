#!/usr/bin/env bash
# ============================================================================
# deploy-plugins.sh — 在服务器上直接执行, 从 GitHub 同步 dist-plugins 到 SillyTavern plugins/ 目录。
#
# 原理:
#   1. git 浅克隆 (--depth 1) + sparse-checkout, 只下载 dist-plugins/ 目录, 不拉整个仓库
#   2. 逐插件覆盖同步到目标目录 (先删旧目录保证与发布一致)
#   3. 清理临时文件
#
# 用法:
#   bash deploy-plugins.sh [目标目录] [--branch <分支>]
#
#   目标目录: SillyTavern 的 plugins/ 目录
#    - 不传时默认 ./plugins (在 SillyTavern 根目录下运行)
#    - 示例: bash deploy-plugins.sh /opt/SillyTavern/plugins
#    - 示例: bash deploy-plugins.sh /opt/SillyTavern/plugins --branch dev
#
# 依赖:
#   - git >= 2.25 (服务器上一般自带; 老版本会自动退化为普通浅克隆)
#   - 仓库为公开仓库, 无需认证; 私有仓库请先配置 git 凭据或改用 gh:
#       gh repo clone RhNu/SillyTavern-Resource <tmp> -- --depth 1 --filter=blob:none --sparse
#
# 提示: 可先加 --dry-run 参数预览将部署的插件列表, 不实际写入。
# ============================================================================

set -euo pipefail

REPO="https://github.com/RhNu/SillyTavern-Resource.git"
BRANCH="main"
TARGET="./plugins"
DRY_RUN=0

log()  { printf '\033[1;36m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[deploy]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[deploy]\033[0m 错误: %s\n' "$*" >&2; exit 1; }

# 参数解析: [目标目录] [--branch <分支>] [--dry-run]
while [ $# -gt 0 ]; do
  case "$1" in
    --branch)
      [ $# -ge 2 ] || die "--branch 需要一个分支名"
      BRANCH="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h | --help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    -*)
      die "未知参数: $1 (支持: [目标目录] [--branch <分支>] [--dry-run])"
      ;;
    *)
      TARGET="$1"
      shift
      ;;
  esac
done

command -v git >/dev/null 2>&1 || die "未找到 git, 请先安装 (apt install git / yum install git)"

log "目标目录: $TARGET (branch: $BRANCH)"

# 创建临时工作区
TMP="$(mktemp -d "${TMPDIR:-/tmp}/st-deploy.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT

# 1. 浅克隆 + sparse-checkout, 只拉 dist-plugins
if ! git clone --depth 1 --branch "$BRANCH" --single-branch \
     --filter=blob:none --sparse "$REPO" "$TMP/repo" 2>/dev/null; then
  warn "partial clone 不可用 (git 版本过老?), 退化为普通浅克隆..."
  git clone --depth 1 --branch "$BRANCH" --single-branch "$REPO" "$TMP/repo"
fi
git -C "$TMP/repo" sparse-checkout set dist-plugins
log "已从 GitHub 拉取 dist-plugins (branch: $BRANCH)"

# 2. 校验产物存在
SRC="$TMP/repo/dist-plugins"
if [ ! -d "$SRC" ] || ! compgen -G "$SRC/*/" >/dev/null; then
  die "仓库中未找到 dist-plugins/ 下的插件目录, 请检查分支 '$BRANCH' 是否包含构建产物"
fi

# 3. 列出并部署每个插件
PLUGINS=()
for dir in "$SRC"/*/; do
  PLUGINS+=("$(basename "$dir")")
done
log "发现插件: ${PLUGINS[*]}"

if [ "$DRY_RUN" = "1" ]; then
  log "[dry-run] 不写入磁盘, 完成"
  exit 0
fi

mkdir -p "$TARGET"
for name in "${PLUGINS[@]}"; do
  # 先删除旧目录, 保证与 GitHub 产物完全一致 (部署产物可随时重建, 删除安全)
  rm -rf "$TARGET/$name"
  cp -r "$SRC/$name" "$TARGET/$name"
  size="$(du -sh "$SRC/$name" | awk '{print $1}')"
  log "已部署 $name/ ($size)"
done

log "完成: ${#PLUGINS[@]} 个插件已同步到 $TARGET"
log "当前 plugins/ 内容: $(ls -1 "$TARGET" | tr '\n' ' ')"
