const fs = require('fs');
const path = require('path');

const webDist = path.resolve(__dirname, '../apps/web/dist');
const rootDist = path.resolve(__dirname, '../dist');

if (fs.existsSync(webDist)) {
  fs.cpSync(webDist, rootDist, { recursive: true, force: true });
  console.log('[Deploy] Successfully mirrored apps/web/dist -> ./dist');
} else {
  console.warn('[Deploy] Warning: apps/web/dist not found to copy');
}
