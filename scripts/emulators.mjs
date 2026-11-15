// Starts the Firebase emulators (auth 9099, firestore 8085, UI 4000) and keeps their data
// in ./emulator-data between runs, so saved roles survive a restart.
// The data is exported when you stop the emulators with Ctrl+C.
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

const dir = "./emulator-data";
const args = ["firebase", "emulators:start", "--only", "auth,firestore", `--export-on-exit=${dir}`];
if (existsSync(`${dir}/firebase-export-metadata.json`)) args.push(`--import=${dir}`);
else console.log("No saved emulator data yet. Starting empty; data is saved to ./emulator-data when you press Ctrl+C.");

const child = spawn("npx", args, { stdio: "inherit", shell: process.platform === "win32" });
child.on("exit", (code) => process.exit(code ?? 0));
