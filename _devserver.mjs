/* 로컬 개발용 정적 서버 — Range(206) + Cache-Control + keep-alive 지원.
   Python http.server가 Range를 무시해 영상이 끊기는 문제 해결용.
   실행: node _devserver.mjs   (http://localhost:8765)  · 배포와 무관한 dev 전용 */
import http from 'http';
import { createReadStream, statSync, existsSync } from 'fs';
import { extname, join, normalize } from 'path';

const ROOT = normalize('C:/Users/Administrator/portfolio');
const PORT = Number(process.env.PORT) || 8765;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  let fp = normalize(join(ROOT, urlPath));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (!existsSync(fp)) { res.writeHead(404); return res.end('404'); }
  let st = statSync(fp);
  if (st.isDirectory()) {
    fp = join(fp, 'index.html');
    if (!existsSync(fp)) { res.writeHead(404); return res.end(); }
    st = statSync(fp);
  }
  const type = MIME[extname(fp).toLowerCase()] || 'application/octet-stream';
  const base = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=3600' };
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
    let start = m[1] ? parseInt(m[1], 10) : 0;
    let end = m[2] ? parseInt(m[2], 10) : st.size - 1;
    if (isNaN(start) || start < 0) start = 0;
    if (isNaN(end) || end >= st.size) end = st.size - 1;
    if (start > end) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); return res.end(); }
    res.writeHead(206, { ...base, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
    if (req.method === 'HEAD') return res.end();
    createReadStream(fp, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { ...base, 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    createReadStream(fp).pipe(res);
  }
}).listen(PORT, '127.0.0.1', () => console.log(`dev server (range+cache) on http://localhost:${PORT}`));
