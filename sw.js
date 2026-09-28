/* Offline service worker for the e-book reader */
const VERSION='v5';
const CACHE='ebook-police-nco-2569-'+VERSION;
const ASSETS=['./','./index.html','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./lessons.json'];
self.addEventListener('install',e=>{
  // bypass the HTTP cache so a new version never precaches stale files
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('ebook-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting()});
function fromNetwork(req,timeout){
  return new Promise((res,rej)=>{
    const t=setTimeout(()=>rej(new Error('timeout')),timeout);
    fetch(req,{cache:'no-cache'}).then(r=>{clearTimeout(t);if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp))}res(r)},err=>{clearTimeout(t);rej(err)});
  });
}
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET')return;
  const url=new URL(req.url); if(url.origin!==location.origin)return;
  if(req.mode==='navigate'){
    // network-first (fresh version when online), cached copy when offline / slow
    e.respondWith(fromNetwork(req,4000).catch(()=>caches.match('./index.html',{ignoreSearch:true})));
    return;
  }
  if(url.pathname.endsWith('/lessons.json')){
    // editable data: network-first, cached copy offline
    e.respondWith(fetch(req,{cache:'no-cache'}).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put('./lessons.json',cp))}return r}).catch(()=>caches.match('./lessons.json',{ignoreSearch:true})));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{
    if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp))}return res;
  })));
});
