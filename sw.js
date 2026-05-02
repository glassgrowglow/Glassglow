// Grow Glow Journal - Service Worker (오프라인 동작 지원)
// 캐시 전략:
//   - HTML/JS/CSS/이미지/manifest 등 정적 자산을 캐싱
//   - 네트워크 우선 → 실패 시 캐시 (Network-First)
//   - 그래야 코드 업데이트가 자연스럽게 반영되면서도, 오프라인일 때 동작함

const CACHE_VERSION = 'ggj-v1.0.0';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

// install: 핵심 파일들 미리 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(err => {
        // 일부 파일이 없어도 install은 진행되도록
        console.log('[SW] precache 일부 실패 (무시):', err);
      }))
      .then(() => self.skipWaiting())
  );
});

// activate: 옛 캐시 삭제
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// fetch: Network-First 전략
self.addEventListener('fetch', (event) => {
  // GET 요청만 처리 (POST 등은 통과)
  if (event.request.method !== 'GET') return;

  // chrome-extension:// 같은 외부 스킴 무시
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 다른 도메인 요청은 통과 (캐시 안 함)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 정상 응답이면 캐시 업데이트
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 → 캐시에서 찾기
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // 캐시에도 없으면 index.html (SPA fallback)
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          // 그래도 없으면 그냥 에러
          return new Response('오프라인이고 캐시에도 없어요', {
            status: 503,
            statusText: 'Offline',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          });
        });
      })
  );
});
