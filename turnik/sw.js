/* bodytur: offline caching, prefer latest published version */
const CACHE='bodytur-neon-icon-v4';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-bodytur-192.png','./icon-bodytur-512.png','./guide.js','./guide.css','./coach.js','./coach.css'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  try{
   const response=await fetch(req);
   if(response.ok){const cache=await caches.open(CACHE);cache.put(req,response.clone()).catch(()=>{});}
   return response;
  }catch(_){
   const cached=await caches.match(req);
   if(cached)return cached;
   if(req.mode==='navigate')return (await caches.match('./index.html'))||Response.error();
   return Response.error();
  }
 })());
});
