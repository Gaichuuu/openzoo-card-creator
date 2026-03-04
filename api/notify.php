<?php
/**
 * Discord webhook notification endpoint.
 * POST /api/notify  { "cardId": "..." }
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

// Origin check — only accept requests from the production site
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$allowedOrigin = 'https://openzootcg.com';
$isLocalhost = str_contains($origin, 'localhost') || str_contains($referer, 'localhost');
if (!$isLocalhost && $origin !== $allowedOrigin && !str_starts_with($referer, $allowedOrigin)) {
  http_response_code(403);
  echo json_encode(['error' => 'Forbidden']);
  exit;
}

// Simple file-based rate limiter: max 30 notifications per minute per IP
$rateLimitDir = sys_get_temp_dir() . '/openzoo-notify-rate';
@mkdir($rateLimitDir, 0755, true);
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateLimitFile = $rateLimitDir . '/' . md5($ip);
$now = time();
$window = 60;
$maxRequests = 30;

$timestamps = [];
if (is_file($rateLimitFile)) {
  $timestamps = array_filter(
    explode("\n", file_get_contents($rateLimitFile)),
    fn($ts) => $ts && (int)$ts > $now - $window
  );
}
if (count($timestamps) >= $maxRequests) {
  http_response_code(429);
  echo json_encode(['error' => 'Too many requests']);
  exit;
}
$timestamps[] = $now;
file_put_contents($rateLimitFile, implode("\n", $timestamps));

$config = @include __DIR__ . '/config.php';
if (!$config) {
  echo json_encode(['ok' => true, 'skipped' => 'no config']);
  exit;
}

$webhookUrl = $config['discord_webhook_url'] ?? '';
$projectId = $config['firebase_project_id'] ?? '';

if (!$webhookUrl || !$projectId) {
  echo json_encode(['ok' => true, 'skipped' => 'not configured']);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$cardId = $input['cardId'] ?? '';

if (!$cardId || !preg_match('/^[a-zA-Z0-9_-]{1,50}$/', $cardId)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid cardId']);
  exit;
}

require_once dirname(__DIR__) . '/lib/firestore.php';

$card = fetch_card($cardId, $projectId);
if (!$card) {
  http_response_code(404);
  echo json_encode(['error' => 'Card not found']);
  exit;
}

$cardName = get_card_display_name($card);
$desc = build_card_description($card);
$cardUrl = "https://openzootcg.com/gallery/{$cardId}";
$thumbnailUrl = $card['thumbnailUrl'] ?? '';

$embed = [
  'title' => mb_substr($cardName, 0, 256),
  'url' => $cardUrl,
  'description' => mb_substr($desc, 0, 300),
  'color' => 0xDAAA00,
  'footer' => ['text' => 'OpenZoo TCG'],
  'timestamp' => date('c'),
];

if ($thumbnailUrl) {
  $embed['image'] = ['url' => $thumbnailUrl];
}

$payload = json_encode(['embeds' => [$embed]], JSON_UNESCAPED_SLASHES);

$ch = curl_init($webhookUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_exec($ch);
curl_close($ch);

echo json_encode(['ok' => true]);
