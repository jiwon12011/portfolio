/* =======================================================================
   intro-toc.js — 인트로 우측 PROJECTS 목차를 "순환 캐러셀"로 렌더
   -----------------------------------------------------------------------
   · 단일 데이터(PROJECTS) 한 곳에서 관리 → 프로젝트 추가는 배열에 한 줄.
   · 각 인트로 패널의 목차를 "그 패널 프로젝트가 가운데인 5칸 순환창"으로 렌더.
     예) 자린고비(01) 패널 → 위에서 아래로 04 05 [01] 02 03 (wrap).
   · 5개 미만이면 순환 없이 전체 표시(현재 강조). 5개 이상이면 5칸 wrap.
   · data-go / .intro-list__item 마크업을 그대로 써서 deck.js 의 클릭·syncIntro
     (패널 안 data-go===프로젝트 → is-active)가 그대로 동작.
   · 호버 시 썸네일 살짝 확대(CSS). 영상 미리보기는 2단계(경량 클립 준비 후).
   · deck.js 보다 먼저 로드 → deck 의 [data-go] 바인딩이 렌더된 항목을 잡음.
======================================================================= */
(() => {
  /* ▼ 프로젝트 추가는 여기 한 줄. 순서 = 목차 순환 순서 */
  const PROJECTS = [
    { key: "jaringobi", num: "01", title: "자린고비",      sub: "Branding / 2025", thumb: "img/main/main_jaringobi.webp" },
    { key: "gwihon",    num: "02", title: "귀혼",          sub: "UXUI / 2025",     thumb: "img/main/main_hon.webp" },
    { key: "pledis",    num: "03", title: "플레디스",      sub: "Branding / 2025", thumb: "img/main/main_pledis.webp" },
    { key: "yumi",      num: "04", title: "유미의 세포들", sub: "Branding / 2024", thumb: "img/main/main_yumi.webp" },
    { key: "poze",      num: "05", title: "POZE",          sub: "Branding / 2024", thumb: "img/main/main_poze.webp" },
  ];

  const N = PROJECTS.length;
  const SLOTS = Math.min(5, N);            // 보일 칸 수(최대 5)
  const HALF = Math.floor(SLOTS / 2);      // 위/아래 개수(5 → 2)

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const itemHTML = (p, slot, active) =>
    '<li class="intro-list__item' + (active ? " is-active" : "") + '" data-go="' + p.key + '" data-slot="' + slot + '">' +
      '<img src="' + p.thumb + '" alt="" loading="lazy" />' +
      "<div><span>" + esc(p.num) + "</span><h4>" + esc(p.title) + "</h4><p>" + esc(p.sub) + "</p></div>" +
      '<span class="intro-list__eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
    "</li>";

  const renderFor = (cur) => {
    let html = "";
    if (N >= 5) {                          // 순환 5칸 — 현재 가운데
      for (let off = -HALF; off <= HALF; off++) {
        const idx = (cur + off + N) % N;
        html += itemHTML(PROJECTS[idx], off, off === 0);
      }
    } else {                               // 5개 미만 — 전체(현재만 강조, 거리 slot)
      for (let i = 0; i < N; i++) html += itemHTML(PROJECTS[i], i - cur, i === cur);
    }
    return html;
  };

  document.querySelectorAll(".project-intro.deck-panel").forEach((panel) => {
    const ul = panel.querySelector(".intro-list ul");
    if (!ul) return;
    const cur = PROJECTS.findIndex((p) => p.key === panel.dataset.project);
    if (cur < 0) return;
    ul.innerHTML = renderFor(cur);
  });
})();
