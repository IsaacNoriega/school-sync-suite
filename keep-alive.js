const https = require('https');

// Reemplazar con la URL real de tu backend desplegado en Render
const BACKEND_URL = process.env.BACKEND_URL || 'https://school-sync-backend.onrender.com/health';

console.log(`[Keep-Alive] Iniciando ping a: ${BACKEND_URL}`);

https.get(BACKEND_URL, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`[Keep-Alive] Respuesta del servidor (${res.statusCode}): ${data}`);
  });
}).on('error', (err) => {
  console.error(`[Keep-Alive] Error al realizar ping:`, err.message);
});
