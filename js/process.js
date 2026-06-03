/* =======================================================================
   process.js — 제작 과정 모달 (뮤직플레이어형)
   -----------------------------------------------------------------------
   · 인트로의 VIEW PROCESS(.intro-process) 클릭 → 모달 오픈
   · BACK TO PROJECT / scrim 클릭 / Esc → 닫기
   · 좌측 PLAYLIST = 우측 섹션 스크롤스파이(IntersectionObserver)로 active 이동,
     트랙 클릭 시 해당 섹션으로 부드럽게 스크롤(스크롤 컨테이너 기준)
   · NOW PLAYING 재생/일시정지 토글(아이콘만)
======================================================================= */
(() => {
  const modal = document.getElementById("process");
  if (!modal) return;

  const content = modal.querySelector(".process__content");
  const tracks  = [...modal.querySelectorAll(".process__tracks li")];
  const anchors = tracks.map((li) => li.querySelector("a"));

  const heroVid = modal.querySelector(".process__hero-media");

  /* ---- 오픈 / 닫기 ---- */
  const open = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("process-open");
    content.scrollTop = 0;
    if (heroVid) { heroVid.muted = true; const p = heroVid.play(); if (p && p.catch) p.catch(() => {}); }
    /* 뒤 인트로 영상은 팝업 동안 정지 */
    document.querySelectorAll(".project-intro video").forEach((v) => v.pause());
    /* 모달이 보이게 됐으니 스크롤 모션 위치 재계산 */
    if (window.__makingRefresh) requestAnimationFrame(() => window.__makingRefresh());
  };
  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("process-open");
    if (heroVid) heroVid.pause();          // 이탈 시 정지 → 디코딩 절약
    /* 닫히면 활성 인트로 영상 재생 재개 */
    const back = document.querySelector(".project-intro.is-active video");
    if (back) { const p = back.play(); if (p && p.catch) p.catch(() => {}); }
  };

  document.querySelectorAll(".intro-process").forEach((b) =>
    b.addEventListener("click", open));

  /* 인트로 화면 어디를 클릭해도 제작 과정 오픈.
     단, 자체 기능이 있는 컨트롤(프로젝트 리스트/헤더 네비/브랜드 로고)은 제외 */
  const NO_OPEN = ".intro-list, .intro-nav, .intro-brand, [data-go], [data-go-main]";
  document.querySelectorAll(".project-intro").forEach((panel) => {
    panel.classList.add("is-clickable");
    panel.addEventListener("click", (e) => {
      if (e.target.closest(NO_OPEN)) return;
      open();
    });
  });

  modal.querySelectorAll("[data-close]").forEach((b) =>
    b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) close();
  });

  /* ---- 트랙 클릭 → 섹션으로 스크롤(컨테이너 기준 오프셋) ---- */
  const setActive = (id) =>
    tracks.forEach((li) =>
      li.classList.toggle("is-active", li.querySelector("a").dataset.track === id));

  anchors.forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const sec = document.getElementById(a.dataset.track);
      if (!sec) return;
      const top = sec.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop - 6;
      content.scrollTo({ top, behavior: "smooth" });
      setActive(a.dataset.track);
    }));

  /* ---- 스크롤스파이 ---- */
  const sections = anchors
    .map((a) => document.getElementById(a.dataset.track))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActive(en.target.id);
        });
      },
      { root: content, rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
  }

  /* ---- NOW PLAYING 재생/일시정지(아이콘만) ---- */
  const PLAY  = "M8 5v14l11-7z";
  const PAUSE = "M8 5h3v14H8zM13 5h3v14h-3z";
  const playBtn = modal.querySelector(".process__now-ctrl .is-play");
  if (playBtn) {
    let playing = true;
    playBtn.addEventListener("click", () => {
      playing = !playing;
      const p = playBtn.querySelector("svg path");
      if (p) p.setAttribute("d", playing ? PAUSE : PLAY);
      playBtn.setAttribute("aria-label", playing ? "일시정지" : "재생");
      modal.querySelectorAll(".process__eq").forEach((eq) =>
        eq.style.setProperty("animation-play-state", playing ? "running" : "paused"));
      modal.querySelectorAll(".process__eq i").forEach((i) =>
        (i.style.animationPlayState = playing ? "running" : "paused"));
    });
  }
})();

/* =======================================================================
   재생버튼 커서 — 인트로 클릭영역 위에서 ▶ 디스크가 마우스를 따라다님.
   데스크탑(hover+fine)·모션허용 시에만. 터치/reduced-motion 은 비활성.
======================================================================= */
(() => {
  const cursor = document.getElementById("play-cursor");
  if (!cursor) return;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduce) return;

  const NO = ".intro-list, .intro-nav, .intro-brand, [data-go], [data-go-main]";
  const HALF = 26;                 // 디스크 반지름(52/2) — 포인터 중심 정렬
  let tx = innerWidth / 2, ty = innerHeight / 2, cx = tx, cy = ty;
  let on = false, idleT = 0;

  const inClickArea = (el) => {
    if (!el || document.documentElement.classList.contains("process-open")) return false;
    if (!el.closest(".project-intro.is-clickable.is-active")) return false;
    return !el.closest(NO);
  };

  document.addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    const active = inClickArea(e.target);
    if (active !== on) {
      on = active;
      cursor.classList.toggle("is-on", on);
      if (on) { cx = tx; cy = ty; }       // 진입 시 점프 없이 그 자리에서
    }
    cursor.classList.remove("is-idle");
    clearTimeout(idleT);
    if (on) idleT = setTimeout(() => cursor.classList.add("is-idle"), 1500);
  }, { passive: true });

  document.addEventListener("mouseleave", () => {
    on = false; cursor.classList.remove("is-on", "is-idle");
  });

  /* 클릭 → 눌림 + ripple, 모달이 덮으므로 커서는 숨김 */
  document.addEventListener("click", (e) => {
    if (!inClickArea(e.target)) return;
    cursor.classList.add("is-press");
    setTimeout(() => cursor.classList.remove("is-press"), 160);
    const r = document.createElement("div");
    r.className = "pc-ripple";
    r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 640);
    on = false; cursor.classList.remove("is-on", "is-idle");
  });

  (function loop() {
    cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
    cursor.style.transform = `translate3d(${cx - HALF}px, ${cy - HALF}px, 0)`;
    requestAnimationFrame(loop);
  })();
})();
