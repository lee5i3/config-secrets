'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Cap reads so a hostile or misconfigured mount can't OOM startup.
const MAX_BYTES = 64 * 1024;

// POSIX env-var name shape.
const VALID_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

// Attacker-controlled values here escalate to RCE or MITM.
const DENIED_NAMES = new Set([
  'NODE_OPTIONS',                 // CLI flag injection (--inspect, --require)
  'NODE_PATH',                    // module resolution hijack
  'NODE_EXTRA_CA_CERTS',          // TLS root injection
  'NODE_TLS_REJECT_UNAUTHORIZED', // disables TLS cert validation
  'LD_PRELOAD',                   // shared-library hijack (Linux/BSD)
  'LD_LIBRARY_PATH',              // shared-library hijack (Linux/BSD)
  'LD_AUDIT',                     // dynamic linker audit hook (Linux/BSD)
  'DYLD_INSERT_LIBRARIES',        // shared-library hijack (macOS)
  'DYLD_LIBRARY_PATH',            // shared-library hijack (macOS)
]);

function getSecrets() {
  const dir = process.env.SECRET_PATH || '/run/secrets';
  const followSymlinks = process.env.SECRET_PATH_FOLLOW_SYMLINKS === 'true';
  const out = {};

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return out;
    throw err;
  }

  for (const entry of entries) {
    // Symlinks skipped by default; a hostile link could redirect reads outside the dir.
    if (!entry.isFile() && !(followSymlinks && entry.isSymbolicLink())) continue;

    if (!VALID_NAME.test(entry.name)) continue;
    if (DENIED_NAMES.has(entry.name)) continue;

    let raw;
    try {
      const fullPath = path.join(dir, entry.name);
      // Stat-then-read costs one extra syscall but bounds memory before the
      // read. statSync resolves symlinks, so the size we check is the target.
      const stat = fs.statSync(fullPath);
      if (stat.size > MAX_BYTES) continue;
      raw = fs.readFileSync(fullPath, 'utf8');
    } catch (err) {
      // Rotated between readdir + read, dangling symlink, or directory.
      if (err.code === 'ENOENT' || err.code === 'EISDIR') continue;
      throw err;
    }
    // Docker secrets ship with a trailing newline.
    out[entry.name] = raw.replace(/\n$/, '');
  }
  return out;
}

module.exports = { getSecrets };
