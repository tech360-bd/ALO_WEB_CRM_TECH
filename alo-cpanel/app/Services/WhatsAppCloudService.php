<?php
declare(strict_types=1);

/**
 * WhatsAppCloudService — Wraps Meta Graph API v20.0 for WhatsApp Cloud API
 *
 * Env: WHATSAPP_VERIFY_TOKEN, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_GRAPH_VERSION
 * Uses AloWhatsAppNumberService for sender resolution.
 *
 * Responsibilities:
 *  - webhook verification (GET)
 *  - sendText / sendTemplate / sendMedia (POST to graph)
 *  - verifySignature (X-Hub-Signature-256)
 *  - queue failed jobs to whatsapp_failed_jobs
 */
class WhatsAppCloudService
{
    public const DEFAULT_GRAPH_VERSION = 'v20.0';

    private string $verifyToken;
    private string $accessToken;
    private string $phoneNumberId;
    private string $businessAccountId;
    private string $graphVersion;
    private string $graphBase;

    public function __construct(?string $verifyToken = null, ?string $accessToken = null, ?string $phoneNumberId = null, ?string $graphVersion = null)
    {
        $this->verifyToken      = $verifyToken      ?? ($_ENV['WHATSAPP_VERIFY_TOKEN']      ?? (defined('WHATSAPP_VERIFY_TOKEN') ? WHATSAPP_VERIFY_TOKEN : ''));
        $this->accessToken      = $accessToken      ?? ($_ENV['WHATSAPP_ACCESS_TOKEN']      ?? (defined('WHATSAPP_ACCESS_TOKEN') ? WHATSAPP_ACCESS_TOKEN : (defined('WA_API_TOKEN') ? WA_API_TOKEN : '')));
        $this->phoneNumberId    = $phoneNumberId    ?? ($_ENV['WHATSAPP_PHONE_NUMBER_ID']   ?? (defined('WHATSAPP_PHONE_NUMBER_ID') ? WHATSAPP_PHONE_NUMBER_ID : (defined('WA_PHONE_NUMBER') ? WA_PHONE_NUMBER : '')));
        $this->businessAccountId = $_ENV['WHATSAPP_BUSINESS_ACCOUNT_ID'] ?? (defined('WHATSAPP_BUSINESS_ACCOUNT_ID') ? WHATSAPP_BUSINESS_ACCOUNT_ID : '');
        $this->graphVersion     = $graphVersion     ?? ($_ENV['WHATSAPP_GRAPH_VERSION']     ?? (defined('WHATSAPP_GRAPH_VERSION') ? WHATSAPP_GRAPH_VERSION : self::DEFAULT_GRAPH_VERSION));
        if ($this->graphVersion === '') { $this->graphVersion = self::DEFAULT_GRAPH_VERSION; }
        $this->graphBase = 'https://graph.facebook.com/' . $this->graphVersion;
    }

    public static function fromEnv(): self
    {
        return new self();
    }

    /**
     * Handle webhook GET verification (hub.challenge).
     * Returns challenge string if valid, null otherwise.
     */
    public function handleVerification(array $query): ?string
    {
        $mode      = $query['hub_mode'] ?? $query['hub.mode'] ?? null;
        $token     = $query['hub_verify_token'] ?? $query['hub.verify_token'] ?? null;
        $challenge = $query['hub_challenge'] ?? $query['hub.challenge'] ?? null;

        if ($mode === 'subscribe' && $token !== null && $challenge !== null) {
            $expected = $this->verifyToken ?: (getenv('WHATSAPP_VERIFY_TOKEN') ?: '');
            // Also check config constant
            if ($expected === '' && defined('WHATSAPP_VERIFY_TOKEN')) $expected = WHATSAPP_VERIFY_TOKEN;
            if (hash_equals((string)$expected, (string)$token)) {
                return (string)$challenge;
            }
        }
        return null;
    }

    /**
     * Verify X-Hub-Signature-256 header against raw payload.
     * Uses app secret = WHATSAPP_ACCESS_TOKEN's app secret if available; otherwise skip (return true if no secret configured).
     * For strict mode, set WHATSAPP_APP_SECRET.
     */
    public function verifySignature(string $payload, ?string $headerSignature): bool
    {
        $secret = $_ENV['WHATSAPP_APP_SECRET'] ?? (defined('WHATSAPP_APP_SECRET') ? WHATSAPP_APP_SECRET : '');
        if ($secret === '' || $secret === null) {
            // No secret configured — accept (but log)
            return true;
        }
        if ($headerSignature === null || $headerSignature === '') {
            return false;
        }
        // Header format: sha256=hex
        $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
        return hash_equals($expected, $headerSignature);
    }

