/* 전장도면 대시보드 — 알림 서비스 워커 (v1.10.25, 서버 v9 웹 푸시)
 * 서버는 FCM 'data' 메시지만 보냄 {title, body, link, tag} → 여기서 직접 알림 표시 (대시보드가 열려 있어도 표시).
 * 알림을 누르면 열려 있는 대시보드 창으로 가서 피드백 화면을 열고, 없으면 새 창(#fb)으로 연다.
 * 이 파일에는 비밀 값이 없음 (공개 저장소에 그대로 배포). Firebase SDK 없이 표준 Push API 만 사용.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let p = {};
  try { p = e.data ? e.data.json() : {}; } catch (x) { p = { body: e.data ? e.data.text() : "" }; }
  const d = (p && (p.data || p.notification)) || p || {};          // FCM data 메시지 = { data: {...}, from, ... }
  const title = String(d.title || "전장도면 대시보드");
  e.waitUntil(self.registration.showNotification(title, {
    body: String(d.body || ""), tag: String(d.tag || "elec"), renotify: true,
    icon: "icon-192.png", badge: "icon-badge.png", data: { link: String(d.link || "./#fb") },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const scope = self.registration.scope;
  let url = scope + "#fb";
  try { const u = new URL((e.notification.data || {}).link || "./#fb", scope); if (u.href.startsWith(scope)) url = u.href; } catch (x) { /* 기본값 */ }
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of list) {
      if (c.url.startsWith(scope)) { c.postMessage({ type: "elec-open-fb" }); return c.focus(); }
    }
    return self.clients.openWindow(url);
  })());
});
