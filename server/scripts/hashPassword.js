/**
 * Generate the bcrypt hash for ADMIN_PASSWORD_HASH.
 *
 *   npm run hash-password -- "the new password"
 *
 * Copy the printed line into server/.env (and into the Render environment),
 * then delete ADMIN_PASSWORD. Passing the password as an argument leaves it in
 * your shell history — clear it afterwards, or export it first:
 *
 *   ADMIN_NEW_PASSWORD='…' npm run hash-password
 */
import bcrypt from "bcryptjs";

const password = process.argv[2] || process.env.ADMIN_NEW_PASSWORD;

if (!password) {
  console.error(
    'Usage: npm run hash-password -- "your password"\n' +
      "   or: ADMIN_NEW_PASSWORD='your password' npm run hash-password"
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("Refusing to hash: use a password of at least 8 characters.");
  process.exit(1);
}

// 12 rounds: ~250 ms per attempt on a small Render instance. Slow enough to
// make offline cracking expensive, fast enough for an interactive login.
const hash = await bcrypt.hash(password, 12);

console.log("\nAdd this to server/.env and remove ADMIN_PASSWORD:\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
