import { build as esbuildBuild, context as esbuildContext } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const srcPluginsDir = path.join(rootDir, 'src-plugins');
const distPluginsDir = path.join(rootDir, 'dist-plugins');

const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const minify = !args.includes('--no-minify');
const verbose = args.includes('--verbose');

/**
 * 发现 src-plugins 下的所有插件。
 * 每个插件是 src-plugins/<插件名>/index.ts, 产物输出到 dist-plugins/<插件名>/index.cjs。
 * 目录形态保证多插件共存互不干扰: 部署时将整个 dist-plugins/<插件名>/ 文件夹复制到
 * SillyTavern 的 plugins/ 目录, loader 按 index.js -> index.cjs -> index.mjs 的顺序查找。
 * (.cjs 扩展名保证在任何 package.json type 下都按 CommonJS 解析)
 *
 * @returns {Array<{ name: string; entry: string; outfile: string }>}
 */
function discoverPlugins() {
  if (!fs.existsSync(srcPluginsDir)) {
    return [];
  }

  const entries = fs
    .readdirSync(srcPluginsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .sort();

  /** @type {Array<{ name: string; entry: string; outfile: string }>} */
  const plugins = [];
  for (const name of entries) {
    const entry = path.join(srcPluginsDir, name, 'index.ts');
    if (fs.existsSync(entry)) {
      plugins.push({
        name,
        entry,
        outfile: path.join(distPluginsDir, name, 'index.cjs'),
      });
    } else if (verbose) {
      console.warn(`[build-plugins] Skipped '${name}': missing ${path.relative(rootDir, entry)}`);
    }
  }

  return plugins;
}

function createBuildOptions(plugin) {
  return {
    entryPoints: [plugin.entry],
    outfile: plugin.outfile,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    // nekoai-js 通过动态 import 引用可选依赖 canvas; 保持外部引用, 未安装时其内部有 catch 兜底
    external: ['canvas'],
    minify,
    sourcemap: false,
    logLevel: isWatch ? 'info' : 'warning',
    metafile: true,
  };
}

async function buildPlugin(plugin) {
  const startedAt = performance.now();
  await esbuildBuild(createBuildOptions(plugin));
  const stat = fs.statSync(plugin.outfile);
  const sizeKb = (stat.size / 1024).toFixed(1);
  console.log(
    `[build-plugins] ${plugin.name} -> ${path.relative(rootDir, plugin.outfile)} (${sizeKb} KB, ${Math.round(performance.now() - startedAt)}ms)`,
  );
}

async function main() {
  const plugins = discoverPlugins();
  if (plugins.length === 0) {
    console.log('[build-plugins] No plugins found under src-plugins.');
    return;
  }

  for (const plugin of plugins) {
    await buildPlugin(plugin);
  }

  if (isWatch) {
    console.log('[build-plugins] Watching for changes...');
    const contexts = [];
    for (const plugin of plugins) {
      const context = await esbuildContext(createBuildOptions(plugin));
      await context.watch();
      contexts.push(context);
    }
    process.on('SIGINT', async () => {
      for (const context of contexts) {
        await context.dispose();
      }
      process.exit(0);
    });
  }
}

await main();
