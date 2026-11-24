import { spawn } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
const command = args[0] === "start" ? "start" : "dev";

let port = process.env.PORT || "3000";
let hostname = "0.0.0.0";

for (let i = 1; i < args.length; i += 1) {
  const arg = args[i];
  if (arg.startsWith("--port=")) {
    port = arg.slice("--port=".length);
  } else if ((arg === "--port" || arg === "-p") && args[i + 1]) {
    port = args[i + 1];
    i += 1;
  } else if (arg.startsWith("--host=")) {
    hostname = arg.slice("--host=".length);
  } else if (arg.startsWith("--hostname=")) {
    hostname = arg.slice("--hostname=".length);
  } else if (
    (arg === "--host" || arg === "--hostname" || arg === "-H") &&
    args[i + 1]
  ) {
    hostname = args[i + 1];
    i += 1;
  }
}

const nextBin = path.resolve(process.cwd(), "node_modules", "next", "dist", "bin", "next");

const child = spawn(
  process.execPath,
  [nextBin, command, "-p", port, "-H", hostname],
  {
    stdio: "inherit",
    env: process.env,
  }
);

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
