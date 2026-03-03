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

$cardName = str_replace("\n", ' ', $card['cardName'] ?? 'Untitled');
$desc = build_card_description($card);
$cardUrl = "https://openzootcg.com/gallery/{$cardId}";
$thumbnailUrl = $card['thumbnailUrl'] ?? '';

$embed = [
  'title' => mb_substr($cardName, 0, 256),
  'url' => $cardUrl,
  'description' => mb_substr($desc, 0, 300),
  'color' => 0xDAAA00,
  'footer' => ['text' => 'OpenZoo Card Creator'],
  'timestamp' => date('c'),
];

if ($thumbnailUrl) {
  $embed['thumbnail'] = ['url' => $thumbnailUrl];
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
