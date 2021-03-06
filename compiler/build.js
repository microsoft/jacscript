#!/usr/bin/env node
const esbuild = require("esbuild")
const fs = require("fs")
const childProcess = require("child_process")

let watch = false
let fast = false

const args = process.argv.slice(2)
if (args[0] == "--watch" || args[0] == "-watch" || args[0] == "-w") {
  args.shift()
  watch = true
}

if (args[0] == "--fast" || args[0] == "-fast" || args[0] == "-f") {
  args.shift()
  fast = true
}

if (args.length) {
  console.log("Usage: ./build.js [--watch]")
  process.exit(1)
}

function runTSC(args) {
  return new Promise((resolve, reject) => {
    let invoked = false
    if (watch) args.push("--watch", "--preserveWatchOutput")
    console.log("run tsc " + args.join(" "))
    let tscPath = "node_modules/typescript/lib/tsc.js"
    if (!fs.existsSync(tscPath))
      tscPath = "../" + tscPath
    if (!fs.existsSync(tscPath))
      tscPath = "../" + tscPath
    const process = childProcess.fork(tscPath, args)
    process.on("error", err => {
      if (invoked) return
      invoked = true
      reject(err)
    })

    process.on("exit", code => {
      if (invoked) return
      invoked = true
      if (code == 0) resolve()
      else reject(new Error("exit " + code))
    })

    // in watch mode "go in background"
    if (watch)
      setTimeout(() => {
        if (invoked) return
        invoked = true
        resolve()
      }, 500)
  })
}

const files = {
  "built/jacscript-compiler.bundle.js": "src/jacscript.ts",
  "built/jacscript-compiler.node.cjs": "src/jacscript.ts",
}

function buildPrelude(folder, outp) {
  const files = fs.readdirSync(folder)
  files.sort((a, b) => a < b ? -1 : a > b ? 1 : 0)
  let r = 'export const prelude: Record<string, string> = {\n'
  for (const fn of files) {
    r += `    "${fn}":\n\``
    const lines = fs.readFileSync(folder + "/" + fn, "utf-8").split(/\r?\n/)
    while (lines[lines.length - 1] == "")
      lines.pop()
    for (const ln of lines) {
      r += ln.replace(/[$`\\]/g, x => "\\" + x) + "\n"
    }
    r += "`,\n"
  }
  r += "}\n"
  const curr = fs.readFileSync(outp, "utf-8")
  if (curr != r) {
    console.log("updating " + outp)
    fs.writeFileSync(outp, r)
  }
}

async function main() {
  try {
    buildPrelude("lib", "src/prelude.ts")
    for (const outfile of Object.keys(files)) {
      const src = files[outfile]
      const cjs = outfile.endsWith(".cjs")
      const mjs = outfile.endsWith(".mjs")
      await esbuild.build({
        entryPoints: [src],
        bundle: true,
        sourcemap: true,
        outfile,
        logLevel: "warning",
        external: [],
        platform: cjs ? "node" : "browser",
        target: "es2019",
        format: mjs ? "esm" : cjs ? "cjs" : "iife",
        watch
      })
    }
    console.log("bundle done")
    if (!fast)
      await runTSC(["-b", "src"])
  } catch { }
}

main()
