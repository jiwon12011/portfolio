/* =======================================================================
   process-exit.js — 제작과정 모달: 바닥에서 강하게 오버스크롤 → 모달 닫기(인트로 복귀)
   -----------------------------------------------------------------------
   · 바닥 도달(scrollTop+clientHeight ≈ scrollHeight) 후에만 누적 시작
   · wheel/touch deltaY(아래) 누적 + 속도 가중, 입력 끊기면 decay 리셋,
     위로 스크롤·네비 클릭(navLock) 시 즉시 리셋 → 오발동 방지
   · 하단 글래스 안내 칩(동적 생성)에 --p(0~1) 진행값 전달, 임계 도달 시 close()
   · close() 는 process.js 의 것을 재사용(window.__processCtrl) — 닫힘 애니메이션·
     인트로 복귀 로직 그대로
======================================================================= */
(() => {
  const THRESHOLD   = 820;   // 누적 임계치(px) — 더 천천히/의도적으로 밀어야 닿게(느리게)
  const DECAY_MS    = 300;   // 입력 끊김 후 게이지 감쇠 시작
  const SETTLE_PX   = 4;     // 바닥 판정 여유(소수점 오차)
  const SPEED_BONUS = 0.3;   // 속도 가중(완만하게)
  const NEAR_END    = 150;   // 안내 칩이 떠오르는 바닥 근접 거리(px)
  const ARM_AT      = 0.86;  // 이 진행값 이상이면 "곧 나감" 강조

  const isAtBottom = (el) =>
    Math.ceil(el.scrollTop) + el.clientHeight >= el.scrollHeight - SETTLE_PX;

  function buildIndicator(parent) {
    const el = document.createElement("div");
    el.className = "process__exit";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="process__exit-glass">' +
        '<span class="process__exit-arrow" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>' +
        '</span>' +
        '<span class="process__exit-label">한 번 더 스크롤하면 인트로로 돌아갑니다</span>' +
        '<span class="process__exit-track"><i class="process__exit-fill"></i></span>' +
      '</div>';
    parent.appendChild(el);
    return el;
  }

  function attach(modal, close) {
    const content = modal.querySelector(".process__content");
    if (!content) return;
    const ind = buildIndicator(content);   /* 스크롤 콘텐츠 끝(본문 뒤)에 배치 — 흐름 안 */

    let accumulated = 0, decayTimer = null, decayRaf = null, navLock = false;

    let _pVal = 0, _pRaf = null, _armed = false;
    const setP = (p) => {                          // 매 wheel 대신 프레임당 1번만 DOM 갱신
      _pVal = p;
      const armed = p >= ARM_AT;
      if (armed !== _armed) { _armed = armed; modal.classList.toggle("is-exit-armed", armed); }
      if (!_pRaf) _pRaf = requestAnimationFrame(() => {
        _pRaf = null; ind.style.setProperty("--p", _pVal.toFixed(3));
      });
    };
    const reset = () => { accumulated = 0; setP(0); };

    function easeReset() {
      cancelAnimationFrame(decayRaf);
      (function step() {
        if (accumulated <= 1) { reset(); return; }
        accumulated *= 0.82;                    // 지수 감쇠
        setP(Math.min(accumulated / THRESHOLD, 1));
        decayRaf = requestAnimationFrame(step);
      })();
    }

    function add(effective) {
      accumulated = Math.min(accumulated + effective, THRESHOLD * 1.05);
      const p = Math.min(accumulated / THRESHOLD, 1);
      setP(p);
      if (p >= 1) { clearTimeout(decayTimer); cancelAnimationFrame(decayRaf); trigger(); }
    }

    let triggered = false;
    function trigger() {
      if (triggered) return;
      triggered = true;                          // 관성 wheel 재진입 차단
      reset();
      clearTimeout(decayTimer); cancelAnimationFrame(decayRaf);
      /* 닫힌 직후 관성 wheel/touch 가 deck(인트로 패널 네비)로 흘러 패널이 튀는 것 방지 —
         800ms 동안 capture 단계에서 흡수(stopImmediatePropagation) */
      let idle;
      const unswallow = () => {
        clearTimeout(idle);
        window.removeEventListener("wheel", swallow, true);
        window.removeEventListener("touchmove", swallow, true);
      };
      const swallow = (ev) => {
        ev.stopImmediatePropagation();
        clearTimeout(idle);
        idle = setTimeout(unswallow, 120);     // 관성 끊기면 즉시 해제
      };
      window.addEventListener("wheel", swallow, true);
      window.addEventListener("touchmove", swallow, true);
      setTimeout(unswallow, 800);              // 안전 상한
      if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) {} }
      close();
    }
    const blocked = () =>
      triggered || navLock || !modal.classList.contains("is-open") || modal.classList.contains("is-closing");

    /* 바닥 근접 시 안내 칩 노출 */
    content.addEventListener("scroll", () => {
      const d = content.scrollHeight - (content.scrollTop + content.clientHeight);
      modal.classList.toggle("is-near-end", d < NEAR_END);
    }, { passive: true });

    /* 네비 클릭(GSAP 스크롤) 동안 감지 일시 중단 */
    content.addEventListener("process:navscroll", () => {
      navLock = true;
      clearTimeout(decayTimer);
      reset();
      setTimeout(() => (navLock = false), 340);
    });

    /* 데스크탑/트랙패드 */
    content.addEventListener("wheel", (e) => {
      if (blocked()) return;
      if (e.deltaY <= 0) { clearTimeout(decayTimer); reset(); return; }      // 위로
      if (!isAtBottom(content)) { clearTimeout(decayTimer); reset(); return; } // 바닥 아님
      const s = Math.abs(e.deltaY);
      add(s * (1 + s * SPEED_BONUS / 120));
      clearTimeout(decayTimer);
      decayTimer = setTimeout(easeReset, DECAY_MS);
    }, { passive: true });

    /* 모바일 터치 pull */
    let lastY = 0;
    content.addEventListener("touchstart", (e) => { lastY = e.touches[0].clientY; }, { passive: true });
    content.addEventListener("touchmove", (e) => {
      if (blocked()) return;
      const y = e.touches[0].clientY, dy = lastY - y; lastY = y;   // 양수 = 아래로 스와이프
      if (dy <= 0) { reset(); return; }
      if (!isAtBottom(content)) { reset(); return; }
      add(dy * 1.4);
    }, { passive: true });
    content.addEventListener("touchend", () => {
      if (accumulated > 0) { clearTimeout(decayTimer); decayTimer = setTimeout(easeReset, 80); }
    }, { passive: true });

    /* 모달 닫히면 상태/클래스 초기화 */
    new MutationObserver(() => {
      if (modal.classList.contains("is-open")) return;
      /* 이미 정리됐으면 재발화 차단 — reset()이 또 클래스를 바꿔 자기 자신을 먹이는 루프 끊기 */
      if (!triggered && accumulated === 0 &&
          !modal.classList.contains("is-near-end") &&
          !modal.classList.contains("is-exit-armed")) return;
      clearTimeout(decayTimer); cancelAnimationFrame(decayRaf); cancelAnimationFrame(_pRaf); _pRaf = null;
      triggered = false;                         // 다음에 다시 열리면 제스처 복구
      reset();
      modal.classList.remove("is-near-end", "is-exit-armed");
    }).observe(modal, { attributes: true, attributeFilter: ["class"] });
  }

  const init = () => {
    if (!window.__processCtrl) return false;
    document.querySelectorAll(".process").forEach((modal) => {
      const ctrl = window.__processCtrl[modal.dataset.project];
      if (ctrl && ctrl.close) attach(modal, ctrl.close);
    });
    return true;
  };
  if (!init()) {                                 // process.js 로드 지연 대비 폴링
    let n = 0;
    const t = setInterval(() => { if (init() || ++n > 40) clearInterval(t); }, 80);
  }
})();
