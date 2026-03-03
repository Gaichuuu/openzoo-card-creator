<?php
/**
 * SEO handler for gallery card pages.
 * URL pattern: /gallery/{cardId}
 */

require_once dirname(__DIR__) . '/lib/firestore.php';

$config = @include dirname(__DIR__) . '/api/config.php';
if (!$config) $config = [];

$projectId = $config['firebase_project_id'] ?? '';

$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isBot = (bool) preg_match(
  '/facebookexternalhit|Twitterbot|Discordbot|Slackbot|LinkedInBot|WhatsApp|TelegramBot|Applebot|Google.*snippet|bingbot|SkypeUriPreview|redditbot|Meta-ExternalAgent|Googlebot/i',
  $ua
);

$debug = isset($_GET['dbg']);

$path = $_SERVER['REQUEST_URI'] ?? '';
$parsedPath = parse_url($path, PHP_URL_PATH);

$cardId = null;
if (preg_match('~^/gallery/([^/?#]+)~', $parsedPath, $matches)) {
  $cardId = urldecode($matches[1]);
}

if (!$cardId) {
  serve_index();
  exit;
}

if ($debug) {
  header('Content-Type: text/plain; charset=utf-8');
  echo "UA: $ua\n";
  echo "IS_BOT: " . ($isBot ? 'true' : 'false') . "\n";
  echo "CARD_ID: $cardId\n";
  echo "PROJECT: $projectId\n\n";

  if ($projectId) {
    $card = fetch_card($cardId, $projectId);
    echo "CARD DATA: " . json_encode($card, JSON_PRETTY_PRINT) . "\n";
  } else {
    echo "ERROR: firebase_project_id not configured\n";
  }
  exit;
}

if ($isBot && $projectId) {
  $defaultImage = 'https://openzootcg.com/assets/ozLogo.png';
  $card = fetch_card($cardId, $projectId);

  if ($card) {
    $cardName = str_replace("\n", ' ', $card['cardName'] ?? 'Untitled');
    $desc = build_card_description($card);
    $image = !empty($card['thumbnailUrl']) ? $card['thumbnailUrl'] : $defaultImage;
    render_og($parsedPath, $cardName, $desc, $image);
    exit;
  }

  render_og($parsedPath, 'Card', 'View this card on OpenZoo TCG.', $defaultImage);
  exit;
}

serve_index();

function render_og(string $path, string $title, string $desc, string $image): void {
  $url = 'https://openzootcg.com' . $path;
  $safeTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
  $safeDesc = htmlspecialchars(substr($desc, 0, 300), ENT_QUOTES, 'UTF-8');
  $safeImg = htmlspecialchars($image, ENT_QUOTES, 'UTF-8');
  $fullTitle = "{$safeTitle} — OpenZoo TCG";

  header('Content-Type: text/html; charset=utf-8');
  header('Cache-Control: public, max-age=3600, s-maxage=3600');

  echo "<!doctype html>\n<html lang=\"en\"><head>\n";
  echo "<meta charset=\"utf-8\" />\n";
  echo "<title>{$fullTitle}</title>\n";
  echo "<link rel=\"canonical\" href=\"{$url}\" />\n";
  echo "<meta name=\"description\" content=\"{$safeDesc}\" />\n";
  echo "<meta property=\"og:site_name\" content=\"OpenZoo TCG\" />\n";
  echo "<meta property=\"og:type\" content=\"article\" />\n";
  echo "<meta property=\"og:title\" content=\"{$fullTitle}\" />\n";
  echo "<meta property=\"og:description\" content=\"{$safeDesc}\" />\n";
  echo "<meta property=\"og:image\" content=\"{$safeImg}\" />\n";
  echo "<meta property=\"og:url\" content=\"{$url}\" />\n";
  echo "<meta name=\"twitter:card\" content=\"summary_large_image\" />\n";
  echo "<meta name=\"twitter:title\" content=\"{$fullTitle}\" />\n";
  echo "<meta name=\"twitter:description\" content=\"{$safeDesc}\" />\n";
  echo "<meta name=\"twitter:image\" content=\"{$safeImg}\" />\n";
  echo "<style>body{font:14px system-ui,sans-serif;padding:24px;color:#ddd;background:#0a0e1a}</style>\n";
  echo "</head><body><a href=\"{$url}\">{$fullTitle}</a></body></html>";
}

function serve_index(): void {
  $indexPath = dirname(__DIR__) . '/index.html';
  if (is_file($indexPath)) {
    header('Content-Type: text/html; charset=utf-8');
    readfile($indexPath);
    exit;
  }
  http_response_code(404);
  echo 'Not found';
}
