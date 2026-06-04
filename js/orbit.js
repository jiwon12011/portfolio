/* =======================================================================
   orbit.js — 세로축 실린더(배럴) 캐러셀 · 인터랙티브
   -----------------------------------------------------------------------
   · 카드는 이미지#4 흩어진 배치(각자 높이 Y)를 유지한 채, 캐릭터(중앙)를
     세로축으로 회전한다. 좌우로 돌며 앞/뒤로 지나간다(평면 타원 아님).
   · 회전은 절대시간(elapsed)이 아니라 매 프레임 dt 로 phase 를 "누적"한다.
     → 호버 freeze / resume / 탭 복귀가 점프 없이 매끄럽다.
   · 인터랙션:
       - 호버/포커스 카드 → 전체 회전 freeze + 그 카드를 정면(z=1)으로 끌어옴
       - 마우스 좌우 위치 → 회전 속도 steering(바이어스)
       - 카드별 위상차 sin 으로 ±4px bobbing 부유
   · 깊이 리듬: 앞 크고 또렷(blur 금지), 뒤 작고 흐림(약한 blur 선택).
   · 빛 궤도: 여러 높이의 납작한 타원 링(배럴 케이지) + canvas 파티클.
   · perf: backdrop-filter 없음, 단일 rAF, transform/opacity/filter 만.
======================================================================= */
(() => {
  const CX  = 733;     // 중심 X (디자인 px, 1466 캔버스 기준)
  const RX  = 525;     // 수평 반경 (세로축 회전 반지름)
  const RPM = 0.05;    // 라디안/초 (한 바퀴 ≈ 126초)
  const CHARACTER_Z = 10;

  /* 카드 중심(이미지#4 배치) — DOM 순서와 동일 */
  const CENTERS = [
    { x: 355,  y: 190 }, // visual-archive
    { x: 733,  y: 158 }, // jaringobi
    { x: 506,  y: 420 }, // gwihon  (플레디스와 위치 교환 → 좌중앙)
    { x: 293,  y: 461 }, // about
    { x: 1184, y: 233 }, // pledis  (귀혼과 위치 교환 → 우상단)
    { x: 960,  y: 434 }, // yumi
    { x: 467,  y: 695 }, // poze
    { x: 965,  y: 682 }, // content-lab
    { x: 1174, y: 566 }, // skills
  ];
  const RING_YS = [206, 432, 660];  // 빛 궤도 링 높이

  /* 초기각: 이미지#4 X 위치 기반 + SPREAD 로 살짝 넓게. */
  const clamp01 = (v) => Math.max(-1, Math.min(1, v));
  const SPREAD = 1.32;
  const theta0 = CENTERS.map((c) => Math.asin(clamp01((c.x - CX) / RX)) * SPREAD);

  /* lerp + clamp + ease 유틸 */
  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const PHI = (1 + Math.sqrt(5)) / 2;     // bobbing 위상 분산(뭉침 방지)

  /* ── 인터랙션 상태 ───────────────────────────────────────────────
     phase     : 누적 회전각(라디안). dt 기반으로만 증가.
     speedMul  : 0(정지)~1(정속). speedTarget 으로 부드럽게 수렴(freeze).
     steer     : 마우스 좌우 바이어스(-1..1) → 회전 속도 가감.
     focusIdx  : 현재 정면화할 카드 index(-1 없음).
     focusAmt[]: 카드별 정면화 진행도(0→1) lerp 상태. */
  let phase = 0;
  let bobT = 0;           // 부유(bobbing) 전용 시간 — freeze 시 느려지되 멈추진 않음
  let speedMul = 1;
  let speedTarget = 1;
  let steer = 0;          // 목표 steering
  let steerSmooth = 0;    // 부드럽게 따라가는 steering
  let focusIdx = -1;
  let pendingLeave = 0;   // A→B 전환 글리치 방지용 rAF id
  const focusAmt = CENTERS.map(() => 0);

  /* depth(z) → 기본 시각 매핑 (focus 영향 전).
     앞(z=+1) 크고 또렷, 뒤(z=-1) 작고 흐림 — 깊이 리듬 강화. */
  function depthVis(z) {
    const t = (z + 1) / 2;                 // 0(뒤) ~ 1(앞)
    return {
      scale:   lerp(0.74, 1.16, t),        // 뒤 0.74 ~ 앞 1.16
      opacity: lerp(0.60, 1.0,  t),        // 뒤 0.60 ~ 앞 1.0
      blur:    z < 0 ? (1 - t / 0.5) * 1.5 : 0, // 뒤만 ≤1.5px, 앞은 0
      zi:      z >= 0 ? CHARACTER_Z + 5 : CHARACTER_Z - 5,
    };
  }

  /* ── DOM ─────────────────────────────────────────────────────── */
  const arms = [...document.querySelectorAll(".card-arm")];
  if (arms.length === 0) return;
  arms.forEach((a) => {
    a.style.willChange = "transform, opacity";  // filter 는 뒤 카드에만 가끔 → 상시 승격 X
    a.style.left = "0px";
    a.style.top = "0px";
  });
  const charEl = document.querySelector(".scene__character");
  if (charEl) charEl.style.zIndex = CHARACTER_Z;
  const stage = document.querySelector(".orbit-stage");

  /* 한 카드 배치
     · 회전 위치(rotX/rotZ)와 정면 위치(z=1, x=CX) 사이를 focusAmt 로 블렌드.
     · 비포커스 카드는 다른 카드가 포커스됐을 때 dim(어둡게+뒤로). */
  const FRONT_SCALE = 1.28;   // 정면화 카드 최대 스케일(임팩트↑)
  const FRONT_Z     = 30;     // 정면화 카드 zIndex
  const DIM_OPACITY = 0.42;   // 다른 카드 dim 시 곱
  const DIM_BRIGHT  = 0.78;   // 다른 카드 dim 밝기
  const DIM_SCALE   = 0.88;   // 다른 카드 dim 시 축소(원근 분리↑)

  function placeArm(arm, i, introAlpha) {
    const c = CENTERS[i];
    const θ = theta0[i] + phase;
    const s = Math.sin(θ);
    const z = Math.cos(θ);                 // depth: 앞(+1) ~ 뒤(-1)
    const rotX = CX + RX * s;
    const base = depthVis(z);

    const fa = easeOutCubic(focusAmt[i]);  // 정면화 진행도(ease — 더 고급스럽게)
    const someFocused = focusIdx !== -1;   // 어딘가 포커스 중
    const isFocused = focusIdx === i;

    /* 넓은 화면에서 카드를 중앙(733, 423.5)으로 살짝 모으기(gather).
       main.js 가 window.__cardGather 를 설정(1440 이하=1, 1920≈0.92). */
    const G = window.__cardGather || 1;
    /* 정면화: 위치는 그대로 두고 '제자리에서' 커지게만 한다.
       (중앙으로 이동시키면 커서가 카드를 들락거려 호버 on/off 가 떨림→지진) */
    const x = 733 + (rotX - 733) * G;
    const scale   = lerp(base.scale,   FRONT_SCALE, fa);
    let   opacity = lerp(base.opacity, 1.0,         fa);
    let   blur    = base.blur * (1 - fa);  // 정면화될수록 blur 제거
    let   zi      = isFocused ? FRONT_Z : base.zi;

    const yRaw = c.y + Math.sin(bobT * 0.9 + i * PHI * 6.283) * 4; // bobbing ±4px (황금비 분산)
    const y = 423.5 + (yRaw - 423.5) * G;

    /* 다른 카드가 포커스됐고 나는 아니면 dim(어둡게+뒤로) */
    if (someFocused && !isFocused) {
      const dimT = easeOutCubic(focusAmt[focusIdx]); // 포커스 카드 진행도만큼 dim
      opacity *= lerp(1, DIM_OPACITY, dimT);
      const bright = lerp(1, DIM_BRIGHT, dimT);
      scaleDimAndApply(arm, x, y, scale * lerp(1, DIM_SCALE, dimT), opacity, blur, bright, zi, introAlpha);
      return;
    }

    applyArm(arm, x, y, scale, opacity, blur, 1, zi, introAlpha);
  }

  /* transform/opacity/filter 인라인 적용 (공통) */
  function applyArm(arm, x, y, scale, opacity, blur, bright, zi, introAlpha) {
    const introScale = lerp(0.9, 1, introAlpha);  // 진입 시 살짝 작게 시작 → 떠오르듯
    arm.style.transform =
      `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) scale(${(scale * introScale).toFixed(4)})`;
    arm.style.opacity = (opacity * introAlpha).toFixed(4);
    arm.style.zIndex = zi;
    const f = [];
    if (blur   > 0.05) f.push(`blur(${blur.toFixed(2)}px)`);
    if (bright < 0.999) f.push(`brightness(${bright.toFixed(3)})`);
    arm.style.filter = f.length ? f.join(" ") : "none";
  }
  /* dim 경로용 얇은 래퍼(가독성) */
  function scaleDimAndApply(arm, x, y, scale, opacity, blur, bright, zi, introAlpha) {
    applyArm(arm, x, y, scale, opacity, blur, bright, zi, introAlpha);
  }

  /* ── 호버/포커스 바인딩 → freeze + 정면화 ───────────────────────── */
  arms.forEach((arm, i) => {
    const enter = () => {
      cancelAnimationFrame(pendingLeave);     // 다른 카드의 leave 대기 취소(A→B 글리치 차단)
      focusIdx = i; speedTarget = 0;
    };
    const leave = (e) => {
      // focusout: 포커스가 같은 arm 내부 요소로 이동하면 무시(focus-within)
      if (e && e.type === "focusout" && arm.contains(e.relatedTarget)) return;
      if (focusIdx !== i) return;
      // 1프레임 대기: 곧바로 다른 카드 enter 가 붙으면 취소되어 깜빡임 없음
      pendingLeave = requestAnimationFrame(() => {
        if (focusIdx === i) { focusIdx = -1; speedTarget = 1; }
      });
    };
    arm.addEventListener("mouseenter", enter);
    arm.addEventListener("mouseleave", leave);
    arm.addEventListener("focusin", enter);   // 내부 button/a 포커스 → 정면화
    arm.addEventListener("focusout", leave);
  });

  /* ── 마우스 steering: 화면 중앙 기준 mouseX(-0.5..0.5) → 속도 바이어스 ── */
  window.addEventListener("pointermove", (e) => {
    steer = clamp((e.clientX / window.innerWidth - 0.5) * 2, -1, 1);
  }, { passive: true });
  window.addEventListener("pointerleave", () => { steer = 0; }, { passive: true });

  /* ── 빛 궤도 SVG: 여러 높이의 납작한 타원 링(배럴 케이지) ───────── */
  const svgNS = "http://www.w3.org/2000/svg";
  const RY = 80;                            // 링 납작함(원근)
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "orbit-ring-svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", "0 0 1466 847");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;z-index:4;pointer-events:none;overflow:visible";
  const rings = RING_YS.map(
    (cy) => `<ellipse cx="${CX}" cy="${cy}" rx="${RX}" ry="${RY}" fill="none"
      stroke="url(#orbitGrad)" stroke-width="1.4" filter="url(#orbit-glow)"/>`
  ).join("");
  svg.innerHTML = `
    <defs>
      <filter id="orbit-glow" x="-20%" y="-160%" width="140%" height="420%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b1"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="9"   result="b2"/>
        <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="orbitGrad" gradientUnits="userSpaceOnUse" x1="${CX - RX}" y1="0" x2="${CX + RX}" y2="0">
        <stop offset="0%"   stop-color="rgba(150,190,240,0.16)"/>
        <stop offset="50%"  stop-color="rgba(220,238,255,0.72)"/>
        <stop offset="100%" stop-color="rgba(150,190,240,0.16)"/>
      </linearGradient>
    </defs>
    ${rings}
  `;
  stage.insertBefore(svg, stage.firstChild);

  /* ── 파티클 canvas (링 따라 흐르는 빛) ──────────────────────────── */
  const canvas = document.createElement("canvas");
  canvas.className = "orbit-particles";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;z-index:5;pointer-events:none";
  stage.insertBefore(canvas, svg.nextSibling);
  const ctx = canvas.getContext("2d");

  let cW = 1466, cH = 847, canvasDirty = true;
  function resizeCanvas() {
    if (!canvasDirty) return;
    canvasDirty = false;
    const r = stage.getBoundingClientRect();
    cW = r.width || 1466;
    cH = r.height || 847;
    canvas.width = cW;
    canvas.height = cH;
  }

  const MAX_P = matchMedia("(max-width:768px)").matches ? 0 : 42;
  const parts = Array.from({ length: MAX_P }, (_, i) => ({
    ring: i % RING_YS.length,
    phase: Math.PI * 2 * (i / MAX_P),
    speed: 0.005 + Math.random() * 0.006,
    size: 0.9 + Math.random() * 1.6,
    alpha: 0.45 + Math.random() * 0.5,
  }));

  /* ── rAF (dt 기반 누적) ────────────────────────────────────────
     last : 직전 프레임 ts. tShow : 누적 표시 시간(intro/파티클용). */
  let last = null, rafId = null, tShow = 0;
  function tick(ts) {
    if (last === null) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (dt > 0.1) dt = 0.1;                 // 탭 복귀 등 폭주 방지(추가 안전망)
    tShow += dt;
    bobT  += dt * lerp(0.2, 1.0, speedMul); // 부유: freeze 시 느려지되 멈추진 않음

    /* 속도 수렴(freeze/resume) + steering 평활화(느리게 → 잔떨림 흡수) */
    speedMul    += (speedTarget - speedMul) * Math.min(dt * 6, 1);
    steerSmooth += (steer - steerSmooth)    * Math.min(dt * 2.2, 1);

    /* 바운디드 스윙: 한 바퀴 안 돌고 ±일정 각도 안에서만 흔들린다 →
       중간이 비지 않고, 마우스로 밀 수 있어 '내가 제어'하는 느낌.
       freeze(speedMul→0) 시 현재 위치 고정. */
    // 두 고조파를 겹쳐 단조로운 좌우왕복 느낌 제거
    const idle = 0.20 * Math.sin(tShow * 0.28) + 0.045 * Math.sin(tShow * 0.17 + 1.1);
    const phaseTarget = idle + steerSmooth * 0.42;      // + 마우스로 밀기(차분하게)
    phase += (phaseTarget - phase) * Math.min(dt * 3.5, 1) * speedMul;

    /* 카드별 정면화 진행도 lerp(부드러운 전이) */
    arms.forEach((_, i) => {
      const target = i === focusIdx ? 1 : 0;
      focusAmt[i] += (target - focusAmt[i]) * Math.min(dt * 7, 1);
    });

    /* 인트로: 카드마다 시작 시간을 어긋나게(stagger) + ease → 시네마틱 진입 */
    const INTRO_STAGGER = 0.06, INTRO_DUR = 0.55;
    arms.forEach((a, i) => {
      const t = clamp((tShow - i * INTRO_STAGGER) / INTRO_DUR, 0, 1);
      placeArm(a, i, easeOutCubic(t));
    });

    /* 파티클 */
    resizeCanvas();
    ctx.clearRect(0, 0, cW, cH);
    const sx = cW / 1466, sy = cH / 847;
    const introGlobal = Math.min(tShow / 0.7, 1);
    const pSpeed = lerp(0.75, 1.0, speedMul); // freeze 시 완전 정지 대신 75% 유지(ambient)
    parts.forEach((p) => {
      p.phase += p.speed * pSpeed;
      const cyR = RING_YS[p.ring];
      const x = (CX + RX * Math.sin(p.phase)) * sx;
      const y = (cyR + RY * Math.cos(p.phase)) * sy;
      const z = Math.cos(p.phase);
      const br = 0.4 + (z + 1) / 2 * 0.6;
      const r = p.size * (0.7 + (z + 1) / 2 * 0.6) * introGlobal;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      g.addColorStop(0, `rgba(210,235,255,${(p.alpha * br * 0.7).toFixed(3)})`);
      g.addColorStop(1, "rgba(127,174,229,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r * 4, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(242,249,255,${(p.alpha * br).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    });

    rafId = requestAnimationFrame(tick);
  }

  function startRAF() {
    if (rafId) return;
    last = null;                            // 첫 dt 폭주 방지
    rafId = requestAnimationFrame(tick);
  }
  function stopRAF() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  /* ── 시작 / reduced-motion ──────────────────────────────────── */
  document.documentElement.classList.add("orbit-active");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // 정적 = 이미지#4 배치. 회전은 없지만 호버 정면화는 살짝 살린다.
    arms.forEach((a, i) => placeArm(a, i, 1));
    arms.forEach((arm, i) => {
      arm.addEventListener("mouseenter", () => { focusAmt[i] = 1; focusIdx = i; redrawStatic(); });
      arm.addEventListener("mouseleave", () => { focusAmt[i] = 0; if (focusIdx === i) focusIdx = -1; redrawStatic(); });
      arm.addEventListener("focusin",  () => { focusAmt[i] = 1; focusIdx = i; redrawStatic(); });
      arm.addEventListener("focusout", (e) => {
        if (arm.contains(e.relatedTarget)) return;
        focusAmt[i] = 0; if (focusIdx === i) focusIdx = -1; redrawStatic();
      });
    });
    function redrawStatic() { arms.forEach((a, i) => placeArm(a, i, 1)); }
    return;
  }

  resizeCanvas();
  window.addEventListener("resize", () => { canvasDirty = true; }, { passive: true });
  arms.forEach((a, i) => placeArm(a, i, 0)); // 즉시 초기 배치(코너 플래시 방지)
  startRAF();

  /* 탭 숨김 시 rAF 정지, 복귀 시 last 리셋 후 재시작(첫 dt 폭주 방지) */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopRAF();
    else startRAF();
  });
  window.addEventListener("pagehide", stopRAF);
})();
