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
  const modals = [...document.querySelectorAll(".process")];
  if (!modals.length) return;

  const NO_OPEN = ".intro-list, .intro-nav, .intro-brand, [data-go], [data-go-main]";
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PLAY  = "M8 5v14l11-7z";
  const PAUSE = "M8 5h3v14H8zM13 5h3v14h-3z";
  const byProject = {};

  /* 모달 1개 셋업 → { open, close } 반환 (프로젝트별로 독립 동작) */
  function setup(modal) {
    const content = modal.querySelector(".process__content");
    const panel   = modal.querySelector(".process__panel");
    const tracks  = [...modal.querySelectorAll(".process__tracks li")];
    const anchors = tracks.map((li) => li.querySelector("a"));
    const heroVid = modal.querySelector(".process__hero-media");

    /* 이미지 디코딩을 메인 스레드 밖에서 → 스크롤 중 디코딩 블로킹/freeze 완화 */
    modal.querySelectorAll("img").forEach((i) => { i.decoding = "async"; });

    const setActive = (id) =>
      tracks.forEach((li) =>
        li.classList.toggle("is-active", li.querySelector("a").dataset.track === id));

    /* 스크롤스파이: 컨테이너 40% 기준선 위로 올라온 마지막 섹션 활성화.
       맨 위(첫 섹션이 기준선 아래)면 current=null → 무선택. */
    const sections = anchors.map((a) => document.getElementById(a.dataset.track)).filter(Boolean);
    const updateSpy = () => {
      const ctop = content.getBoundingClientRect().top;
      const line = content.clientHeight * 0.4;
      let current = null;
      for (const s of sections) {
        if (s.getBoundingClientRect().top - ctop - 8 <= line) current = s.id;
      }
      setActive(current);
    };
    content.addEventListener("scroll", updateSpy, { passive: true });

    const open = () => {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("process-open");
      content.scrollTop = 0;                                 /* 재오픈은 항상 상단부터 */
      requestAnimationFrame(() => { content.scrollTop = 0; updateSpy(); });  /* 렌더 후 한 번 더 확실히 */
      if (heroVid) { heroVid.muted = true; const p = heroVid.play(); if (p && p.catch) p.catch(() => {}); }
      document.querySelectorAll(".project-intro video").forEach((v) => v.pause());
      if (window.__makingRefresh) requestAnimationFrame(() => { window.__makingRefresh(); content.scrollTop = 0; });
    };
    const finishClose = () => {
      panel.style.willChange = "";                          /* 레이어 해제 */
      modal.classList.remove("is-open", "is-closing");
      modal.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("process-open");
      if (heroVid) heroVid.pause();
      const back = document.querySelector(".project-intro.is-active video");
      if (back) setTimeout(() => {                           /* display:none·합성 flush 이후 디코더 시작 */
        if (back.readyState < 2) back.load();
        const p = back.play(); if (p && p.catch) p.catch(() => {});
      }, 160);
    };
    const close = () => {
      if (!modal.classList.contains("is-open") || modal.classList.contains("is-closing")) return;
      if (reduceMotion()) { finishClose(); return; }
      panel.style.willChange = "transform, opacity";        /* 닫힘 직전 레이어 예약 */
      modal.querySelectorAll(".process__eq i").forEach((i) => (i.style.animationPlayState = "paused"));
      modal.classList.add("is-closing");
      let done = false;
      const onEnd = (e) => {
        if (e.target !== panel) return;
        done = true; panel.removeEventListener("animationend", onEnd); finishClose();
      };
      panel.addEventListener("animationend", onEnd);
      setTimeout(() => { if (!done) { panel.removeEventListener("animationend", onEnd); finishClose(); } }, 420);
    };

    /* 트랙 클릭 → 섹션 스크롤 */
    anchors.forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const sec = document.getElementById(a.dataset.track);
        if (!sec) return;
        const top = sec.getBoundingClientRect().top - content.getBoundingClientRect().top + content.scrollTop - 6;
        /* GSAP 으로 scrollTop 직접 트윈 — ScrollTrigger 가 있는 커스텀 스크롤러에선
           네이티브 scrollTo({smooth}) 가 중간에 끊겨, 매 프레임 scrollTop 을 직접 보간. */
        if (window.gsap) {
          window.gsap.to(content, { scrollTop: top, duration: 0.5, ease: "power2.out", overwrite: "auto" });
        } else {
          content.scrollTo({ top, behavior: "smooth" });
        }
        setActive(a.dataset.track);
        content.dispatchEvent(new Event("process:navscroll"));  /* 오버스크롤 종료 navLock 트리거 */
      }));

    /* 닫기(back/scrim) + Esc */
    modal.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) close();
    });

    /* NOW PLAYING 재생/일시정지(아이콘만) */
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

    /* process-exit.js(오버스크롤 종료)가 close 를 받아가도록 전역 레지스트리 등록 */
    window.__processCtrl = window.__processCtrl || {};
    window.__processCtrl[modal.dataset.project] = { open, close };

    return { open, close };
  }

  modals.forEach((m) => { try { byProject[m.dataset.project] = setup(m); } catch (e) { console.error("[process.js] setup failed:", m.dataset.project, e); } });

  /* .intro-process 버튼(있으면) → 해당 프로젝트 모달 */
  document.querySelectorAll(".intro-process").forEach((b) => {
    const p = b.closest(".project-intro");
    const ctrl = p && byProject[p.dataset.project];
    if (ctrl) b.addEventListener("click", ctrl.open);
  });

  /* 인트로 어디든 클릭 → 해당 프로젝트 모달. 모달 있는 프로젝트만 클릭영역 활성. */
  document.querySelectorAll(".project-intro").forEach((p) => {
    const ctrl = byProject[p.dataset.project];
    if (!ctrl) return;
    p.classList.add("is-clickable");
    p.addEventListener("click", (e) => {
      if (e.target.closest(NO_OPEN)) return;
      ctrl.open();
    });
  });
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
  const HALF = 21;                 // 디스크 반지름(42/2) — 포인터 중심 정렬
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
