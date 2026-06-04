/* =======================================================================
   about-exit.js — About(프로필) 오버레이: 아래로 스크롤 / 여백 클릭 → 메인 복귀
   -----------------------------------------------------------------------
   · About 은 한 화면 고정(스크롤 없음)이라 "바닥" 개념이 없음 → wheel/touch
     아래 방향 deltaY 누적, 임계 도달 시 close({down}) 로 아래 슬라이드 종료
   · 열린 직후 짧게 입력 잠금(관성 휠로 즉시 닫힘 방지)
   · 닫힌 직후 관성 wheel/touch 흡수(뒤 deck/orbit 패널 튐 방지)
   · 하단 글래스 힌트 칩(--p 0~1 진행), 임계 근접 시 강조
   · 여백 클릭(.about__inner 바깥) → 즉시 닫기. BACK 버튼 / Esc 는 그대로.
   process-exit.js 의 패턴을 참고하되, "바닥" 분기가 없어 더 가벼운 전용 핸들러.
======================================================================= */
(() => {
  const about = document.getElementById("about");
  const ctrl = window.__aboutCtrl;
  if (!about || !ctrl) return;

  const THRESHOLD    = 1400;  // 누적 임계(px) — 둔감하게(빠른 스크롤로 휙 닫히지 않게)
  const DECAY_MS     = 260;   // 입력 끊김 후 감쇠 시작(조금 빨리 식게 → 의도적 연속 스크롤만)
  const SPEED_BONUS  = 0.1;   // 속도 가중(작게 → 빠른 플릭이 과하게 적립되지 않게)
  const ARM_AT       = 0.82;  // "한 번 더" 강조 진행값
  const OPEN_LOCK_MS = 300;   // 열린 직후 입력 잠금(관성 차단)

  /* 하단 글래스 힌트 칩 */
  const chip = document.createElement("div");
  chip.className = "about__exit";
  chip.setAttribute("aria-hidden", "true");
  chip.innerHTML =
    '<div class="about__exit-glass">' +
      '<span class="about__exit-arrow" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>' +
      '</span>' +
      '<span class="about__exit-label">아래로 스크롤하면 메인으로 돌아갑니다</span>' +
      '<span class="about__exit-track"><i class="about__exit-fill"></i></span>' +
    '</div>';
  about.appendChild(chip);

  let accumulated = 0, decayTimer = null, decayRaf = null, triggered = false, lockUntil = 0;
  let _pVal = 0, _pRaf = null, _armed = false;

  const setP = (p) => {                              // 프레임당 1회만 DOM 갱신
    _pVal = p;
    const armed = p >= ARM_AT;
    if (armed !== _armed) { _armed = armed; about.classList.toggle("is-exit-armed", armed); }
    if (!_pRaf) _pRaf = requestAnimationFrame(() => {
      _pRaf = null; chip.style.setProperty("--p", _pVal.toFixed(3));
    });
  };
  const reset = () => { accumulated = 0; setP(0); };

  function easeReset() {
    cancelAnimationFrame(decayRaf);
    (function step() {
      if (accumulated <= 1) { reset(); return; }
      accumulated *= 0.82;
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
  function trigger() {
    if (triggered) return;
    triggered = true;
    reset();
    clearTimeout(decayTimer); cancelAnimationFrame(decayRaf);
    /* 닫힌 직후 "스크롤을 멈출 때까지" 관성 wheel/touch 를 흡수 — 같은 한 번의 긴
       스크롤이 About 닫기에 이어 deck(메인→자린고비)까지 넘기는 연쇄 차단.
       추가로 window.__deckGuardUntil 을 계속 연장해, 흡수를 빠져나온 꼬리 이벤트도 deck 이 무시. */
    const GUARD_MS = 380, IDLE_MS = 220, CAP_MS = 3000;
    let idle;
    window.__deckGuardUntil = performance.now() + GUARD_MS;
    const unswallow = () => {
      clearTimeout(idle);
      window.removeEventListener("wheel", swallow, true);
      window.removeEventListener("touchmove", swallow, true);
    };
    const swallow = (ev) => {
      ev.stopImmediatePropagation();
      window.__deckGuardUntil = performance.now() + GUARD_MS;   // 스크롤 지속되는 동안 계속 연장
      clearTimeout(idle);
      idle = setTimeout(unswallow, IDLE_MS);                    // 진짜 멈췄을 때만 해제
    };
    window.addEventListener("wheel", swallow, true);
    window.addEventListener("touchmove", swallow, true);
    setTimeout(unswallow, CAP_MS);                              // 안전 상한(스크롤 안 멈춰도 결국 해제)
    if (navigator.vibrate) { try { navigator.vibrate(16); } catch (e) {} }
    ctrl.close({ down: true });
  }

  const isOpen = () => ctrl.isOpen();
  const blocked = () => triggered || !isOpen() || performance.now() < lockUntil;

  /* 데스크탑/트랙패드 — 아래로만 누적 */
  about.addEventListener("wheel", (e) => {
    if (blocked()) return;
    if (e.deltaY <= 0) { clearTimeout(decayTimer); reset(); return; }     // 위로 → 리셋
    const s = Math.abs(e.deltaY);
    add(s * (1 + s * SPEED_BONUS / 120));
    clearTimeout(decayTimer);
    decayTimer = setTimeout(easeReset, DECAY_MS);
  }, { passive: true });

  /* 모바일 터치 — 위로 스와이프(콘텐츠를 위로 밀어올림 = 아래 스크롤) 누적 */
  let lastY = 0;
  about.addEventListener("touchstart", (e) => { lastY = e.touches[0].clientY; }, { passive: true });
  about.addEventListener("touchmove", (e) => {
    if (blocked()) return;
    const y = e.touches[0].clientY, dy = lastY - y; lastY = y;
    if (dy <= 0) { reset(); return; }
    add(dy * 1.4);
  }, { passive: true });
  about.addEventListener("touchend", () => {
    if (accumulated > 0) { clearTimeout(decayTimer); decayTimer = setTimeout(easeReset, 80); }
  }, { passive: true });

  /* 여백(.about__inner 바깥) 클릭 → 닫기. 콘텐츠/BACK/칩은 제외 */
  about.addEventListener("click", (e) => {
    if (!isOpen()) return;
    if (e.target.closest(".about__inner, .about__back, .about__exit")) return;
    ctrl.close();
  });

  /* 열림/닫힘 전환 감지 → 입력 잠금 / 상태 초기화. armed 등 동일상태 클래스 변화는 무시 */
  let wasOpen = isOpen();
  new MutationObserver(() => {
    const now = isOpen();
    if (now === wasOpen) return;
    wasOpen = now;
    if (now) {                                       // 막 열림
      lockUntil = performance.now() + OPEN_LOCK_MS;
      triggered = false;
      reset();
    } else {                                         // 닫힘/정리
      clearTimeout(decayTimer); cancelAnimationFrame(decayRaf); cancelAnimationFrame(_pRaf); _pRaf = null;
      triggered = false;
      reset();
      about.classList.remove("is-exit-armed");
    }
  }).observe(about, { attributes: true, attributeFilter: ["class"] });

  if (isOpen()) lockUntil = performance.now() + OPEN_LOCK_MS;
})();
