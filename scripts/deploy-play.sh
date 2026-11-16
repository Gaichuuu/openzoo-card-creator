set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/.deploy.env"
BUILD_DIR="${PLAY_BUILD_DIR:-$HOME/openzoo-cryptid-clash/Build/AlphaWebGL}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .deploy.env not found (see scripts/deploy.sh)."
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
DEPLOY_DIR="${DEPLOY_PATH%/}"
if [ "${DEPLOY_DIR##*/}" != "$EXPECTED_DOMAIN" ]; then
  echo "Error: refusing to deploy, DEPLOY_PATH must end in a directory named ${EXPECTED_DOMAIN}"
  exit 1
fi

if [ ! -f "${BUILD_DIR}/index.html" ] || ! ls "${BUILD_DIR}"/Build/*.loader.js >/dev/null 2>&1 \
   || ! ls "${BUILD_DIR}"/Build/*.data.unityweb >/dev/null 2>&1; then
  echo "Error: no browser build found in ${BUILD_DIR}"
  echo "  Build it in the game project first, or set PLAY_BUILD_DIR."
  exit 1
fi

echo "==> Build: ${BUILD_DIR} ($(du -sh "${BUILD_DIR}" | cut -f1))"
echo "==> Uploading to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR}/play/ ..."
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p ${DEPLOY_DIR}/play"
rsync -avz --delete "${BUILD_DIR}/" "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_DIR}/play/"
echo "==> Done: https://${EXPECTED_DOMAIN}/play/"
