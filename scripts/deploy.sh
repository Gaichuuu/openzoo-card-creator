set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/.deploy.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .deploy.env not found. Create it with:"
  echo '  DEPLOY_USER="your-user"'
  echo '  DEPLOY_HOST="your-host"'
  echo '  DEPLOY_PATH="~/your-path/"'
  exit 1
fi

source "$ENV_FILE"
REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

echo "==> Building project..."
cd "$PROJECT_ROOT"
npm run build

echo "==> Generating sitemap..."
npx tsx scripts/generate-sitemap.ts

echo "==> Deploying dist/ to ${REMOTE}..."
rsync -avz --delete \
  dist/ \
  "$REMOTE"

echo "==> Deploying sitemap..."
rsync -avz sitemap.xml "$REMOTE"

echo "==> Deploying NGINX config..."
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p ~/nginx/openzootcg.com"
rsync -avz nginx/openzootcg.com/nginx.conf "${DEPLOY_USER}@${DEPLOY_HOST}:~/nginx/openzootcg.com/nginx.conf"

echo "==> Deploy complete!"
