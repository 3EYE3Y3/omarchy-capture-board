import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { fileURLToPath } from "node:url"

// Loads a ".pragma library" QML JS module for use from Node tests. Strips
// the pragma line and resolves ".import "relative.js" as Name" statements
// (a real QML JS feature) by recursively loading the referenced module and
// exposing it as a namespace object of the same name — mirroring what the
// actual QML/Quickshell JS engine does when the plugin runs for real.
const cache = new Map()

export function loadQmlJs(pathOrUrl) {
  const filename = pathOrUrl instanceof URL ? fileURLToPath(pathOrUrl) : String(pathOrUrl)
  const resolved = path.resolve(filename)
  if (cache.has(resolved)) return cache.get(resolved)

  const source = fs.readFileSync(resolved, "utf8")
  const dir = path.dirname(resolved)
  const importRe = /^\.import\s+"([^"]+)"\s+as\s+(\w+)\s*$/gm
  const context = vm.createContext({
    Date, Math, Number, String, Array, Object, JSON, RegExp, isFinite, isNaN, NaN, Infinity,
    encodeURIComponent, parseInt, parseFloat
  })
  cache.set(resolved, context) // set before running, in case of circular imports

  let match
  while ((match = importRe.exec(source)) !== null) {
    const importedPath = path.resolve(dir, match[1])
    const namespace = loadQmlJs(importedPath)
    context[match[2]] = namespace
  }

  const body = source
    .replace(/^\.pragma library\s*$/m, "")
    .replace(/^\.import\s+"[^"]+"\s+as\s+\w+\s*$/gm, "")

  vm.runInContext(body, context, { filename: resolved })
  return context
}
