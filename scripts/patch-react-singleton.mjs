/**
 * patch-react-singleton.mjs
 *
 * Runs after `vite build` to deduplicate React instances in the production bundle.
 *
 * Problem: When @trpc/react-query or other CJS packages are bundled without
 * pre-optimization, Rollup emits multiple `var ReactXxx = __toESM(require_react(), 1)`
 * declarations — one per module that imports React. Each call to require_react()
 * returns a fresh namespace object, so react-dom's dispatcher is set on one object
 * while hooks are called on another → "Cannot read properties of null (reading 'useState')".
 *
 * Fix: Replace all duplicate React var declarations with references to the first one.
 *
 * Targets: dist/public/assets/*.js (production Vite output)
 * Also checks: node_modules/.vite/deps/*.js (dev pre-bundle cache, if present)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Production build output (primary target)
const distDir = path.resolve(projectRoot, 'dist', 'public', 'assets');
// Dev pre-bundle cache (secondary target, may not exist)
const depsDir = path.resolve(projectRoot, 'node_modules', '.vite', 'deps');

function patchFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  if (!code.includes('__toESM(require_react(), 1)')) return false;

  let patchCount = 0;
  const patched = code.replace(
    /var (React[\w$]*) = __toESM\(require_react\(\), 1\);/g,
    (_match, varName) => {
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

function patchDir(dir, label) {
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));
  let total = 0;
  for (const f of files) {
    if (patchFile(path.join(dir, f))) total++;
  }
  if (total > 0) {
    console.log(`[react-singleton] ${label}: patched ${total} file(s)`);
  }
  return total;
}

const distTotal = patchDir(distDir, 'Production bundle (dist/public/assets)');
const depsTotal = patchDir(depsDir, 'Dev pre-bundle cache (node_modules/.vite/deps)');
const grandTotal = distTotal + depsTotal;

if (grandTotal > 0) {
  console.log(`[react-singleton] Total patched: ${grandTotal} file(s)`);
} else {
  console.log('[react-singleton] No duplicate React instances found — bundle is clean.');
}
