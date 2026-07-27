import { spawn } from "node:child_process";

const environment = { ...process.env };
delete environment.NO_COLOR;
delete environment.FORCE_COLOR;

const child = spawn(
  process.execPath,
  ["node_modules/@playwright/test/cli.js", "test"],
  {
    cwd: process.cwd(),
    env: environment,
    stdio: "inherit",
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exitCode = code ?? 1;
});
