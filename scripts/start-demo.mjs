import { execSync, spawn } from "node:child_process"
import { existsSync, rmSync, writeFileSync } from "node:fs"
import net from "node:net"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
process.chdir(root)

function portInUse(port) {
  return new Promise((resolvePort) => {
    const server = net.createServer()
    server.once("error", () => resolvePort(true))
    server.once("listening", () => {
      server.close(() => resolvePort(false))
    })
    server.listen(port, "127.0.0.1")
  })
}

function run(command) {
  execSync(command, { stdio: "inherit", env: process.env, shell: true })
}

console.log("\n[FailBounty] Preparing demo environment...\n")

const port3000Busy = await portInUse(3000)

if (!existsSync(".env")) {
  console.log("[FailBounty] No .env found. Creating local SQLite demo config.")
  writeFileSync(".env", 'DATABASE_URL="file:./prisma/dev.db"\n', "utf8")
}

if (port3000Busy) {
  console.error("\n[FailBounty] Port 3000 is already in use.")
  console.error("Another Next.js dev server is probably still running.")
  console.error("")
  console.error("Windows:")
  console.error("  netstat -ano | findstr :3000")
  console.error("  taskkill /PID <pid> /F")
  console.error("")
  console.error("Then rerun: npm run start:demo")
  console.error("If startup still fails, delete the .next folder and try again.\n")
  process.exit(1)
}

if (existsSync(".next")) {
  console.log("[FailBounty] Clearing .next cache for clean restart.")
  rmSync(".next", { recursive: true, force: true })
}

run("npm run prisma:generate")
run("npm run prisma:push")
run("npm run db:seed")

console.log("\n[FailBounty] Demo is ready. Starting app on http://localhost:3000")
console.log("[FailBounty] Open /programs, /programs/prog-workspace-copilot, /lab/prog-workspace-copilot, or /submissions\n")

const child = spawn("npm run dev", { stdio: "inherit", shell: true, cwd: root })
child.on("exit", (code) => process.exit(code ?? 0))
