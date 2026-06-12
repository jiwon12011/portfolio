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

  /* I1 — 카드→인트로 clip-path 모핑 전환
     메인(panel0)에서 인트로로 갈 때만, 클릭된 카드의 뷰포트 좌표를 inset 시작값으로 씀.
     prefers-reduced-motion · 모바일(≤768) · rect 취득 실패 시 → 기존 슬라이드 폴백. */
  const MORPH_EASE = "clip-path .62s cubic-bezier(.7,0,.2,1)";
  let pendingMorphRect = null;   // 카드 클릭 시 저장, slide() 에서 소비

  function tryCardMorph(inc) {
    /* 폴백 조건 체크 */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    if (window.innerWidth <= 768) return false;
    const rect = pendingMorphRect;
    pendingMorphRect = null;
    if (!rect) return false;

    const t  = Math.round(rect.top);
    const r  = Math.round(window.innerWidth  - rect.right);
    const b  = Math.round(window.innerHeight - rect.bottom);
    const l  = Math.round(rect.left);
    /* 화면 밖이거나 너무 작으면 폴백 */
    if (t < -200 || l < -200 || r < -200 || b < -200) return false;
    if (rect.width < 20 || rect.height < 20) return false;

    /* 들어오는 패널: translateX(0) 고정 + clip-path 시작값 즉시 세팅 */
    inc.style.transition = "none";
    inc.style.transform  = "translateX(0)";
    inc.style.clipPath   = `inset(${t}px ${r}px ${b}px ${l}px round 18px)`;
    void inc.offsetWidth;  // 강제 reflow

    /* transition 켜고 전체화면으로 확장 */
    inc.style.transition = MORPH_EASE;
    inc.style.clipPath   = "inset(0 0 0 0 round 0px)";

    /* 전환 완료 후 clip-path 제거 — 이후 인터랙션에 영향 없게 */
    setTimeout(() => {
      inc.style.transition = "";
      inc.style.clipPath   = "";
    }, 680);

    return true;
  }
  const tr = (p, on) => {
    if (!on) { p.style.transition = "none"; return; }
    /* 모션 민감 사용자: 좌우 슬라이드(전정 자극) 즉시 전환으로 */
    p.style.transition = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "transform .01ms linear" : EASE;
  };

  /* 초기 배치: 0번 화면, 나머지는 오른쪽 밖 */
  panels.forEach((p, i) => {
    tr(p, false);
    p.style.transform = i === 0 ? "translateX(0)" : "translateX(100%)";
    p.classList.toggle("is-active", i === 0);
    p.setAttribute("aria-hidden", i === 0 ? "false" : "true");
    /* 비활성 패널은 inert(키보드 포커스·SR 비노출). inert 가 aria-hidden 까지 함께 처리하지만
       구형 브라우저 대비 aria-hidden 도 유지 */
    p.toggleAttribute("inert", i !== 0);
  });
  root.classList.add("deck-ready");

  function media(p, play) {
    const v = p.querySelector("video");
    if (!v || !v.src) return;              // src 없는 패널 skip
    if (play) {
      clearTimeout(v._pauseT);               // 나갔다 다시 들어올 때 예약 pause 취소(경합 제거)
      v.muted = true;
      /* 재생 대상은 항상 preload=auto 로 올린다. 안 그러면 직후 preloadNeighbors() 가
         이 영상(preload="none")을 다시 load() → 막 시작한 play() 를 AbortError 로 끊는다. */
      v.preload = "auto";
      const start = () => {
        if (v.videoWidth && v.videoHeight)
          v.style.objectFit = v.videoHeight > v.videoWidth ? "contain" : "cover";
        try { v.currentTime = 0; } catch (e) {}
        const pr = v.play();
        if (pr && pr.catch) pr.catch(() => {});
      };
      if (v.readyState >= 2) start();         // 이미 재생 가능 → 즉시
      else {                                   // 데이터 없음 → 로드 후 canplay 에 재생
        v.load();
        v.addEventListener("canplay", start, { once: true });
      }
    } else {
      clearTimeout(v._pauseT);
      v._pauseT = setTimeout(() => v.pause(), 850);
    }
  }

  /* 활성 프로젝트 = 해당 패널 자신 → 패널 안 리스트의 active(이퀄라이저)·페이저 동기화.
     패널마다 자기 프로젝트를 하이라이트하므로 패널이 늘어나도 자동으로 맞는다. */
  const projPanels = panels.filter((p) => p.dataset.project && p.dataset.project !== "main");
  const pad2 = (v) => String(v).padStart(2, "0");
  function syncIntro(p) {
    if (!p || !p.dataset.project || p.dataset.project === "main") return;
    const proj = p.dataset.project;
    p.querySelectorAll(".intro-list__item").forEach((it) => {
      const on = it.dataset.go === proj;
      it.classList.toggle("is-active", on);
      if (on) it.setAttribute("aria-current", "true"); else it.removeAttribute("aria-current");
    });
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
      if (!v) return;
      if (keep.has(i)) {
        if (v.preload !== "auto") { v.preload = "auto"; v.load(); }
      } else if (!p.classList.contains("is-active") && v.preload !== "none") {
        v.preload = "none";        /* keep 범위 밖 — 버퍼 해제 힌트(한 바퀴 돌 때 메모리 누적 방지) */
      }
    });
  }

  function slide(to, dir, opts = {}) {
    if (lock || to === idx || to < 0 || to >= N) return;
    lock = true; setTimeout(() => { lock = false; }, COOLDOWN);
    /* 트랙패드 관성 가드: 전환 동안 들어오는 잔여 휠 무시(휠 핸들러가 이 값을 읽음) */
    window.__deckGuardUntil = performance.now() + COOLDOWN;
    const out = panels[idx], inc = panels[to];
    /* I1 — 메인(idx===0)→인트로 전환일 때만 카드 모핑 시도 */
    const usedMorph = (idx === 0 && to !== 0) ? tryCardMorph(inc) : false;
    if (!usedMorph) { pendingMorphRect = null; } // 소비 안 됐으면 정리
    /* 전환 직전에만 GPU 레이어 승격(끝나면 해제 → 비활성 패널 VRAM 점유 제거) */
    out.style.willChange = inc.style.willChange = "transform";
    setTimeout(() => { out.style.willChange = ""; inc.style.willChange = ""; }, 850);
    if (!usedMorph) {
      /* 기존 슬라이드: 들어오는 패널을 진행 방향 반대편에 즉시 배치(트랜지션 없이) */
      tr(inc, false);
      inc.style.transform = `translateX(${dir > 0 ? 100 : -100}%)`;
      void inc.offsetWidth;                       // reflow
      /* 애니메이션: 나가는 건 반대로, 들어오는 건 0 으로 */
      tr(inc, true);
    }
    /* 나가는 패널은 항상 기존 슬라이드로 처리 */
    tr(out, true);
    out.style.transform = `translateX(${dir > 0 ? -100 : 100}%)`;
    if (!usedMorph) {
      inc.style.transform = "translateX(0)";
    }
    out.classList.remove("is-active"); inc.classList.add("is-active");
    out.setAttribute("aria-hidden", "true"); inc.setAttribute("aria-hidden", "false");
    /* inert: 들어오는 패널 즉시 해제(포커스 가능), 나가는 패널은 전환 끝나고 부여
       (전환 중 보이는 동안 내부 포커스가 갑자기 끊기지 않게) */
    inc.removeAttribute("inert");
    setTimeout(() => { if (idx !== panels.indexOf(out)) out.setAttribute("inert", ""); }, 850);
    media(out, false); media(inc, true);
    syncIntro(inc);
    root.classList.toggle("off-main", to !== 0);
    idx = to;
    /* 전환 완료 시 새 활성 패널로 포커스 이동(키보드 사용자 맥락 유지).
       메인(0)으로 복귀 시엔 과하므로 생략. focus 는 reflow/스크롤 영향 없게 preventScroll */
    if (to !== 0 && opts.focus) {
      setTimeout(() => {
        if (idx !== to) return;                 // 그 사이 또 전환됐으면 취소
        const target = inc.querySelector(".intro-brand") || inc;
        if (!target.hasAttribute("tabindex") && target === inc) inc.setAttribute("tabindex", "-1");
        try { target.focus({ preventScroll: true }); } catch (e) {}
      }, 860);
    }
    preloadNeighbors();           // 다음 슬라이드 대비 옆 영상 버퍼
  }
  const go   = (dir, opts) => { if (N >= 2) slide((idx + dir + N) % N, dir, opts); };  // 루프
  const goTo = (t, opts)   => { if (t !== idx) slide(t, t > idx ? 1 : -1, opts); };    // 점프

  /* 제작과정·About 오버레이가 열려 있으면 뒤 배경(프로젝트 전환)은 잠금 */
  const locked = () => document.documentElement.classList.contains("process-open")
    || document.documentElement.classList.contains("about-open");

  /* 휠 — 한 제스처 = 한 칸 (쿨다운). About 닫힌 직후 가드 동안은 잔여 스크롤 무시 */
  window.addEventListener("wheel", (e) => {
    if (lock || locked() || performance.now() < (window.__deckGuardUntil || 0)) return;
    if (e.deltaY > 8) go(1, { focus: false }); else if (e.deltaY < -8) go(-1, { focus: false });
  }, { passive: true });

  /* 키보드 — 세로(↑↓)·가로(←→) 모두. 텍스트 입력 중에는 무시 */
  document.addEventListener("keydown", (e) => {
    if (locked()) return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "ArrowRight") go(1, { focus: true });
    else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "ArrowLeft") go(-1, { focus: true });
    else if (e.key === "Escape" && idx !== 0) goTo(0, { focus: true });
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
      if (e.target.closest("button")) return;   // 카드 내 like/play 버튼만 제외(장식 span 은 통과)
      /* I1 — 클릭 시 카드 arm 의 뷰포트 좌표를 저장 → slide() 가 모핑 시작값으로 소비 */
      try { pendingMorphRect = arm.getBoundingClientRect(); } catch (e) { pendingMorphRect = null; }
      nav();
    });
    arm.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nav(); }
    });
  });

  /* 인트로 오버레이: 우측 프로젝트 리스트 → 해당 패널, 브랜드 로고 → 메인 */
  document.querySelectorAll("[data-go]").forEach((el) => {
    const goEl = () => {
      const t = panels.findIndex((p) => p.dataset.project === el.dataset.go);
      if (t >= 0) goTo(t);
    };
    el.addEventListener("click", goEl);
    /* role=button 목차 항목 키보드 활성화(Enter/Space) */
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goEl(); }
    });
  });
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
