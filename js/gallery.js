/* =======================================================================
   gallery.js — VISUAL ARCHIVE(ABOUT 프로젝트 섹션) 배너 갤러리
   · 데스크톱(hover+fine) + non-reduce: CSS sticky + RAF scroll 직결
     ScrollTrigger 완전 제거 — lerp↔pin-transform 이중충돌(judder) 차단
   · 터치/reduce: 네이티브 가로 스냅(scroll-snap)
   · 클릭 → 라이트박스(크게 보기 + 이전/다음 + Esc/배경 닫기)
======================================================================= */
(() => {
  const grid = document.getElementById("banner-grid");
  if (!grid) return;

  /* 배너 데이터 */
  const BANNERS = [
    { src: "img/banner/promo-spring.webp",       cap: "봄 프로모션 배너",     ar: "4/5" },
    { src: "img/banner/promo-summer.webp",       cap: "여름 프로모션 배너",   ar: "4/5" },
    { src: "img/banner/promo-fall.webp",         cap: "가을 프로모션 배너",   ar: "4/5" },
    { src: "img/banner/promo-winter.webp",       cap: "겨울 프로모션 배너",   ar: "4/5" },
    { src: "img/banner/radio.webp",              cap: "박보검 라디오",        ar: "4/5" },
    { src: "img/banner/bagel.webp",              cap: "치즈 베이글",          ar: "4/5" },
    { src: "img/banner/poster-drunk.webp",       cap: "만취남녀",            ar: "7/10" },
    { src: "img/banner/poster-garbagetime.webp", cap: "가비지타임",          ar: "7/10" },
  ];
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  /* ── 마크업: banner-track 래퍼 안에 banner-item 렌더 ── */
  const track = document.createElement("div");
  track.className = "banner-track";
  track.innerHTML = BANNERS.map((b, i) =>
    '<button class="banner-item" type="button" data-i="' + i + '" style="aspect-ratio:' + b.ar + '" aria-label="' + esc(b.cap) + ' 크게 보기">' +
      '<img src="' + b.src + '" alt="' + esc(b.cap) + '" loading="lazy" />' +
      '<span class="banner-item__cap">' + esc(b.cap) + '</span>' +
    '</button>').join("");
  grid.appendChild(track);

  const countEl = document.getElementById("banner-count");
  if (countEl) countEl.textContent = BANNERS.length + " banners";

  /* ── 환경 체크 ── */
  const reduce    = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktop = () => matchMedia("(hover:hover) and (pointer:fine)").matches;
  const scroller  = document.querySelector(".about__scroll");
  const galSection = document.querySelector(".about__section--gallery");
  const items     = [...grid.querySelectorAll(".banner-item")];

  /* ── 핀 상태 (ScrollTrigger 없이 커스텀 핸들러 객체) ── */
  let pinST = null;

  /* ──────────────────────────────────────────────────────────────────
     initPin — CSS sticky + scroll→translateX 직결
     · .banner-viewport (sticky, 100svh) 를 galSection 에 삽입
     · galSection.height = 100svh + distance → 그만큼 세로 스크롤 여지
     · scroll 이벤트에서 getBoundingClientRect 로 progress 계산 → track 이동
     · ScrollTrigger/scrub 완전 제거 → lerp 이중충돌 원천 차단
  ────────────────────────────────────────────────────────────────── */
  const initPin = () => {
    if (!scroller || !galSection) return;
    if (pinST) { pinST.kill(); pinST = null; }

    grid.classList.add("is-pinned");
    grid.classList.remove("is-native");
    items.forEach((it) => { it.classList.add("is-in"); it.style.transitionDelay = ""; });
    galSection.classList.add("has-pin");

    /* ── DOM 재구성: .banner-viewport (sticky 컨테이너) 생성 — 최초 1회 ── */
    let viewport = galSection.querySelector(".banner-viewport");
    if (!viewport) {
      viewport = document.createElement("div");
      viewport.className = "banner-viewport";
      /* eyebrow → viewport 안으로 (sticky 구간에서도 표시 유지) */
      const eyebrow = galSection.querySelector(":scope > .about__eyebrow");
      if (eyebrow) viewport.appendChild(eyebrow);
      /* banner-wrap(제목) → viewport 안으로 */
      const bannerWrap = galSection.querySelector(".banner-wrap");
      if (bannerWrap) viewport.appendChild(bannerWrap);
      /* grid → viewport 안에 banner-wrap 형제로 (풀폭 확보) */
      viewport.appendChild(grid);
      galSection.appendChild(viewport);
    } else {
      /* 재오픈: grid 위치 보장 */
      if (!viewport.contains(grid)) viewport.appendChild(grid);
    }

    /* ── 거리 계산: 트랙 총폭 − viewport 표시폭 ── */
    const getDistance = () => track.scrollWidth - viewport.clientWidth;

    /* ── 섹션 높이: 한 뷰포트(sticky) + 가로 스크롤 거리 ── */
    const updateHeight = () => {
      const dist = getDistance();
      galSection.style.height = "calc(100svh + " + dist + "px)";
    };
    updateHeight();

    /* ── scroll → translateX 직결 (lerp 이후 scrollTop을 1:1 반영) ── */
    let rafPending = false;
    const applyTransform = () => {
      const sRect = galSection.getBoundingClientRect();
      const cRect = scroller.getBoundingClientRect();
      /* relTop: 0 = 갤러리 진입, -(dist) = 가로 스크롤 완료 */
      const relTop = sRect.top - cRect.top;
      const dist = getDistance();
      if (dist <= 0) return;
      const progress = Math.min(Math.max(-relTop / dist, 0), 1);
      track.style.transform = "translateX(" + (-progress * dist).toFixed(1) + "px)";
    };
    const onScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => { rafPending = false; applyTransform(); });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });

    /* ── 리사이즈 → 높이·거리 재계산 ── */
    let resizeTimer = null;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { updateHeight(); applyTransform(); }, 120);
    };
    window.addEventListener("resize", onResize);

    /* ── 정리 핸들러 (재오픈 시 기존 구독 제거) ── */
    pinST = {
      kill: () => {
        scroller.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        clearTimeout(resizeTimer);
        galSection.style.height = "";
        track.style.transform = "";
        pinST = null;
      },
      refresh: () => { updateHeight(); applyTransform(); },
    };
  };

  /* ── 네이티브 가로 스냅(터치/reduce) ── */
  const initNative = () => {
    if (pinST) { pinST.kill(); pinST = null; }
    galSection.classList.remove("has-pin");
    galSection.style.height = "";
    grid.classList.add("is-native");
    grid.classList.remove("is-pinned");
    items.forEach((it) => { it.classList.add("is-in"); it.style.transitionDelay = ""; });
  };

  /* ── about:open 이벤트 수신 — 열릴 때마다 모드 결정 ── */
  window.addEventListener("about:open", () => {
    if (!reduce() && isDesktop()) {
      /* morphOpen 640ms + 레이아웃 정착 여유 → 720ms 후 핀 생성 */
      setTimeout(initPin, 720);
      /* 이미지 로드 등 추가 정착 후 높이 재계산 */
      setTimeout(() => { if (pinST) pinST.refresh(); }, 1100);
    } else {
      initNative();
    }
  });

  /* ── 초기 기본 상태(About 오픈 전: display:none이라 보이지 않음) ── */
  if (reduce() || !isDesktop()) {
    initNative();
  } else {
    /* 데스크톱: about:open 때까지 네이티브 대기 */
    grid.classList.add("is-native");
    items.forEach((it) => it.classList.add("is-in"));
  }

  /* ── 라이트박스 ── */
  const lb = document.createElement("div");
  lb.className = "banner-lb";
  lb.setAttribute("aria-hidden", "true");
  lb.innerHTML =
    '<button class="banner-lb__btn banner-lb__close" type="button" aria-label="닫기"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    '<button class="banner-lb__btn banner-lb__prev" type="button" aria-label="이전"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
    '<button class="banner-lb__btn banner-lb__next" type="button" aria-label="다음"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>' +
    '<figure class="banner-lb__fig"><img alt="" /><figcaption class="banner-lb__cap"></figcaption></figure>';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector("img");
  const lbCap = lb.querySelector(".banner-lb__cap");
  let cur = -1;

  const show = (i) => {
    cur = (i + BANNERS.length) % BANNERS.length;
    lbImg.src = BANNERS[cur].src;
    lbImg.alt = BANNERS[cur].cap;
    lbCap.textContent = BANNERS[cur].cap;
  };
  const openLb = (i) => {
    show(i);
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("lb-open");
  };
  const closeLb = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("lb-open");
    cur = -1;
  };

  /* 위임 클릭 — 트랙 래퍼가 생겨도 정상 동작 */
  grid.addEventListener("click", (e) => {
    const item = e.target.closest(".banner-item");
    if (item) openLb(+item.dataset.i);
  });
  lb.querySelector(".banner-lb__close").addEventListener("click", closeLb);
  lb.querySelector(".banner-lb__prev").addEventListener("click", () => show(cur - 1));
  lb.querySelector(".banner-lb__next").addEventListener("click", () => show(cur + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") show(cur - 1);
    else if (e.key === "ArrowRight") show(cur + 1);
  });
})();
