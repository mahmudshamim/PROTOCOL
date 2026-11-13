import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// `--mode webgpu` swaps the whole app onto the three/webgpu build, so loaders and
// materials share one copy of the library with WebGPURenderer.
export default defineConfig(({ mode }) => ({
  resolve: {
    alias: [
      { find: '#post', replacement: path.resolve(mode === 'webgpu' ? 'post-webgpu.js' : 'post-webgl.js') },
      ...(mode === 'webgpu' ? [{ find: /^three$/, replacement: 'three/webgpu' }] : []),
    ],
  },
  cacheDir: `node_modules/.vite-${mode}`, // each mode pre-bundles a different three build
  build: { target: 'esnext' },
  plugins: [
    {
      name: 'save-results',
      configureServer(server) {
        server.middlewares.use('/__result', (req, res) => {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            const d = JSON.parse(body);
            if (!/^[a-z0-9-]+$/.test(d.name)) { res.statusCode = 400; return res.end('bad name'); }
            const dir = path.resolve('results');
            fs.mkdirSync(dir, { recursive: true });
            if (d.image) { fs.writeFileSync(path.join(dir, d.name + '.jpg'), Buffer.from(d.image.split(',')[1], 'base64')); delete d.image; }
            fs.writeFileSync(path.join(dir, d.name + '.json'), JSON.stringify(d, null, 2));
            res.end('ok');
          });
        });
      },
    },
  ],
}));
