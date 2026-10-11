import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { brotliCompressSync, gzipSync } from 'node:zlib';
const root=resolve('out'),toml=await readFile(new URL('../../netlify.toml',import.meta.url),'utf8');
const blocks=toml.split('[[headers]]').slice(1).map(block => ({ pattern: block.match(/for\s*=\s*"([^"]+)"/)[1], values: Object.fromEntries([...block.matchAll(/^\s*([\w-]+)\s*=\s*"([^"]*)"/gm)].filter(m => m[1] !== 'for').map(m => [m[1],m[2]])) }));
const types={ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.glb': 'model/gltf-binary' };
http.createServer(async(req,res) => {
  try {
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),headers={};
    for (const block of blocks) if (block.pattern.endsWith('*') ? path.startsWith(block.pattern.slice(0,-1)) : path === block.pattern) Object.assign(headers,block.values);
    let file=resolve(root,'.'+(path === '/' ? '/index.html' : path));
    if (file !== root && !file.startsWith(root+sep)) { res.writeHead(403); res.end(); return; }
    let found=false;
    for (const candidate of [file,file+'.html',resolve(file,'index.html')]) { try { if ((await stat(candidate)).isFile()) { file=candidate; found=true; break; } } catch {} }
    if (!found) { res.writeHead(404,headers); res.end('Not found'); return; }
    const type=types[extname(file)] || 'application/octet-stream'; let body=await readFile(file);
    if (/text|json|xml|svg/.test(type)) { const encoding=req.headers['accept-encoding'] || ''; if (encoding.includes('br')) { body=brotliCompressSync(body); headers['Content-Encoding']='br'; } else if (encoding.includes('gzip')) { body=gzipSync(body); headers['Content-Encoding']='gzip'; } headers.Vary='Accept-Encoding'; }
    res.writeHead(200,{ ...headers,'Content-Type':type,'Content-Length':body.length }); res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(500); res.end('Server error'); }
}).listen(Number(process.env.PORT || 4173),'127.0.0.1',() => console.log('Static export: http://127.0.0.1:'+ (process.env.PORT || 4173)));
