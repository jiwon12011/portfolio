/* =====================================================================
   mobile-home.js — 모바일 세로 전용 메인 (≤768px portrait)
   ---------------------------------------------------------------------
   확정 목업: 1페이지 세로 스크롤
     ① 히어로(풀블리드 = 기존 .scene 배경) + 워드마크 + 햄버거 + 자동회전 오빗 링
     ② 액션 칩 3개 (About / Projects / Contact)
     ③ 프로젝트 리스트 8개 (영상 썸네일 + 메타 + 제작과정 보기)
     ④ 푸터 (소셜 + 카피라이트)

   설계 메모
   · 데이터 단일 소스 = window.__introToc.projects (intro-toc.js PROJECTS).
   · 컨테이너는 항상 1회 빌드하되 CSS @media 로만 노출 → 회전(가로↔세로) 무비용 대응.
     데스크톱/태블릿에서는 display:none 이라 영상 IO 가 교차하지 않아 자동으로 휴면.
   · 영상: preload="none" + poster(thumb). IntersectionObserver 로 보이는 행만 재생,
     동시 재생 MAX_CONCURRENT 장으로 제한, 이탈 시 일시정지.
   · 카드 탭 → window.__processCtrl[key].open() (제작과정 직행). 닫으면 리스트 복귀.
   · orbit-mobile.js(드래그 다이얼)는 이 파일이 대체 → index.html 에서 미로드.

   ▼ 튜닝 상수 / 카피 — designer·perf 리뷰 시 이 블록만 조정
   ===================================================================== */
