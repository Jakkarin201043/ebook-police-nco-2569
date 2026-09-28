/* Offline service worker for the e-book reader */
const VERSION='v6';
const CACHE='ebook-police-nco-2569-'+VERSION;
const ASSETS=['./','./index.html','./videos.html','./manifest.webmanifest','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./icon-maskable-512.png','./lessons.json'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('ebook-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting()});
function fromNetwork(req,timeout,cacheAs){
  return new Promise((res,rej)=>{
    const t=setTimeout(()=>rej(new Error('timeout')),timeout);
    fetch(req,{cache:'no-cache'}).then(r=>{clearTimeout(t);if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(cacheAs||req,cp))}res(r)},err=>{clearTimeout(t);rej(err)});
  });
}
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET')return;
  const url=new URL(req.url); if(url.origin!==location.origin)return;
  if(req.mode==='navigate'){
    const path=url.pathname;
    const isVideos=/\/videos\.html$/.test(path)||/\/videos\/?$/.test(path);
    const fallback=isVideos?'./videos.html':'./index.html';
    e.respondWith(fromNetwork(req,4000,fallback).catch(()=>caches.match(fallback,{ignoreSearch:true}).then(r=>r||caches.match('./index.html',{ignoreSearch:true}))));
    return;
  }
  if(url.pathname.endsWith('/lessons.json')){
    e.respondWith(fetch(req,{cache:'no-cache'}).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put('./lessons.json',cp))}return r}).catch(()=>caches.match('./lessons.json',{ignoreSearch:true})));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{
    if(res&&res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp))}return res;
  })));
});
