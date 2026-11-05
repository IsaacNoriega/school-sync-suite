const https = require('https');

// Reemplazar con la URL real de tu backend desplegado en Render
const BACKEND_URL = process.env.BACKEND_URL || 'https://school-sync-backend.onrender.com/health';
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 15000;

function pingBackend(attempt = 1) {
  console.log(`[Keep-Alive] Intento ${attempt}/${MAX_RETRIES} -> Ping a: ${BACKEND_URL}`);

  const req = https.get(
    BACKEND_URL,
    {
      headers: {
        'User-Agent': 'EducaQR-KeepAlive/1.0',
        Accept: 'application/json',
      },
      timeout: 30000,
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log(`[Keep-Alive] Respuesta del servidor (${res.statusCode}): ${data}`);
        if (res.statusCode >= 500 && attempt < MAX_RETRIES) {
          console.warn(
            `[Keep-Alive] Servidor despertando (${res.statusCode}). Reintentando en ${RETRY_DELAY_MS / 1000}s...`,
          );
          setTimeout(() => pingBackend(attempt + 1), RETRY_DELAY_MS);
        } else if (res.statusCode >= 400) {
          process.exitCode = 1;
        }
      });
    },
  );

  req.on('timeout', () => {
    req.destroy(new Error('Request timeout (30s)'));
  });

  req.on('error', (err) => {
    console.error(`[Keep-Alive] Error al realizar ping (intento ${attempt}):`, err.message);
    if (attempt < MAX_RETRIES) {
      console.log(`[Keep-Alive] Reintentando en ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => pingBackend(attempt + 1), RETRY_DELAY_MS);
    } else {
      process.exitCode = 1;
    }
  });
}

pingBackend();
