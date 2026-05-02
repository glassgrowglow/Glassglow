// Grow Glow Journal - Minimal Service Worker
// PWA 설치 프롬프트(beforeinstallprompt) 발동 조건 충족용
// 캐싱은 하지 않음 (앱 동작에 영향 없음)

self.addEventListener('install', (event) => {
  // 즉시 활성화
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 모든 클라이언트에 즉시 적용
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 네트워크 그대로 통과 (캐시 없음)
  // fetch 핸들러 자체가 있어야 PWA 설치 가능 조건 충족
  return;
});