    /**
     * Send a text message via Cloud API.
     *
     * @param string $to Normalized 8801... or 018... — will be converted to +880 for API
     * @param string $body
     * @param string|null $senderPhoneNumberId Override sender (alo_whatsapp_numbers.whatsapp_phone_number_id)
     * @return array{success:bool, message_id:?string, error:?string, http_code:int}
     */
    public function sendText(string $to, string $body, ?string $senderPhoneNumberId = null): array
    {
        $normalized = AloWhatsAppNumberService::normalizePhone($to);
        $apiTo = $normalized ? '+' . $normalized : $to;
        // Use override or default
        $phoneNumberId = $senderPhoneNumberId ?: $this->phoneNumberId;
        if ($phoneNumberId === '' || $phoneNumberId === null) {
            // Try to resolve via AloWhatsAppNumberService main number
            $main = AloWhatsAppNumberService::getMainNumber();
            $phoneNumberId = $main['whatsapp_phone_number_id'] ?? '';
        }
        if ($phoneNumberId === '' || $this->accessToken === '') {
            $error = 'WhatsApp not configured: missing PHONE_NUMBER_ID or ACCESS_TOKEN';
            $this->queueFailed($to, $body, null, $error);
            return ['success' => false, 'message_id' => null, 'error' => $error, 'http_code' => 0];
        }
        $url = $this->graphBase . '/' . $phoneNumberId . '/messages';
        $payload = [
            'messaging_product' => 'whatsapp',
            'to'                => $apiTo,
            'type'              => 'text',
            'text'              => ['body' => $body, 'preview_url' => false],
        ];
        return $this->doPost($url, $payload, $to, $body);
    }

    /**
     * Send template message.
     *
     * @param string $to
     * @param string $templateName e.g. alo_followup_day_3
     * @param string $lang default en
     * @param array $components optional components
     */
    public function sendTemplate(string $to, string $templateName, string $lang = 'en', array $components = [], ?string $senderPhoneNumberId = null): array
    {
        $normalized = AloWhatsAppNumberService::normalizePhone($to);
        $apiTo = $normalized ? '+' . $normalized : $to;
        $phoneNumberId = $senderPhoneNumberId ?: $this->phoneNumberId;
        if ($phoneNumberId === '' || $this->accessToken === '') {
            $error = 'WhatsApp not configured';
            return ['success' => false, 'message_id' => null, 'error' => $error, 'http_code' => 0];
        }
        $url = $this->graphBase . '/' . $phoneNumberId . '/messages';
        $payload = [
            'messaging_product' => 'whatsapp',
            'to'                => $apiTo,
            'type'              => 'template',
            'template'          => [
                'name'     => $templateName,
                'language' => ['code' => $lang],
            ],
        ];
        if (!empty($components)) {
            $payload['template']['components'] = $components;
        }
        return $this->doPost($url, $payload, $to, json_encode($payload));
    }

    /**
     * Download media by mediaId.
     * Returns binary string or null.
     */
    public function downloadMedia(string $mediaId): ?string
    {
        if ($this->accessToken === '') return null;
        // Step 1: get media URL
        $url = $this->graphBase . '/' . $mediaId;
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $this->accessToken],
            CURLOPT_TIMEOUT        => 15,
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code !== 200 || $resp === false) return null;
        $json = json_decode($resp, true);
        $mediaUrl = $json['url'] ?? null;
        if (!$mediaUrl) return null;
        // Step 2: download binary
        $ch = curl_init($mediaUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $this->accessToken],
            CURLOPT_TIMEOUT        => 30,
        ]);
        $bin = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($code !== 200 || $bin === false) return null;
        return $bin;
    }

    private function doPost(string $url, array $payload, string $to, string $body): array
    {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $json,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $this->accessToken,
                'Content-Type: application/json',
            ],
            CURLOPT_TIMEOUT        => 15,
        ]);
        $resp = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($resp === false) {
            $err = 'cURL error: ' . $curlErr;
            $this->queueFailed($to, $body, null, $err);
            return ['success' => false, 'message_id' => null, 'error' => $err, 'http_code' => $httpCode];
        }
        $data = json_decode($resp, true);
        if ($httpCode >= 200 && $httpCode < 300 && isset($data['messages'][0]['id'])) {
            return ['success' => true, 'message_id' => $data['messages'][0]['id'], 'error' => null, 'http_code' => $httpCode];
        }
        $err = $data['error']['message'] ?? $resp;
        // Retryable errors: 429, 5xx, or subcode 130429 etc.
        $this->queueFailed($to, $body, null, $err);
        error_log('WhatsAppCloudService send failed HTTP ' . $httpCode . ': ' . $err);
        return ['success' => false, 'message_id' => null, 'error' => $err, 'http_code' => $httpCode];
    }

    private function queueFailed(string $phone, string $message, ?int $conversationId, string $error): void
    {
        try {
            $pdo = db();
            $stmt = $pdo->prepare('INSERT INTO whatsapp_failed_jobs (phone, message, conversation_id, attempts, last_error, next_retry_at, status) VALUES (:phone, :msg, :cid, 0, :err, DATE_ADD(NOW(), INTERVAL 5 MINUTE), "pending")');
            $stmt->execute([':phone' => $phone, ':msg' => $message, ':cid' => $conversationId, ':err' => substr($error, 0, 2000)]);
        } catch (\Throwable $e) {
            error_log('queueFailed error: ' . $e->getMessage());
        }
    }

    /**
     * Mark a message as read (optional).
     */
    public function markRead(string $messageId, ?string $phoneNumberId = null): bool
    {
        $pid = $phoneNumberId ?: $this->phoneNumberId;
        if ($pid === '' || $this->accessToken === '') return false;
        $url = $this->graphBase . '/' . $pid . '/messages';
        $payload = ['messaging_product' => 'whatsapp', 'status' => 'read', 'message_id' => $messageId];
        $json = json_encode($payload);
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $json,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $this->accessToken, 'Content-Type: application/json'],
            CURLOPT_TIMEOUT        => 10,
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return $code >= 200 && $code < 300;
    }
}
