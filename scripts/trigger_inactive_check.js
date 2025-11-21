// const fetch = require('node-fetch'); // No necesario en Node 18+

async function triggerInactiveCheck() {
  try {
    console.log('🔄 Ejecutando chequeo de clientes inactivos...');
    const response = await fetch('http://localhost:3000/api/automations/scheduled', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'inactive_client.check' }),
    });

    const text = await response.text();
    try {
        const data = JSON.parse(text);
        console.log('✅ Respuesta del servidor:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('❌ Respuesta no JSON (Error 500?):', text);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

triggerInactiveCheck();
