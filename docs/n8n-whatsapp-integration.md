# n8n WhatsApp Integration Guide

Panduan konfigurasi n8n untuk integrasi WhatsApp via WAHA dengan Supabase.

## Arsitektur

```
WhatsApp User → WAHA → n8n Webhook → Supabase RPC → n8n IF → WAHA sendText
```

---

## Prasyarat

- n8n instance (self-hosted atau cloud)
- WAHA running dengan session aktif
- Supabase project dengan migration `023_n8n_whatsapp_integration.sql` sudah dijalankan

---

## Node Configuration

### 1. Webhook (Trigger)

**Type:** Webhook  
**HTTP Method:** POST  
**Path:** `/waha-message`

WAHA akan mengirim event ke URL ini. Set webhook di WAHA:
```
https://your-n8n-url.com/webhook/waha-message
```

---

### 2. Set (Normalize Username)

**Type:** Set  
**Fields:**

| Name | Value |
|------|-------|
| `username` | `{{ $json.body.payload.body.trim().toLowerCase() }}` |
| `chatId` | `{{ $json.body.payload.from }}` |
| `session` | `default` |

---

### 3. HTTP Request (Supabase RPC)

**Type:** HTTP Request  
**Method:** POST  
**URL:** 
```
https://YOUR_PROJECT_ID.supabase.co/rest/v1/rpc/get_card_by_username
```

**Headers:**
| Header | Value |
|--------|-------|
| `apikey` | `YOUR_SERVICE_ROLE_KEY` |
| `Authorization` | `Bearer YOUR_SERVICE_ROLE_KEY` |
| `Content-Type` | `application/json` |

**Body (JSON):**
```json
{
  "u": "{{ $node['Set'].json.username }}"
}
```

---

### 4. IF (Check Result)

**Type:** IF  
**Condition:**
```
{{ $json.length > 0 }}
```

---

### 5A. HTTP Request - Send Success (True Branch)

**Type:** HTTP Request  
**Method:** POST  
**URL:** `http://YOUR_WAHA_URL/api/sendText`

**Body (JSON):**
```json
{
  "session": "{{ $node['Set'].json.session }}",
  "chatId": "{{ $node['Set'].json.chatId }}",
  "text": "Hai {{ $json[0].full_name }} 👋\n\nIni adalah link kartu nama digital:\n{{ $json[0].card_url }}\n\nMohon berkenan disimpan ya ke kontak 😊\n\nKalau ingin punya kartu nama digital seperti saya:\nhttps://official.id"
}
```

---

### 5B. HTTP Request - Send Error (False Branch)

**Type:** HTTP Request  
**Method:** POST  
**URL:** `http://YOUR_WAHA_URL/api/sendText`

**Body (JSON):**
```json
{
  "session": "{{ $node['Set'].json.session }}",
  "chatId": "{{ $node['Set'].json.chatId }}",
  "text": "Mohon maaf 🙏\nUsername yang Anda kirimkan tidak ditemukan.\n\nPastikan ejaan sudah benar ya."
}
```

---

## Testing

### Test SQL Function

Jalankan di Supabase SQL Editor:
```sql
-- Ganti dengan username yang ada
SELECT * FROM get_card_by_username('testuser');
```

### Test via WhatsApp

1. Kirim username ke nomor WhatsApp WAHA
2. Jika ditemukan → terima link kartu nama
3. Jika tidak → terima pesan error

---

## Security Notes

- Gunakan **Service Role Key** untuk Supabase (bukan anon key)
- Function hanya return kartu yang `is_public = true`
- Pertimbangkan rate limiting di WAHA atau n8n

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Empty response | Pastikan username ada di database dan `is_public = true` |
| 401 Unauthorized | Cek apikey dan Authorization header |
| WAHA tidak kirim | Cek webhook URL dan session status |
