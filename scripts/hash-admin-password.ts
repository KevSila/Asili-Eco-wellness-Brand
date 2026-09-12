import { createAdminPasswordHash } from "../src/server/auth/admin-auth";

function readHidden(prompt: string) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error("Run this command in an interactive terminal.");
  }

  return new Promise<string>((resolve, reject) => {
    let value = "";
    process.stdout.write(prompt);
    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
    };

    const onData = (key: string) => {
      if (key === "\u0003") {
        finish();
        reject(new Error("Cancelled."));
      } else if (key === "\r" || key === "\n") {
        finish();
        resolve(value);
      } else if (key === "\u007f" || key === "\b") {
        value = value.slice(0, -1);
      } else if (key >= " ") {
        value += key;
      }
    };

    process.stdin.on("data", onData);
  });
}

try {
  const password = await readHidden("Admin password: ");
  const confirmation = await readHidden("Confirm password: ");
  if (password.length < 12) throw new Error("Use at least 12 characters.");
  if (password !== confirmation) throw new Error("Passwords did not match.");
  console.log(await createAdminPasswordHash(password));
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to create password hash.");
  process.exitCode = 1;
}
