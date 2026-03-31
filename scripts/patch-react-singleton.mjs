import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const depsDir = path.resolve(__dirname, '..', 'node_modules', '.vite', 'deps');

function patchFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  if (!code.includes('__toESM(require_react(), 1)')) return false;
  let patchCount = 0;
  const patched = code.replace(
    /var (React[\w$]*) = __toESM\(require_react\(\), 1\);/g,
    (match, varName) => {
      patchCount++;
      if (patchCount === 1) {
        return `var __sharedReact = __toESM(require_react(), 1);\nvar ${varName} = __sharedReact;`;
      }
      return `var ${varName} = __sharedReact;`;
    }
  );
  if (patchCount > 1) {
    fs.writeFileSync(filePath, patched, 'utf8');
    console.log(`[react-singleton] Patched: ${path.basename(filePath)} (${patchCount} React vars -> 1 shared)`);
    return true;
  }
  return false;
}

if (!fs.existsSync(depsDir)) {
  // Deps not built yet — nothing to patch
  process.exit(0);
}

const files = fs.readdirSync(depsDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));
let total = 0;
for (const f of files) {
  if (patchFile(path.join(depsDir, f))) total++;
}
if (total > 0) {
  console.log(`[react-singleton] Total patched: ${total} file(s)`);
}
