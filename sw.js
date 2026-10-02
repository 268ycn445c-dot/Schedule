// Offline support. Bump VERSION whenever the app shell files change.
var VERSION = "v1";
var SHELL_CACHE = "yotei-shell-" + VERSION;
var RUNTIME_CACHE = "yotei-runtime-v1";   // symbols + Firebase SDK; survives shell updates
var SHELL = ["./", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(SHELL_CACHE).then(function(c){ return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){
      if(k !== SHELL_CACHE && k !== RUNTIME_CACHE) return caches.delete(k);
    }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);

  // the page itself: network first so updates show up, cache when offline
  if(req.mode === "navigate"){
    e.respondWith(fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(SHELL_CACHE).then(function(c){ c.put("./", copy); });
      return res;
    }).catch(function(){ return caches.match("./"); }));
    return;
  }

  // Drops symbols and the Firebase SDK never change: cache first
  var sameOrigin = url.origin === self.location.origin;
  var isSdk = url.hostname === "www.gstatic.com" && url.pathname.indexOf("/firebasejs/") === 0;
  if((sameOrigin && url.pathname.indexOf("/symbols/") > -1) || isSdk){
    e.respondWith(caches.open(RUNTIME_CACHE).then(function(c){
      return c.match(req).then(function(hit){
        return hit || fetch(req).then(function(res){
          if(res.ok || res.type === "opaque") c.put(req, res.clone());
          return res;
        });
      });
    }));
    return;
  }

  if(sameOrigin){
    e.respondWith(caches.match(req).then(function(hit){ return hit || fetch(req); }));
  }
  // everything else (Firestore, Google sign-in) goes straight to the network
});