(() => {
  "use strict";

  /* ── 튜닝 상수 ─────────────────────────────────────────────────── */
  const RING_RADIUS    = 185;   // 오빗 링 반경(px). 카드 간 간격. (↑ 150→185: 카드 겹침↓, 간격↑)
  const RING_CARD_W    = 94;    // 오빗 카드 너비(px). (↓ 118→94: 카드 축소 → 인물 노출)
  const RING_PERSP     = 720;   // 링 perspective(px). (↑ 620→720: 원근 완화 → airy한 느낌)
  const MAX_CONCURRENT = 2;     // 리스트 영상 동시 재생 한도.
  const IO_MARGIN      = "120px 0px"; // 행 재생 판정 여유(위아래 선행 로드).

  /* ── 소셜 링크 (확인된 값만 실링크, 미확인은 TODO) ────────────────── */
  const SOCIAL = {
    github:    "https://github.com/jiwon12011",
    behance:   "https://www.behance.net/",          // TODO: 정확한 Behance 핸들 확인 후 교체
    instagram: "https://instagram.com/o1.12.o1",     // about 섹션과 동일
    mail:      "mailto:jiwon12011@gmail.com",
  };

  /* ── 프로젝트별 2줄 설명 + 타입 폴백 (확정 카피) ──────────────────── */
  const META = {
    yumi:      { type: "Personal", desc: ["감정을 세포로 풀어낸", "캐릭터 브랜딩"] },
    jaringobi: { type: "Team",     desc: ["절약을 게임처럼", "즐기게 만든 앱 서비스"] },
    gwihon:    { type: "Personal", desc: ["동양 판타지 무드의", "인터랙티브 프로모션 웹"] },
    mathhub:   { type: "Team",     desc: ["정보 구조를 다시 짠", "수학 학습 플랫폼"] },
    pledis:    { type: "Personal", desc: ["AI 워크플로우로 완성한", "엔터테인먼트 브랜딩"] },
    poze:      { type: "Personal", desc: ["여백으로 말하는", "미니멀 뷰티 브랜드"] },
    sangsang:  { type: "Team",     desc: ["문 너머 세계로 이끄는", "시네마틱 웹"] },
    playlist:  { type: "Personal", desc: ["선택이 노래가 되는", "멀티엔딩 비주얼노벨"] },
  };

  /* ── 게이트: 모바일 세로일 때만 의미. 다만 DOM 은 항상 빌드(회전 대응) ── */
  const MQ = matchMedia("(max-width:768px) and (orientation:portrait)");

  const projects = (window.__introToc && window.__introToc.projects) || null;
  if (!projects || !projects.length) return;  // 단일 소스 없으면 중단(로드 순서 보장됨)

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* 뱃지: 기존 메인 오빗 카드 .card__sub 텍스트 → Personal/Team. 없으면 META 폴백. */
  const badgeFor = (key) => {
    const sub = document.querySelector('.card-arm[data-card="' + key + '"] .card__sub');
    const t = sub ? sub.textContent.trim().toUpperCase() : "";
    if (t.includes("TEAM")) return "Team";
    if (t.includes("PERSONAL")) return "Personal";
    return (META[key] && META[key].type) || "Personal";
  };

  /* ───────────────────────────────────────────────────────────────
     마크업 빌드
  ─────────────────────────────────────────────────────────────── */
  const PLAY_SVG = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';

  /* 오빗에 올릴 항목 = 프로젝트 8 + ABOUT ME 카드 1(가운데 삽입) → 총 9. 장식(aria-hidden). */
  const aboutItem = { about: true, title: "ABOUT ME", lead: "디자인과 개발로 이야기를 만듭니다" };
  const ringItems = projects.slice();
  ringItems.splice(4, 0, aboutItem);
  const ANGLE_STEP = 360 / ringItems.length;

  const ringCardHTML = (it, i) => {
    const tf = 'translate(-50%,-50%) rotateY(' +
      (i * ANGLE_STEP).toFixed(2) + 'deg) translateZ(' + RING_RADIUS + 'px)';
    if (it.about) {
      return '<div class="mbh-orbit__card mbh-orbit__card--about" style="transform:' + tf + '">' +
        '<span class="mbh-ocard__name">' + esc(it.title) + '</span>' +
        '<span class="mbh-ocard__lead">' + esc(it.lead) + '</span>' +
        '<span class="mbh-ocard__more">VIEW MORE</span></div>';
    }
    return '<div class="mbh-orbit__card" style="transform:' + tf + '">' +
      '<div class="mbh-ocard__thumb">' +
        '<img src="' + esc(it.thumb) + '" alt="" loading="lazy" decoding="async" />' +
        '<span class="mbh-ocard__play">' + PLAY_SVG + '</span>' +
      '</div>' +
      '<div class="mbh-ocard__meta">' +
        '<span class="mbh-ocard__name">' + esc(it.title) + '</span>' +
        '<span class="mbh-ocard__type">' + badgeFor(it.key) + ' Project</span>' +
      '</div></div>';
  };
  const ringCardsHTML = ringItems.map(ringCardHTML).join("");

  /* 프로젝트 리스트 행 */
  const listHTML = projects.map((p) => {
    const m = META[p.key] || { desc: ["", ""] };
    const badge = badgeFor(p.key);
    const badgeMod = badge === "Team" ? "is-team" : "is-personal";
    return (
      '<li class="mbh-card" role="button" tabindex="0" data-go="' + esc(p.key) + '"' +
        ' aria-label="' + esc(p.title) + ' 제작과정 보기">' +
        '<div class="mbh-card__media">' +
          (p.preview
            ? '<video class="mbh-card__vid" muted loop playsinline preload="none"' +
                ' poster="' + esc(p.thumb) + '" data-src="' + esc(p.preview) + '"></video>'
            : '<img class="mbh-card__vid" src="' + esc(p.thumb) + '" alt="" loading="lazy" decoding="async" />') +
          '<span class="mbh-card__play" aria-hidden="true">' + PLAY_SVG + '</span>' +
        '</div>' +
        '<div class="mbh-card__body">' +
          '<div class="mbh-card__top">' +
            '<h3 class="mbh-card__title">' + esc(p.title) + '</h3>' +
            '<span class="mbh-card__kebab" aria-hidden="true">' +
              '<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg></span>' +
          '</div>' +
          '<span class="mbh-card__badge ' + badgeMod + '">' + esc(badge) + ' Project</span>' +
          '<p class="mbh-card__desc">' + esc(m.desc[0]) + '<br>' + esc(m.desc[1]) + '</p>' +
          '<div class="mbh-card__div" aria-hidden="true"></div>' +
          '<span class="mbh-card__cta">제작과정 보기' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' +
        '</div>' +
      '</li>'
    );
  }).join("");

  const root = document.createElement("div");
  root.className = "mobile-home";
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", "JIWON SEO 포트폴리오 — 모바일 메인");
  root.innerHTML =
    /* ① 히어로(둥근 이미지 블록) — 기존 메인 배경/인물 이미지 재사용 */
    '<header class="mbh-hero">' +
      '<img class="mbh-hero__img mbh-hero__img--bg" src="img/main/main_bg.webp" alt="" aria-hidden="true" decoding="async" />' +
      '<img class="mbh-hero__img mbh-hero__img--cha" src="img/main/main_cha.webp" alt="" aria-hidden="true" decoding="async" />' +
      '<div class="mbh-topbar">' +
        '<div class="mbh-wordmark">' +
          '<span class="mbh-wordmark__name">JIWON SEO</span>' +
          '<span class="mbh-wordmark__role">UI/UX · Web · Interactive</span>' +
        '</div>' +
        '<button class="mbh-menu" type="button" aria-label="메뉴 — About 열기">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="mbh-orbit" aria-hidden="true">' +
        '<span class="mbh-orbit__path mbh-orbit__path--a"></span>' +
        '<span class="mbh-orbit__path mbh-orbit__path--b"></span>' +
        '<span class="mbh-orbit__glow"></span>' +
        '<span class="mbh-orbit__dot mbh-orbit__dot--1"></span>' +
        '<span class="mbh-orbit__dot mbh-orbit__dot--2"></span>' +
        '<span class="mbh-orbit__dot mbh-orbit__dot--3"></span>' +
        '<div class="mbh-orbit__stage"><div class="mbh-orbit__ring">' + ringCardsHTML + '</div></div>' +
      '</div>' +
      '<div class="mbh-hero__foot">' +
        '<h1 class="mbh-headline">몰입을 설계하고,<br>경험을 완성합니다.</h1>' +
      '</div>' +
    '</header>' +
    /* ② 액션 칩 */
    '<nav class="mbh-chips" aria-label="바로가기">' +
      '<button class="mbh-chip" type="button" data-act="about">' +
        '<svg class="mbh-chip__ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>' +
        '<span class="mbh-chip__label">About Me</span>' +
        '<svg class="mbh-chip__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>' +
      '<button class="mbh-chip" type="button" data-act="marketing">' +
        '<svg class="mbh-chip__ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h3l5 4V6L7 10H4Z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg>' +
        '<span class="mbh-chip__label">Marketing</span>' +
        '<svg class="mbh-chip__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>' +
      '<button class="mbh-chip" type="button" data-act="banner">' +
        '<svg class="mbh-chip__ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10.5" r="1.5"/><path d="m21 16-4.5-4.5L9 18"/></svg>' +
        '<span class="mbh-chip__label">Banner</span>' +
        '<svg class="mbh-chip__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>' +
    '</nav>' +
    /* ③ 프로젝트 리스트 */
    '<section class="mbh-projects" id="mbh-projects" aria-label="프로젝트">' +
      '<h2 class="mbh-projects__title">PROJECTS</h2>' +
      '<ol class="mbh-list">' + listHTML + '</ol>' +
    '</section>' +
    /* ④ 푸터 */
    '<footer class="mbh-footer" id="mbh-footer">' +
      '<ul class="mbh-social">' +
        '<li><a href="' + SOCIAL.github + '" target="_blank" rel="noopener noreferrer" aria-label="GitHub">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg></a></li>' +
        '<li><a href="' + SOCIAL.behance + '" target="_blank" rel="noopener noreferrer" aria-label="Behance">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 7.3c.86 0 1.55.1 2.06.3.52.18.93.44 1.24.76.3.32.5.7.63 1.14.12.43.18.9.18 1.42 0 .6-.13 1.1-.4 1.5-.27.4-.68.74-1.22 1 .73.21 1.28.58 1.65 1.1.36.53.55 1.16.55 1.9 0 .6-.12 1.12-.35 1.55-.23.44-.55.8-.95 1.07-.4.28-.86.48-1.39.6-.52.13-1.06.2-1.6.2H2V7.3h6.2Zm-.37 4.86c.44 0 .8-.1 1.08-.32.28-.2.42-.55.42-1.02 0-.26-.05-.48-.14-.65a1.04 1.04 0 0 0-.4-.4 1.6 1.6 0 0 0-.57-.2 3.7 3.7 0 0 0-.68-.06H4.9v2.65h2.93Zm.16 5.1c.24 0 .47-.02.69-.07.21-.05.4-.13.56-.25.16-.11.29-.27.38-.46.1-.2.14-.45.14-.75 0-.6-.17-1.02-.5-1.28-.34-.25-.78-.38-1.34-.38H4.9v3.19h3.1ZM16.6 17c.37.36.9.54 1.6.54.5 0 .93-.13 1.3-.38.36-.25.58-.52.66-.8h2.2c-.35 1.1-.9 1.88-1.62 2.36-.73.47-1.6.7-2.63.7-.71 0-1.36-.11-1.93-.34a4.1 4.1 0 0 1-1.46-.97 4.3 4.3 0 0 1-.92-1.5 5.6 5.6 0 0 1-.32-1.94c0-.68.11-1.31.33-1.9.23-.58.54-1.09.95-1.51.4-.43.89-.76 1.45-1 .56-.24 1.18-.36 1.86-.36.76 0 1.42.15 1.98.44.57.3 1.03.68 1.4 1.17.36.48.62 1.04.78 1.66.16.62.21 1.27.16 1.95h-6.4c0 .7.24 1.22.62 1.58Zm2.83-4.3c-.3-.32-.74-.49-1.34-.49-.39 0-.71.07-.97.2-.26.13-.46.3-.62.49-.15.19-.26.39-.32.6-.06.2-.1.39-.11.55h3.96c-.06-.62-.27-1.03-.6-1.35ZM15.2 8.2h4.96v1.2H15.2V8.2Z"/></svg></a></li>' +
        '<li><a href="' + SOCIAL.instagram + '" target="_blank" rel="noopener noreferrer" aria-label="Instagram">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.62c-3.15 0-3.5.01-4.74.07-1.14.05-1.76.24-2.17.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.41-.35 1.03-.4 2.17-.06 1.24-.07 1.6-.07 4.74s.01 3.5.07 4.74c.05 1.14.24 1.76.4 2.17.22.55.47.94.88 1.35.41.41.8.66 1.35.88.41.16 1.03.35 2.17.4 1.24.06 1.6.07 4.74.07s3.5-.01 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.41.35-1.03.4-2.17.06-1.24.07-1.6.07-4.74s-.01-3.5-.07-4.74c-.05-1.14-.24-1.76-.4-2.17a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.17-.4-1.24-.06-1.6-.07-4.74-.07Zm0 2.76a5.46 5.46 0 1 1 0 10.92 5.46 5.46 0 0 1 0-10.92Zm0 9a3.54 3.54 0 1 0 0-7.08 3.54 3.54 0 0 0 0 7.08Zm6.95-9.22a1.28 1.28 0 1 1-2.55 0 1.28 1.28 0 0 1 2.55 0Z"/></svg></a></li>' +
        '<li><a href="' + SOCIAL.mail + '" aria-label="이메일 보내기">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></a></li>' +
      '</ul>' +
      '<p class="mbh-copy">&copy; 2025 JIWON SEO. All rights reserved.</p>' +
    '</footer>';

  /* 튜닝 상수 → CSS 변수(단일 소스: 이 파일) */
  root.style.setProperty("--mbh-persp", RING_PERSP + "px");
  root.style.setProperty("--mbh-ring-card-w", RING_CARD_W + "px");

  document.body.appendChild(root);
  document.documentElement.classList.toggle("is-mobile-home", MQ.matches);

  /* ───────────────────────────────────────────────────────────────
     동작 바인딩
  ─────────────────────────────────────────────────────────────── */
  /* 햄버거가 여는 About 패널(한 세로 스크롤·3섹션) 의 해당 섹션으로 오픈.
     anchor: resume(이력서) / marketing(마케팅) / projects(=배너 섹션, about.js 주석상 "프로젝트(배너)"). */
  const openAbout = (anchor) => { if (window.__aboutCtrl) window.__aboutCtrl.open(anchor || "resume"); };

  root.querySelector(".mbh-menu").addEventListener("click", () => openAbout("resume"));

  root.querySelectorAll(".mbh-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const act = chip.dataset.act;
      if (act === "about") openAbout("resume");
      else if (act === "marketing") openAbout("marketing");   // About 패널 → 마케팅 섹션
      else if (act === "banner") openAbout("projects");        // About 패널 → 배너(projects) 섹션
    });
  });

  /* 카드 탭/키보드 → 제작과정 직행 */
  const openProcess = (key) => {
    const ctrl = window.__processCtrl && window.__processCtrl[key];
    if (ctrl && ctrl.open) ctrl.open();
  };
  root.querySelectorAll(".mbh-card").forEach((card) => {
    card.addEventListener("click", () => openProcess(card.dataset.go));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProcess(card.dataset.go); }
    });
  });

  /* ───────────────────────────────────────────────────────────────
     리스트 영상 — 보이는 행만 재생, 동시 MAX_CONCURRENT, 이탈 시 정지
     display:none(데스크톱)에서는 교차가 발생하지 않아 자동 휴면.
  ─────────────────────────────────────────────────────────────── */
  const vids = [...root.querySelectorAll("video.mbh-card__vid")];
  if (vids.length && "IntersectionObserver" in window) {
    const playing = new Set();

    const ensureSrc = (v) => {
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
    };
    const play = (v) => {
      if (playing.has(v)) return;
      if (playing.size >= MAX_CONCURRENT) return;   // 동시 재생 한도
      ensureSrc(v);
      playing.add(v);
      const p = v.play();
      if (p && p.catch) p.catch(() => { playing.delete(v); }); // 자동재생 거부 안전 처리
    };
    const pause = (v) => {
      if (!playing.has(v) && v.paused) return;
      try { v.pause(); } catch (e) {}
      playing.delete(v);
    };

    /* 가시 행을 화면 중앙에 가까운 순으로 정렬 → 상위 MAX_CONCURRENT 만 재생.
       먼저 keep 밖의 재생을 멈춘 뒤(슬롯 비움) 상위를 재생 → 한도 정확히 준수. */
    let visible = new Set();
    const reconcile = () => {
      const ordered = [...visible].sort((a, b) => {
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const mid = window.innerHeight / 2;
        return Math.abs((ra.top + ra.bottom) / 2 - mid) - Math.abs((rb.top + rb.bottom) / 2 - mid);
      });
      const keep = new Set(ordered.slice(0, MAX_CONCURRENT));
      playing.forEach((v) => { if (!keep.has(v)) pause(v); });
      keep.forEach(play);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) visible.add(e.target);
        else { visible.delete(e.target); pause(e.target); }
      });
      reconcile();
    }, { rootMargin: IO_MARGIN, threshold: 0.35 });

    vids.forEach((v) => io.observe(v));

    /* 탭 백그라운드 / 제작과정·About 오픈 시 전부 정지(배터리·디코드 절약) */
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) playing.forEach(pause);
      else reconcile();
    });
  }

  /* 미디어쿼리 변화(회전) → 클래스 동기화. 세로 진입 시 영상 상태 재조정은 IO 가 처리 */
  const onMQ = () => document.documentElement.classList.toggle("is-mobile-home", MQ.matches);
  if (MQ.addEventListener) MQ.addEventListener("change", onMQ);
  else if (MQ.addListener) MQ.addListener(onMQ);
})();
