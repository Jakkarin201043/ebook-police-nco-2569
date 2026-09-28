/* Offline service worker for the e-book reader */
const CACHE='ebook-police-nco-2569-v1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET')return;
  const url=new URL(req.url); if(url.origin!==location.origin)return;
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>{
    if(hit)return hit;
    return fetch(req).then(res=>{ if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp))} return res; })
      .catch(()=>req.mode==='navigate'?caches.match('./index.html'):Response.error());
  }));
});
