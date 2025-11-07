#!/usr/bin/env node

/**
 * Add shebang to built file
 */

import { readFileSync, writeFileSync, chmodSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distFile = resolve(__dirname, '../dist/index.js');

try {
  const content = readFileSync(distFile, 'utf8');
  const shebang = '#!/usr/bin/env node\n';

  if (!content.startsWith(shebang)) {
    writeFileSync(distFile, shebang + content);
    chmodSync(distFile, 0o755);
    console.log('✓ Shebang added to dist/index.js');
  } else {
    console.log('✓ Shebang already present');
  }
} catch (error) {
  console.error('Error adding shebang:', error);
  process.exit(1);
}

