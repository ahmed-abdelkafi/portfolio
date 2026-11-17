#!/usr/bin/env node
/**
 * Create (or reset) the administrator account. There is no public registration.
 *
 *   npm run admin:create            -> production D1 (remote)
 *   npm run admin:create -- --local -> local D1 used by `wrangler dev`
 *
 * The password is typed interactively (not echoed), hashed locally with PBKDF2-SHA256
 * (100,000 iterations, random 16-byte salt) and only the hash is sent to the database.
 */
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import readline from "node:readline";

const local = process.argv.includes("--local");

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    // Hidden input: print the prompt, then echo nothing while the password is typed.
    rl._writeToOutput = (s) => {
      if (!muted) rl.output.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
    muted = hidden;
  });
}

const username = (await ask("Admin username: ")).trim();
if (!/^[a-zA-Z0-9._-]{3,64}$/.test(username)) {
  console.error("Username must be 3-64 characters: letters, digits, dot, dash, underscore.");
  process.exit(1);
}
const password = await ask("Password (min. 12 characters, hidden): ", true);
if (password.length < 12 || password.length > 256) {
  console.error("Password must be 12 to 256 characters long.");
  process.exit(1);
}
const confirm = await ask("Confirm password: ", true);
if (confirm !== password) {
  console.error("Passwords do not match.");
  process.exit(1);
}

const iterations = 100_000;
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256");
const stored = ["pbkdf2-sha256", iterations, salt.toString("base64"), hash.toString("base64")].join("$");
const now = Date.now();
const sql = `INSERT INTO admins (username, pw_hash, created_at, updated_at) VALUES ('${username}', '${stored}', ${now}, ${now})
ON CONFLICT(username) DO UPDATE SET pw_hash = excluded.pw_hash, updated_at = excluded.updated_at;
DELETE FROM admin_sessions WHERE admin_id = (SELECT id FROM admins WHERE username = '${username}');
`;

const dir = mkdtempSync(join(tmpdir(), "aa-admin-"));
const file = join(dir, "admin.sql");
writeFileSync(file, sql, { mode: 0o600 });
try {
  const res = spawnSync(
    process.execPath,
    ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", "DB", local ? "--local" : "--remote", "--file", file, "--yes"],
    { stdio: "inherit" },
  );
  if (res.status !== 0) process.exit(res.status ?? 1);
  console.log(`\nAdministrator "${username}" is ready (${local ? "local" : "production"} database). Existing sessions were signed out.`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
