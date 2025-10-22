// Alternativas de endpoints para Instagram:

// 1. Endpoint actual (que estamos probando):
// https://graph.facebook.com/v18.0/me/messages

// 2. Endpoint con page ID:
// https://graph.facebook.com/v18.0/{PAGE_ID}/messages

// 3. Endpoint con Instagram business account:
// https://graph.facebook.com/v18.0/{INSTAGRAM_BUSINESS_ACCOUNT_ID}/messages

// 4. Para Instagram Direct (mensajes privados):
// https://graph.facebook.com/v18.0/{PAGE_ID}/messages

// Debugging info:
// - Instagram Business Account ID: 17841442216976656
// - Token type: IG User Access Token
// - Required permissions: instagram_basic, instagram_manage_messages, pages_messaging

// Posibles problemas:
// 1. Token no tiene permisos para messaging
// 2. Instagram account no está conectado a una página de Facebook
// 3. Necesita ser Page Access Token en lugar de Instagram User Access Token
// 4. La app no está aprobada para Instagram messaging