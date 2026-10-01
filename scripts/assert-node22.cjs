'use strict';
// Active build/start boundary: engines alone is only advisory in npm.
if (Number(process.versions.node.split('.')[0]) !== 22) {
  throw new Error('ALO Education requires Node.js 22.x only. No runtime fallback is supported.');
}
