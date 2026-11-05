import type { OutgoingHttpHeaders } from 'node:http';
import { constants, createBrotliCompress } from 'node:zlib';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig, type Plugin } from 'vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import {
  layerwise,
  layerwiseEmailWorker,
  layerwiseStorageWorker
} from '@layerwise/vite';

/**
 * `vite preview` sends files uncompressed, while Cloudflare compresses text
 * responses at the edge. Compress them in the preview too, so a Lighthouse run
 * against `pnpm preview` measures what visitors download. Preview only; the
 * dev server and the deployed Worker are unaffected.
 */
function previewCompression(): Plugin {
  const compressible = /^(text\/|application\/(javascript|json|xml|manifest\+json)|image\/svg)/;
  return {
    name: 'preview-compression',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!/\bbr\b/.test(String(req.headers['accept-encoding'] ?? ''))) return next();
        const writeHead = res.writeHead.bind(res) as (status: number, headers?: OutgoingHttpHeaders) => typeof res;
        const write = res.write.bind(res) as (chunk: unknown) => boolean;
        const end = res.end.bind(res) as () => typeof res;
        let brotli: ReturnType<typeof createBrotliCompress> | null = null;
        res.writeHead = ((status: number, headers: OutgoingHttpHeaders = {}) => {
          const type = String(headers['content-type'] ?? res.getHeader('content-type') ?? '');
          if (compressible.test(type) && !headers['content-encoding'] && req.method !== 'HEAD' && status !== 204 && status !== 304) {
            delete headers['content-length'];
            res.removeHeader('content-length');
            headers['content-encoding'] = 'br';
            headers.vary = 'accept-encoding';
            brotli = createBrotliCompress({ params: { [constants.BROTLI_PARAM_QUALITY]: 5 } });
            brotli.on('data', (chunk) => write(chunk));
            brotli.on('end', () => end());
          }
          return writeHead(status, headers);
        }) as typeof res.writeHead;
        res.write = ((chunk: unknown) => {
          if (!brotli) return write(chunk);
          const ok = brotli.write(chunk as Buffer);
          // Callers wait for 'drain' on the response when a write returns false.
          if (!ok) brotli.once('drain', () => res.emit('drain'));
          return ok;
        }) as typeof res.write;
        res.end = ((chunk?: unknown) => {
          if (!brotli) return chunk === undefined || typeof chunk === 'function' ? end() : (write(chunk), end());
          if (chunk !== undefined && typeof chunk !== 'function') brotli.end(chunk as Buffer);
          else brotli.end();
          return res;
        }) as typeof res.end;
        next();
      });
    }
  };
}

export default defineConfig({
  server: {
    host: process.env.HOSTNAME || '127.0.0.1',
    watch: {
      ignored: [
        '**/.layerwise/**',
        '**/.local/**',
        '**/.tanstack/**',
        '**/.wrangler/**',
        '**/dist/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@tanstack/start': '@tanstack/react-start'
    },
    tsconfigPaths: true
  },
  plugins: [
    previewCompression(),
    layerwise(),
    tailwindcss(),
    cloudflare({
      viteEnvironment: { name: 'ssr' },
      auxiliaryWorkers: [layerwiseStorageWorker(), layerwiseEmailWorker()]
    }),
    // Inline the stylesheet into each page's HTML in production builds, so
    // the first paint doesn't wait on a separate CSS request.
    tanstackStart({ server: { build: { inlineCss: true } } }),
    viteReact()
  ]
});
