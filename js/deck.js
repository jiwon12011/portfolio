/* =======================================================================
   deck.js — 프로젝트 가로 캐러셀 (메인=1, 인트로=2,3,4…) · 루프
   -----------------------------------------------------------------------
   · 패널들은 .deck-panel (메인 .scene + 각 .project-intro). 개수는 동적.
   · 스크롤 다운 / ↓ / 좌스와이프 → 다음 패널(오른쪽에서 슉)
     스크롤 업   / ↑ / 우스와이프 → 이전 패널.  끝↔처음 순환.
     (메인에서 위로 → 마지막 프로젝트로 / 마지막에서 아래로 → 메인)
   · 카드 클릭 → 그 프로젝트 패널로 점프.  back 버튼/Esc → 메인.
   · 활성 패널만 화면(translateX 0), 영상은 진입 시 재생/이탈 시 정지.
======================================================================= */
(() => {
  const panels = [...document.querySelectorAll(".deck-panel")];
  const N = panels.length;
  if (N === 0) return;
  const root = document.documentElement;
  let idx = 0, lock = false;
  const COOLDOWN = 880;
  const EASE = "transform .8s cubic-bezier(.76,0,.18,1)";
  const tr = (p, on) => { p.style.transition = on ? EASE : "none"; };

  /* 초기 배치: 0번 화면, 나머지는 오른쪽 밖 */
  panels.forEach((p, i) => {
    tr(p, false);
    p.style.transform = i === 0 ? "translateX(0)" : "translateX(100%)";
    p.classList.toggle("is-active", i === 0);
    p.setAttribute("aria-hidden", i === 0 ? "false" : "true");
  });

  function media(p, play) {
    const v = p.querySelector("video");
    if (!v) return;
    if (play) {
      if (v.videoWidth && v.videoHeight)
        v.style.objectFit = v.videoHeight > v.videoWidth ? "contain" : "cover";
      try { v.currentTime = 0; } catch (e) {}
      v.muted = true;           // 인트로 영상은 무음(자동재생 안정 + 소리 없음)
      const pr = v.play();      // loop 속성으로 무한 반복
      if (pr && pr.catch) pr.catch(() => {});
    } else {
      setTimeout(() => v.pause(), 850);   // 이탈 시 정지 → 한 번에 1개만 디코딩
    }
  }

  /* 활성 프로젝트 = 해당 패널 자신 → 패널 안 리스트의 active(이퀄라이저)·페이저 동기화.
     패널마다 자기 프로젝트를 하이라이트하므로 패널이 늘어나도 자동으로 맞는다. */
  const projPanels = panels.filter((p) => p.dataset.project && p.dataset.project !== "main");
  const pad2 = (v) => String(v).padStart(2, "0");
  function syncIntro(p) {
    if (!p || !p.dataset.project || p.dataset.project === "main") return;
    const proj = p.dataset.project;
    p.querySelectorAll(".intro-list__item").forEach((it) =>
      it.classList.toggle("is-active", it.dataset.go === proj));
    const n = projPanels.indexOf(p) + 1, tot = projPanels.length;
    const pg = p.querySelector(".intro-pager span");
    if (pg && n > 0) pg.textContent = `${pad2(n)} / ${pad2(tot)}`;
    const bar = p.querySelector(".intro-pager__bar i");
    if (bar && tot) bar.style.setProperty("--p", (n / tot) * 100 + "%");
  }
  projPanels.forEach(syncIntro);   // 초기 1회

  /* 현재+다음+이전 패널 영상만 미리 버퍼(멀리 있는 건 안 받음 → 초기 가볍게) */
  function preloadNeighbors() {
    if (N < 2) return;
    const keep = new Set([idx, (idx + 1) % N, (idx - 1 + N) % N]);
    panels.forEach((p, i) => {
      const v = p.querySelector("video");
      if (v && keep.has(i) && v.preload !== "auto") { v.preload = "auto"; v.load(); }
    });
  }

  function slide(to, dir) {
    if (lock || to === idx || to < 0 || to >= N) return;
    lock = true; setTimeout(() => { lock = false; }, COOLDOWN);
    const out = panels[idx], inc = panels[to];
    /* 전환 직전에만 GPU 레이어 승격(끝나면 해제 → 비활성 패널 VRAM 점유 제거) */
    out.style.willChange = inc.style.willChange = "transform";
    setTimeout(() => { out.style.willChange = ""; inc.style.willChange = ""; }, 850);
    /* 들어오는 패널을 진행 방향 반대편에 즉시 배치(트랜지션 없이) */
    tr(inc, false);
    inc.style.transform = `translateX(${dir > 0 ? 100 : -100}%)`;
    void inc.offsetWidth;                       // reflow
    /* 애니메이션: 나가는 건 반대로, 들어오는 건 0 으로 */
    tr(out, true); tr(inc, true);
    out.style.transform = `translateX(${dir > 0 ? -100 : 100}%)`;
    inc.style.transform = "translateX(0)";
    out.classList.remove("is-active"); inc.classList.add("is-active");
    out.setAttribute("aria-hidden", "true"); inc.setAttribute("aria-hidden", "false");
    media(out, false); media(inc, true);
    syncIntro(inc);
    root.classList.toggle("off-main", to !== 0);
    idx = to;
    preloadNeighbors();           // 다음 슬라이드 대비 옆 영상 버퍼
  }
  const go   = (dir) => { if (N >= 2) slide((idx + dir + N) % N, dir); };  // 루프
  const goTo = (t)   => { if (t !== idx) slide(t, t > idx ? 1 : -1); };    // 점프

  /* 제작과정·About 오버레이가 열려 있으면 뒤 배경(프로젝트 전환)은 잠금 */
  const locked = () => document.documentElement.classList.contains("process-open")
    || document.documentElement.classList.contains("about-open");

  /* 휠 — 한 제스처 = 한 칸 (쿨다운). About 닫힌 직후 가드 동안은 잔여 스크롤 무시 */
  window.addEventListener("wheel", (e) => {
    if (lock || locked() || performance.now() < (window.__deckGuardUntil || 0)) return;
    if (e.deltaY > 8) go(1); else if (e.deltaY < -8) go(-1);
  }, { passive: true });

  /* 키보드 */
  document.addEventListener("keydown", (e) => {
    if (locked()) return;
    if (e.key === "ArrowDown" || e.key === "PageDown") go(1);
    else if (e.key === "ArrowUp" || e.key === "PageUp") go(-1);
    else if (e.key === "Escape" && idx !== 0) goTo(0);
  });

  /* 카드 클릭 → 해당 프로젝트 패널 */
  panels.forEach((p) => {
    const proj = p.dataset.project;
    if (!proj || proj === "main") return;
    const arm = document.querySelector(`.card-arm[data-card="${proj}"]`);
    if (!arm) return;
    arm.style.cursor = "pointer";
    const title = (arm.querySelector(".card__title") || {}).textContent || proj;
    arm.setAttribute("role", "button");
    arm.setAttribute("tabindex", "0");
    arm.setAttribute("aria-label", title.trim() + " 프로젝트 보기");
    const nav = () => goTo(panels.indexOf(p));
    arm.addEventListener("click", (e) => {
      if (e.target.closest("button, a")) return;
      nav();
    });
    arm.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav(); }
    });
  });

  /* 인트로 오버레이: 우측 프로젝트 리스트 → 해당 패널, 브랜드 로고 → 메인 */
  document.querySelectorAll("[data-go]").forEach((el) =>
    el.addEventListener("click", () => {
      const t = panels.findIndex((p) => p.dataset.project === el.dataset.go);
      if (t >= 0) goTo(t);
    }));
  document.querySelectorAll("[data-go-main]").forEach((el) =>
    el.addEventListener("click", () => goTo(0)));

  /* 터치 스와이프(수평) */
  let tx = 0, ty = 0;
  window.addEventListener("touchstart", (e) => {
    tx = e.touches[0].clientX; ty = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener("touchend", (e) => {
    if (lock || locked()) return;
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) go(1); else go(-1);
  }, { passive: true });

  /* 초기 LCP 끝난 뒤(1.5s) 옆 영상 미리 버퍼 → 첫 슬라이드 즉시 재생 */
  setTimeout(preloadNeighbors, 1500);
})();
