/* =======================================================================
   overlay-exit.js — 풀페이지 오버레이 "바닥 오버스크롤 → 체이닝" 공용 제스처
   -----------------------------------------------------------------------
   process-exit.js 의 메커니즘(바닥 도달 후 wheel/touch 누적 + 속도가중 +
   decay + 진행게이지 칩 + trigger 후 관성 swallow)을 재사용 가능하게 일반화.
   about·client-works 두 오버레이에 attach 한다. process-exit.js 는 회귀
   위험 때문에 손대지 않고, 이 파일이 나머지 오버레이를 담당한다.

   attach(opts):
     scroller     스크롤되는 요소 (about=.about__scroll, cw=.cw__scroll)
     host         is-near-end / is-exit-armed 를 토글하고 is-open 을 검사할 요소
     label        안내 칩 문구
     onTrigger    임계 도달 콜백 (다음 오버레이 열기 / 닫고 복귀 등)
     rearm        true 면 host 를 닫지 않고 체이닝(about) → 발동 후 재무장
     canTrigger   추가 게이트 (예: 위에 다른 오버레이가 떠 있으면 false)
     navLockEvent scroller 에서 이 이벤트가 오면 잠시 감지 중단(프로그램 스크롤)
======================================================================= */
(() => {
  const THRESHOLD   = 820;   // 누적 임계치(px) — 의도적으로 밀어야 닿게
  const DECAY_MS    = 300;   // 입력 끊김 후 게이지 감쇠 시작
  const SETTLE_PX   = 4;     // 바닥 판정 여유(소수점 오차)
  const SPEED_BONUS = 0.3;   // 속도 가중
  const NEAR_END    = 150;   // 안내 칩이 떠오르는 바닥 근접 거리(px)
  const ARM_AT      = 0.86;  // 이 진행값 이상이면 "곧 나감" 강조
  const REARM_MS    = 900;   // rearm 모드: 발동 후 재무장까지(연속 오발동 방지)

  const isAtBottom = (el) =>
    Math.ceil(el.scrollTop) + el.clientHeight >= el.scrollHeight - SETTLE_PX;

  function buildIndicator(parent, label) {
    const el = document.createElement("div");
    el.className = "oxit";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML =
      '<div class="oxit__glass">' +
        '<span class="oxit__arrow" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>' +
        '</span>' +
        '<span class="oxit__label"></span>' +
        '<span class="oxit__track"><i class="oxit__fill"></i></span>' +
      '</div>';
    el.querySelector(".oxit__label").textContent = label;
    parent.appendChild(el);
    return el;
  }

  function attach(opts) {
    const { scroller, host, label, onTrigger } = opts;
    if (!scroller || !host || typeof onTrigger !== "function") return;
    const rearm = !!opts.rearm;
    const canTrigger = opts.canTrigger;
    const ind = buildIndicator(host, label || "");   /* position:fixed — host 안 어디든 무방 */

    let accumulated = 0, decayTimer = null, decayRaf = null, navLock = false;

    let _pVal = 0, _pRaf = null, _armed = false;
    const setP = (p) => {                          // 프레임당 1번만 DOM 갱신
      _pVal = p;
      const armed = p >= ARM_AT;
      if (armed !== _armed) { _armed = armed; host.classList.toggle("is-exit-armed", armed); }
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

    let triggered = false, rearmTimer = null;
    function trigger() {
      if (triggered) return;
      triggered = true;                          // 관성 wheel 재진입 차단
      reset();
      clearTimeout(decayTimer); cancelAnimationFrame(decayRaf);
      /* 발동 직후 관성 wheel/touch 가 뒤 레이어로 흘러 튀는 것 방지 — 잠깐 흡수 */
      let idle;
      const unswallow = () => {
        clearTimeout(idle);
        window.removeEventListener("wheel", swallow, true);
        window.removeEventListener("touchmove", swallow, true);
      };
      const swallow = (ev) => {
        ev.stopImmediatePropagation();
        clearTimeout(idle);
        idle = setTimeout(unswallow, 120);
      };
      window.addEventListener("wheel", swallow, true);
      window.addEventListener("touchmove", swallow, true);
      setTimeout(unswallow, 800);
      if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) {} }
      onTrigger();
      /* rearm(about): host 를 닫지 않으므로 MutationObserver 가 안 돌아온다 → 직접 재무장 */
      if (rearm) {
        clearTimeout(rearmTimer);
        rearmTimer = setTimeout(() => { triggered = false; reset();
          host.classList.remove("is-near-end", "is-exit-armed"); }, REARM_MS);
      }
    }
    const blocked = () =>
      triggered || navLock ||
      !host.classList.contains("is-open") || host.classList.contains("is-closing") ||
      (canTrigger && !canTrigger());

    /* 바닥 근접 시 안내 칩 노출 */
    scroller.addEventListener("scroll", () => {
      const d = scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
      host.classList.toggle("is-near-end", d < NEAR_END);
    }, { passive: true });

    /* 프로그램 스크롤(점 네비 등) 동안 감지 일시 중단 */
    if (opts.navLockEvent) scroller.addEventListener(opts.navLockEvent, () => {
      navLock = true;
      clearTimeout(decayTimer);
      reset();
      setTimeout(() => (navLock = false), 340);
    });

    /* 데스크탑/트랙패드 */
    scroller.addEventListener("wheel", (e) => {
      if (blocked()) return;
      if (e.deltaY <= 0) { clearTimeout(decayTimer); reset(); return; }        // 위로
      if (!isAtBottom(scroller)) { clearTimeout(decayTimer); reset(); return; } // 바닥 아님
      const s = Math.abs(e.deltaY);
      add(s * (1 + s * SPEED_BONUS / 120));
      clearTimeout(decayTimer);
      decayTimer = setTimeout(easeReset, DECAY_MS);
    }, { passive: true });

    /* 모바일 터치 pull */
    let lastY = 0;
    scroller.addEventListener("touchstart", (e) => { lastY = e.touches[0].clientY; }, { passive: true });
    scroller.addEventListener("touchmove", (e) => {
      if (blocked()) return;
      const y = e.touches[0].clientY, dy = lastY - y; lastY = y;   // 양수 = 아래로 스와이프
      if (dy <= 0) { reset(); return; }
      if (!isAtBottom(scroller)) { reset(); return; }
      add(dy * 1.4);
    }, { passive: true });
    scroller.addEventListener("touchend", () => {
      if (accumulated > 0) { clearTimeout(decayTimer); decayTimer = setTimeout(easeReset, 80); }
    }, { passive: true });

    /* 오버레이가 닫히면 상태/클래스 초기화 (rearm 이 아닌 경우 여기서 triggered 복구) */
    new MutationObserver(() => {
      if (host.classList.contains("is-open")) return;
      if (!triggered && accumulated === 0 &&
          !host.classList.contains("is-near-end") &&
          !host.classList.contains("is-exit-armed")) return;
      clearTimeout(decayTimer); clearTimeout(rearmTimer);
      cancelAnimationFrame(decayRaf); cancelAnimationFrame(_pRaf); _pRaf = null;
      triggered = false;                         // 다음에 다시 열리면 제스처 복구
      reset();
      host.classList.remove("is-near-end", "is-exit-armed");
    }).observe(host, { attributes: true, attributeFilter: ["class"] });
  }

  /* ── about → client-works, client-works → 처음 화면 체이닝 등록 ── */
  function initAll() {
    const about = document.getElementById("about");
    const cw = document.getElementById("client-works");

    if (about && window.__aboutCtrl && !about.__oxitDone) {
      attach({
        scroller: about.querySelector(".about__scroll"),
        host: about,
        label: "한 번 더 스크롤하면 외주 작업으로 넘어갑니다",
        rearm: true,                                     // about 은 닫지 않고 유지(cw BACK 으로 복귀)
        navLockEvent: "overlay:navscroll",               // about.js jumpTo 가 발행(점 네비 오발동 방지)
        canTrigger: () => !(window.__clientWorksCtrl && window.__clientWorksCtrl.isOpen()),
        onTrigger: () => { if (window.__clientWorksCtrl) window.__clientWorksCtrl.open(); },
      });
      about.__oxitDone = true;
    }

    if (cw && window.__clientWorksCtrl && !cw.__oxitDone) {
      attach({
        scroller: cw.querySelector(".cw__scroll"),
        host: cw,
        label: "한 번 더 스크롤하면 처음 화면으로 돌아갑니다",
        onTrigger: () => {                               // cw 닫기 + about 열려 있으면 같이 닫아 원위치
          if (window.__clientWorksCtrl) window.__clientWorksCtrl.close();
          if (window.__aboutCtrl && window.__aboutCtrl.isOpen()) window.__aboutCtrl.close();
        },
      });
      cw.__oxitDone = true;
    }

    /* 대상이 존재하는데 컨트롤러가 아직이면 미완료로 보고 → 폴링 계속 */
    const aboutOk = !about || about.__oxitDone;
    const cwOk = !cw || cw.__oxitDone;
    return aboutOk && cwOk;
  }

  if (!initAll()) {                                // ctrl 로드 지연 대비 폴링
    let n = 0;
    const t = setInterval(() => { if (initAll() || ++n > 40) clearInterval(t); }, 80);
  }
})();
