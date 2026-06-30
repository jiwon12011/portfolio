/* =====================================================================
   orbit-mobile.js — 모바일 세로 전용 터치 오빗 다이얼 (D안 v1.1)
   활성 조건: matchMedia("(max-width:1024px) and (orientation:portrait)")

   [v1.1 구조 변경] 개별 perspective() → 공유 perspective + preserve-3d 링
   ┌ .orbit-dial          : CSS perspective 속성 스테이지 (position:fixed anchor)
   │  └ .dial-ring        : transform-style:preserve-3d, rotateY(angle) 회전
   │     ├ .card-arm[yumi]: translate(-50%,-50%) rotateY(0deg)   translateZ(R)  — 정적
   │     ├ .card-arm[...]  translate(-50%,-50%) rotateY(45deg)  translateZ(R)  — 정적
   │     └ ...
   └ .dial-about-capsule  : 글래스 ABOUT 버튼 (fixed)

   정면 카드는 링 회전 후 항상 anchor 중앙(=뷰포트 가로 50%)에 정확히 위치.
   scale 강조는 .card 자식에 적용 → preserve-3d 컨텍스트 불변.
   데스크톱/태블릿: 즉시 return → 기존 orbit.js 경로 완전 불변.
   ===================================================================== */
(() => {
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     튜닝 상수 — designer / perf 리뷰 시 이 블록만 조정
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  const DIAL_R        = 160;    // 링 반경(px, 뷰포트 기준). 클수록 카드 간격 넓음.
  const PERSP         = 500;    // perspective(px). 작을수록 원근 과장.
  const CARD_W        = 130;    // 카드 너비(px, 뷰포트 기준).
  const DIAL_BOTTOM   = "28vh"; // 스테이지 하단 여백. 링 중심 Y 위치 제어.
  const FRICTION      = 0.90;   // 관성 감속(1=무마찰, 0=즉시). 올리면 오래 미끄러짐.
  const INERTIA_SCALE = 0.55;   // touchend velocity → 관성 초기 속도 배율.
  const DRAG_THRESH   = 8;      // tap/drag 판별 임계(px).
  const SNAP_LERP     = 0.14;   // 스냅 lerp 계수(프레임당). 클수록 빠른 스냅.
  const SNAP_DONE     = 0.12;   // 스냅 완료 판단 오차(deg).
  const FRONT_SCALE   = 1.08;   // 정면 카드 .card scale-up 배율.
  const DIM_OPACITY   = 0.45;   // 뒤 카드 opacity 최솟값.
  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

  /* ── 게이트 ──────────────────────────────────────────────────────── */
  const GATE = matchMedia("(max-width:1024px) and (orientation:portrait)");
  if (!GATE.matches) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ── 카드 분류 ───────────────────────────────────────────────────
     PROJECT_KEYS 순서 = deck.js 패널 순서 = PROJECTS 목차 순서.
     순서 변경 시 탭 진입이 다른 인트로로 연결되므로 주의.           */
  const PROJECT_KEYS     = ["yumi","jaringobi","gwihon","mathhub","pledis","poze","sangsang","playlist"];
  const NON_PROJECT_KEYS = ["visual-archive","about","content-lab","skills"];
  const CARD_COUNT = PROJECT_KEYS.length; // 8
  const ANGLE_STEP = 360 / CARD_COUNT;   // 45deg

  /* ── DOM 준비 ───────────────────────────────────────────────────── */
  const scene = document.querySelector(".scene.deck-panel");
  if (!scene) return;

  const projArms = PROJECT_KEYS
    .map(k => document.querySelector(`.card-arm[data-card="${k}"]`))
    .filter(Boolean);
  if (projArms.length === 0) return;

  /* 비프로젝트 카드 숨김 */
  NON_PROJECT_KEYS.forEach(k => {
    const el = document.querySelector(`.card-arm[data-card="${k}"]`);
    if (el) el.style.display = "none";
  });

  document.documentElement.classList.add("is-dial");

  /* ── 스테이지(.orbit-dial) + 링(.dial-ring) 생성 ─────────────────
     .orbit-dial: CSS perspective 속성으로 공유 소실점 설정. width/height:0 인
                  fixed anchor → 뷰포트 가로 50% 에 정확히 고정됨.
                  perspect-origin:50% 50% = anchor 중심점.
     .dial-ring:  transform-style:preserve-3d. JS가 rotateY(angle) 만 갱신.
                  카드들의 3D 위치는 링에서 상속.
  ─────────────────────────────────────────────────────────────────── */
  const dial = document.createElement("div");
  dial.className = "orbit-dial";
  dial.setAttribute("role", "group");
  dial.setAttribute("aria-label", "프로젝트 목록 — 좌우로 드래그해 탐색");
  scene.appendChild(dial);

  const ring = document.createElement("div");
  ring.className = "dial-ring";
  dial.appendChild(ring);

  /* 프로젝트 카드 → .dial-ring 이동.
     각 카드 3D 위치: translate(-50%,-50%) rotateY(i*45deg) translateZ(R) — 정적.
     angle 이 포함되지 않음 → 링이 돌면 카드도 같이 돔.
     기존 deck.js click 리스너는 arm 에 직접 바인딩돼 이동 후에도 유지됨.  */
  projArms.forEach((arm, i) => {
    arm.style.left    = "0";
    arm.style.top     = "0";
    arm.style.width   = CARD_W + "px";
    arm.style.opacity = "0"; // fade-in 전 숨김
    arm.style.transform =
      `translate(-50%, -50%) rotateY(${(i * ANGLE_STEP).toFixed(2)}deg) translateZ(${DIAL_R}px)`;
    ring.appendChild(arm);
  });

  /* .card 자식 캐싱 — scale 적용용(applyDial 내 querySelector 반복 회피) */
  const projCards = projArms.map(arm => arm.querySelector(".card"));

  /* ── ABOUT 캡슐 ──────────────────────────────────────────────────── */
  const capsule = document.createElement("button");
  capsule.className = "dial-about-capsule";
  capsule.type      = "button";
  capsule.setAttribute("aria-label", "About · Skills · Archive 보기");
  capsule.innerHTML =
    `<span>ABOUT</span>` +
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"` +
    ` stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
    `<path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
  capsule.addEventListener("click", () => {
    if (window.__aboutCtrl) window.__aboutCtrl.open("resume");
  });
  scene.appendChild(capsule);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     회전 상태
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  let angle    = 0;
  let velocity = 0;
  let snapping = false;
  let snapTgt  = 0;
  let rafId    = null;

  function getFrontIdx() {
    const norm = ((-angle % 360) + 360) % 360;
    return Math.round(norm / ANGLE_STEP) % CARD_COUNT;
  }

  /* 카드 i의 정적 각도(i*45deg)가 현재 angle 기준 정면에서 얼마나 떨어졌나(0~180deg) */
  function absDiff(staticAngle) {
    const eff = (((staticAngle + angle) % 360) + 360) % 360;
    return eff > 180 ? 360 - eff : eff;
  }

  /* ── applyDial ──────────────────────────────────────────────────
     핵심: ring.style.transform 1회 갱신 = 8카드 전부 이동(preserve-3d).
     카드 arm의 정적 transform(rotateY+translateZ)은 절대 건드리지 않음.
     scale은 .card 자식에 적용해 preserve-3d 컨텍스트를 보존.
  ─────────────────────────────────────────────────────────────── */
  function applyDial() {
    /* 링 전체 회전 — 1회 DOM 쓰기로 8카드 전부 이동 */
    ring.style.transform = `rotateY(${angle.toFixed(2)}deg)`;

    const front = getFrontIdx();
    projArms.forEach((arm, i) => {
      const diff    = absDiff(i * ANGLE_STEP);
      const isFront = (i === front);
      const t       = 1 - diff / 180; // 1=정면, 0=뒤

      /* opacity: 정면=1, 뒤=DIM_OPACITY */
      const op = isFront
        ? 1.0
        : Math.max(DIM_OPACITY, DIM_OPACITY + (1 - DIM_OPACITY) * t * 0.5);
      arm.style.opacity = op.toFixed(3);

      /* scale: .card 자식에 적용 → arm의 3D transform(preserve-3d) 불변 유지 */
      const sc = isFront ? FRONT_SCALE : (0.88 + 0.12 * t);
      if (projCards[i]) projCards[i].style.transform = `scale(${sc.toFixed(4)})`;

      arm.classList.toggle("dial-front", isFront);
      arm.style.setProperty("--fglow", isFront ? "0.7" : "0");
    });
  }

  /* ── startSnap ─────────────────────────────────────────────────── */
  function startSnap() {
    const nearest = Math.round(-angle / ANGLE_STEP) * ANGLE_STEP;
    snapTgt  = -nearest;
    snapping = true;
    if (reducedMotion) {
      angle    = snapTgt;
      snapping = false;
      applyDial();
      return;
    }
    startRAF();
  }

  /* ── rAF 루프 ─────────────────────────────────────────────────────
     idle(스냅 완료, velocity=0)에서 rafId=null → 연산 0.             */
  function tick() {
    const root = document.documentElement;
    if (root.classList.contains("process-open") || root.classList.contains("about-open")) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    if (snapping) {
      const d = snapTgt - angle;
      if (Math.abs(d) < SNAP_DONE) {
        angle    = snapTgt;
        snapping = false;
        applyDial();
        rafId    = null;
        return;
      }
      angle += d * SNAP_LERP;
      applyDial();
      rafId = requestAnimationFrame(tick);
      return;
    }

    if (Math.abs(velocity) < 0.08) {
      velocity = 0;
      startSnap();
      return;
    }
    angle    += velocity;
    velocity *= FRICTION;
    applyDial();
    rafId = requestAnimationFrame(tick);
  }

  function startRAF() { if (!rafId) rafId = requestAnimationFrame(tick); }
  function stopRAF()  { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     드래그 / 터치 인터랙션
     DRAG_THRESH 미만 = tap(click 통과), 이상 = drag(click 취소).
     터치는 card → dial-ring → .orbit-dial 로 버블링 → dial 리스너 발동.
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  let ptStartX = 0;
  let ptLastX  = 0;
  let ptLastT  = 0;
  let ptActive = false;
  let didDrag  = false;
  let totalDx  = 0;

  /* px → deg: 화면 절반 너비 드래그 = 180deg 회전 */
  function pxToDeg(dx) {
    return dx * (180 / (window.innerWidth * 0.5));
  }

  function onDown(clientX) {
    const root = document.documentElement;
    if (root.classList.contains("process-open") || root.classList.contains("about-open")) return;
    ptStartX = clientX;
    ptLastX  = clientX;
    ptLastT  = performance.now();
    ptActive = true;
    didDrag  = false;
    totalDx  = 0;
    velocity = 0;
    snapping = false;
    stopRAF();
  }

  function onMove(clientX) {
    if (!ptActive) return;
    const dx = clientX - ptLastX;
    totalDx += Math.abs(clientX - ptStartX);
    if (totalDx >= DRAG_THRESH) didDrag = true;
    if (!didDrag) return;

    angle += pxToDeg(dx);
    const now = performance.now();
    const dt  = now - ptLastT;
    if (dt > 0 && dt < 120) velocity = pxToDeg(dx) * (16 / dt);
    ptLastX = clientX;
    ptLastT = now;
    applyDial();
  }

  function onUp() {
    if (!ptActive) return;
    ptActive = false;
    if (!didDrag) return; // tap → click 통과
    if (reducedMotion || Math.abs(velocity) < 0.5) {
      velocity = 0;
      startSnap();
    } else {
      velocity *= INERTIA_SCALE;
      startRAF();
    }
  }

  /* 터치 이벤트 */
  dial.addEventListener("touchstart", (e) => {
    onDown(e.touches[0].clientX);
  }, { passive: true });

  dial.addEventListener("touchmove", (e) => {
    onMove(e.touches[0].clientX);
    if (didDrag) e.preventDefault();
  }, { passive: false });

  dial.addEventListener("touchend", (e) => {
    if (didDrag) e.preventDefault();
    onUp();
  }, { passive: false });

  dial.addEventListener("touchcancel", () => {
    ptActive = false; didDrag = false; velocity = 0; startSnap();
  }, { passive: true });

  /* 마우스(포인터) 이벤트 */
  dial.addEventListener("mousedown", (e) => onDown(e.clientX));
  window.addEventListener("mousemove", (e) => { if (ptActive) onMove(e.clientX); }, { passive: true });
  window.addEventListener("mouseup",   () => onUp(), { passive: true });

  /* drag 후 click 캡처 단계 차단 */
  dial.addEventListener("click", (e) => {
    if (didDrag) { e.stopPropagation(); e.preventDefault(); didDrag = false; }
  }, true);

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     초기 배치 + 스태거 fade-in
     orbit.js early-return → .card-arm { opacity:0 } CSS 상태 유지 중.
     1단계: 링/카드 scale 즉시 세팅(opacity 0 유지).
     2단계: 스태거 딜레이 후 각 카드 목표 opacity 로 fade-in.
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  ring.style.transform = "rotateY(0deg)";

  /* 초기 scale/class 세팅 (angle=0, 카드0=정면) */
  projCards.forEach((card, i) => {
    if (!card) return;
    const diff = absDiff(i * ANGLE_STEP); // angle=0이므로 i*45deg
    const t    = 1 - diff / 180;
    card.style.transform = `scale(${(i === 0 ? FRONT_SCALE : (0.88 + 0.12 * t)).toFixed(4)})`;
  });
  if (projArms[0]) {
    projArms[0].classList.add("dial-front");
    projArms[0].style.setProperty("--fglow", "0.7");
  }

  if (reducedMotion) {
    applyDial();
  } else {
    projArms.forEach((arm, i) => {
      setTimeout(() => {
        const diff     = absDiff(i * ANGLE_STEP);
        const isFront  = (i === 0);
        const t        = 1 - diff / 180;
        const targetOp = isFront
          ? 1.0
          : Math.max(DIM_OPACITY, DIM_OPACITY + (1 - DIM_OPACITY) * t * 0.5);
        arm.style.transition = "opacity 0.5s ease";
        arm.style.opacity    = targetOp.toFixed(3);
        setTimeout(() => { arm.style.transition = ""; }, 560);
      }, 100 + i * 55);
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopRAF();
  });

})();
