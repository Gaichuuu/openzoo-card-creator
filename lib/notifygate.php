<?php

const NOTIFY_UPDATE_SLACK = 5;

const NOTIFY_COOLDOWN = 1800;

const NOTIFY_FREE_POSTS = 2;

function is_card_update(array $card): bool {
  $created = strtotime($card['createdAt'] ?? '');
  $updated = strtotime($card['updatedAt'] ?? '');
  if (!$created || !$updated) return false;
  return $updated - $created > NOTIFY_UPDATE_SLACK;
}

function notify_gate_ok(string $cardId, bool $isUpdate, int $now, string $dir): bool {
  if (!@mkdir($dir, 0755, true) && !is_dir($dir)) return true;
  $file = $dir . '/' . md5($cardId);

  $count = 0;
  $last = 0;
  if (is_file($file)) {
    $parts = explode(' ', (string)@file_get_contents($file));
    $count = (int)($parts[0] ?? 0);
    $last = (int)($parts[1] ?? 0);
  } elseif ($isUpdate) {
    $count = 1;
  }

  if ($isUpdate && $count >= NOTIFY_FREE_POSTS && $now - $last < NOTIFY_COOLDOWN) {
    return false;
  }

  @file_put_contents($file, ($count + 1) . ' ' . $now);
  return true;
}
