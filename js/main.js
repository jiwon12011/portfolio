/* =======================================================================
   main.js — 진입 연출 + (예약) orbit
   ---------------------------------------------------------------------
   현재: 카드 staggered fade-in, like/play 토글, reduced-motion 존중
   예약: 캐릭터(중앙) 기준 orbit. .card-arm 의 data-angle/radius/orbit-speed
         를 읽어 GSAP 으로 공전 + 카드 counter-rotate 예정.
======================================================================= */
(() => {
  const root = document.documentElement;
  root.classList.remove("no-js");

  /* ---- 균일 스케일: 1466×847 디자인 캔버스를 뷰포트에 cover 확대 ----
     --scale = max(vw/1466, vh/847). 배경(cover)과 같은 배율·중심이라
     카드 좌표(디자인 px)가 캐릭터와 항상 정렬된다. 1440·1920 동일 비율. */
  const DW = 1466, DH = 847;
  function fitScale() {
    // cover: 배경 사진이 화면을 꽉 채우고 인물·카드 전부 같은 배율로 커진다.
    // (세로 긴 창일수록 좋음. 아주 납작한 창에선 위/아래 카드가 일부 잘릴 수 있음 →
    //  전체화면 ⌃⌘F 권장)
    const w = window.innerWidth;
    const s = Math.max(w / DW, window.innerHeight / DH);
    root.style.setProperty("--scale", s.toFixed(5));
    // 1920 등 넓은 화면에서 cover 로 카드가 커 보이는 걸 완화 — 배경/인물은 그대로,
    // 카드만 살짝 축소(1440 이하=1 → 1920≈0.88).
    const k = w <= 1440 ? 1 : Math.max(0.85, 1 - (w - 1440) * 0.00025);
    root.style.setProperty("--card-k", k.toFixed(4));
  }
  fitScale();
  window.addEventListener("resize", fitScale, { passive: true });

  root.classList.add("js-ready");

  /* ---- 좋아요 토글: 상태는 클래스로만(색/채움은 CSS), aria-pressed 노출 ---- */
  document.querySelectorAll(".card__like").forEach((btn) => {
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      const on = btn.classList.toggle("is-liked");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  });

  /* ---- 플레이스홀더 링크(아직 목적지 없음) 점프 방지 ---- */
  document.querySelectorAll('.card__hit, .card__more').forEach((el) => {
    el.addEventListener("click", (e) => { e.preventDefault(); /* TODO: → 프로젝트 인트로 */ });
  });

  /* ---- 플레이/일시정지 토글 (자린고비·POZE) ---- */
  document.querySelectorAll(".player__play").forEach((btn) => {
    const PLAY = "M8 5v14l11-7z";
    const PAUSE = "M8 5h3v14H8zM13 5h3v14h-3z";
    const sync = () => {
      const playing = btn.classList.contains("is-playing");
      const p = btn.querySelector("svg path");
      if (p) p.setAttribute("d", playing ? PAUSE : PLAY);
      btn.setAttribute("aria-label", playing ? "일시정지" : "재생");
      btn.setAttribute("aria-pressed", playing ? "true" : "false");
    };
    sync();
    btn.addEventListener("click", () => { btn.classList.toggle("is-playing"); sync(); });
  });

  /* =====================================================================
     ORBIT (예약) — motion-engineer 설계 기준
     ---------------------------------------------------------------------
     window.JIWON_ORBIT = true 로 켜면, GSAP 로드 후 아래가 동작하도록
     붙일 예정. data 속성은 이미 DOM 에 들어있다.

     const center = 캐릭터 위치(배경 사진 기준 % → px)
     arms.forEach(arm => {
       const angle  = +arm.dataset.angle;
       const radius = +arm.dataset.radius;
       const speed  = +arm.dataset.orbitSpeed || 1;
       // arm.style.left/top → center 로 통일하고
       // transform: rotate(angle) translateX(radius) 로 배치
       // gsap.to(arm, { '--angle': angle+360, duration: 40/speed, repeat:-1, ease:'none' })
       // 카드 본체는 counter-rotate 로 수평 유지
     });
     if (prefersReduced) → 회전 없이 정지 배치만.
  ===================================================================== */
})();
