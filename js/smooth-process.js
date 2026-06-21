/* =======================================================================
   smooth-process.js — 제작 과정 모달 "전용" 부드러운 스크롤(경량 커스텀)
   -----------------------------------------------------------------------
   · 대상: 자린고비(#process) · POZE(#process-poze) · 귀혼(#process-gwihon) · 유미(#process-yumi) · 플레디스(#process-pledis)
   · 본문은 모달 내부 커스텀 스크롤러(.process__content)가 스크롤되는 구조라
     Lenis(content transform 방식)와 충돌 → 네이티브 scrollTop 을 매 프레임 lerp
     보간하는 경량 방식으로 직접 구현한다.
   · 루프는 gsap.ticker(이미 매 프레임 구동) 사용, 미로드 시 requestAnimationFrame.
   · 네이티브 scrollTop 을 쓰므로 ScrollTrigger / 스크롤스파이 / 오버스크롤 종료가
     모두 그대로 동작한다(스크롤 이벤트 그대로 발생).
   · scroll-behavior 는 CSS 에서 해당 모달 한정 auto 로 덮어 이중 스무딩을 막는다.
   · 가장자리(맨 위/아래)에서 더 밀면 네이티브에 양보 → 오버스크롤 종료 제스처 유지.
   · prefers-reduced-motion → 비활성(네이티브 스크롤).
   · window.__processLenis[project].scrollTo(top,opt) 노출 → process.js 트랙 클릭이 사용.
======================================================================= */
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  window.__processLenis = window.__processLenis || {};
  /* 상상의문·playlist는 모달 scale+scrub 컨텍스트라 lerp 적용 시 스크롤 멈춤/프리즈 → 제외(native 유지) */
  const SELECTORS = ["#process", "#process-poze", "#process-gwihon", "#process-yumi", "#process-pledis", "#process-mathhub"];
  const EASE = 0.11;            // 0~1, 클수록 더 즉각적(작을수록 더 미끄럽게). 천천히 보기용 0.11
  const DEFAULT_MULT = 0.8;     // 휠 한 번에 이동량(작을수록 천천히 탐색)

  const setup = (modal, scrollerSel = ".process__content", ease = EASE, mult = DEFAULT_MULT) => {
    const scroller = modal.querySelector(scrollerSel);
    if (!scroller) return;

    let target = scroller.scrollTop;
    let current = scroller.scrollTop;
    let active = false;           // 모달 열렸을 때만 휠 가로채기

    const maxScroll = () => scroller.scrollHeight - scroller.clientHeight;
    const clamp = (v) => Math.max(0, Math.min(v, maxScroll()));

    /* 매 프레임 보간 */
    const onTick = () => {
      if (!active) return;
      const diff = target - current;
      if (Math.abs(diff) < 0.5) {
        /* 유휴: 스크롤바/키보드 등 외부 변화에 목표 동기화 */
        if (Math.abs(scroller.scrollTop - current) > 1) current = target = scroller.scrollTop;
        return;
      }
      current += diff * ease;
      scroller.scrollTop = current;   // scroll 이벤트 발생 → ScrollTrigger 등 자동 갱신
    };
    if (window.gsap && window.gsap.ticker) {
      window.gsap.ticker.add(onTick);
    } else {
      const loop = () => { onTick(); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }

    scroller.addEventListener("wheel", (e) => {
      if (!active || e.ctrlKey) return;            // 핀치 줌 등은 패스
      const max = maxScroll();
      if (Math.abs(scroller.scrollTop - current) > 1) current = target = scroller.scrollTop;
      const atTop = current <= 0.5;
      const atBottom = current >= max - 0.5;
      /* 가장자리에서 더 밀면 네이티브에 양보(오버스크롤 종료 제스처 등) */
      if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) return;
      e.preventDefault();
      let d = e.deltaY;
      if (e.deltaMode === 1) d *= 16;              // 라인 단위
      else if (e.deltaMode === 2) d *= scroller.clientHeight; // 페이지 단위
      target = clamp(target + d * mult);
    }, { passive: false });

    /* 트랙 클릭/리셋용 — process.js 가 호출 */
    const scrollTo = (top, opt) => {
      target = clamp(top);
      if (opt && opt.immediate) { current = target; scroller.scrollTop = target; }
    };
    if (modal.dataset.project) window.__processLenis[modal.dataset.project] = { scrollTo };
    else if (modal.id === "about") window.__aboutLenis = { scrollTo };

    /* 모달 열림/닫힘 동기화 */
    const sync = () => {
      if (modal.classList.contains("is-open")) {
        active = true;
        current = target = scroller.scrollTop;
      } else {
        active = false;
      }
    };
    new MutationObserver(sync).observe(modal, { attributes: true, attributeFilter: ["class"] });
    sync();
  };

  SELECTORS.forEach((sel) => {
    const modal = document.querySelector(sel);
    if (modal) setup(modal);
  });

  /* ABOUT/LAB/PROJECTS 풀페이지(#about, 스크롤러 .about__scroll)도 동일 방식 적용.
     섹션 점프(about.js)는 gsap 으로 scrollTop 보간 → 휠 lerp 는 유휴 동기화로 공존. */
  /* About 은 페이지가 길고 트랙패드 관성에 확 쏠려 → 감도(mult)↓ + 더 미끄럽게(ease↓) */
  const aboutModal = document.querySelector("#about");
  if (aboutModal) setup(aboutModal, ".about__scroll", 0.09, 0.5);
})();
