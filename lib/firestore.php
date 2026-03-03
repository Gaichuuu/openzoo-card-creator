<?php
/* Firestore REST API helper */

function parse_firestore_fields(array $fields): array {
  $result = [];
  foreach ($fields as $key => $value) {
    if (isset($value['stringValue'])) {
      $result[$key] = $value['stringValue'];
    } elseif (isset($value['integerValue'])) {
      $result[$key] = (int)$value['integerValue'];
    } elseif (isset($value['doubleValue'])) {
      $result[$key] = (float)$value['doubleValue'];
    } elseif (isset($value['booleanValue'])) {
      $result[$key] = $value['booleanValue'];
    } elseif (isset($value['mapValue']['fields'])) {
      $result[$key] = parse_firestore_fields($value['mapValue']['fields']);
    } elseif (isset($value['arrayValue']['values'])) {
      $arr = [];
      foreach ($value['arrayValue']['values'] as $v) {
        if (isset($v['stringValue'])) {
          $arr[] = $v['stringValue'];
        } elseif (isset($v['mapValue']['fields'])) {
          $arr[] = parse_firestore_fields($v['mapValue']['fields']);
        }
      }
      $result[$key] = $arr;
    }
  }
  return $result;
}

function fetch_card(string $cardId, string $projectId): ?array {
  if (!preg_match('/^[a-zA-Z0-9_-]{1,50}$/', $cardId)) {
    return null;
  }

  $url = "https://firestore.googleapis.com/v1/projects/{$projectId}/databases/(default)/documents/cards/{$cardId}";

  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_TIMEOUT, 4);
  $res = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if (!$res || $httpCode !== 200) return null;

  $json = json_decode($res, true);
  if (!$json || !isset($json['fields'])) return null;

  return parse_firestore_fields($json['fields']);
}

function get_card_display_name(array $card): string {
  return str_replace("\n", ' ', $card['cardName'] ?? 'Untitled');
}

function build_card_description(array $card): string {
  $parts = [];

  if (!empty($card['cardType'])) {
    $parts[] = $card['cardType'];
  }

  $elements = [];
  if (!empty($card['primaryElement'])) $elements[] = $card['primaryElement'];
  if (!empty($card['secondaryElement'])) $elements[] = $card['secondaryElement'];
  if ($elements) {
    $parts[] = implode(' / ', $elements);
  }

  if (!empty($card['tags']) && is_array($card['tags'])) {
    $parts[] = implode(', ', $card['tags']);
  }

  if (!empty($card['creatorName'])) {
    $parts[] = 'by ' . $card['creatorName'];
  }

  return $parts ? implode(' | ', $parts) : 'A custom card created with OpenZoo Card Creator.';
}
