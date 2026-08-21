set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/.deploy.env"

SITE_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --site) SITE_ONLY=true ;;
    *) echo "Unknown option: $arg (supported: --site)"; exit 1 ;;
  esac
done

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .deploy.env not found. Create it with:"
  echo '  DEPLOY_USER="your-user"'
  echo '  DEPLOY_HOST="your-host"'
  echo '  DEPLOY_PATH="~/your-path/"'
  exit 1
fi

source "$ENV_FILE"

EXPECTED_DOMAIN="openzootcg.com"
for var in DEPLOY_USER DEPLOY_HOST DEPLOY_PATH; do
  if [ -z "${!var:-}" ]; then
    echo "Error: $var is empty in .deploy.env"
    exit 1
  fi
done
case "$DEPLOY_PATH" in
  *"$EXPECTED_DOMAIN"*) ;;
  *)
    echo "Error: refusing to deploy, DEPLOY_PATH does not target ${EXPECTED_DOMAIN}"
    echo "  DEPLOY_PATH = ${DEPLOY_PATH}"
    exit 1
    ;;
esac

REMOTE="${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

echo "==> Building project..."
cd "$PROJECT_ROOT"
npm run build

if [ "$SITE_ONLY" = false ]; then
  echo "==> Deploying Firestore indexes..."
  firebase deploy --only firestore:indexes --project openzoo
fi

echo "==> Generating sitemap..."
npx tsx scripts/generate-sitemap.ts

echo "==> Deploying dist/ to ${REMOTE}..."
rsync -avz --delete \
  --exclude=gallery --exclude=api --exclude=lib \
  dist/ \
  "$REMOTE"

echo "==> Deploying sitemap..."
rsync -avz sitemap.xml "$REMOTE"

if [ "$SITE_ONLY" = false ]; then
  echo "==> Deploying PHP files..."
  rsync -avz gallery/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/gallery/"
  rsync -avz --exclude='config.php' api/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/api/"
  rsync -avz lib/ "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/lib/"

  echo "==> Deploying NGINX config..."
  ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p ~/nginx/openzootcg.com"
  rsync -avz nginx/openzootcg.com/nginx.conf "${DEPLOY_USER}@${DEPLOY_HOST}:~/nginx/openzootcg.com/nginx.conf"
  echo "Note: nginx config changes need Reload HTTP in the DreamHost panel."
fi

echo "==> Deploy complete!"
