/* =======================================================================
   lenis-gwihon.js — 귀혼 제작 과정 모달 "전용" 부드러운 스크롤 (Lenis)
   -----------------------------------------------------------------------
   · 귀혼 본문은 모달 내부 커스텀 스크롤러(#process-gwihon .process__content)가
     스크롤되는 구조라, Lenis 를 그 컨테이너에 바인딩한다(전체 페이지 X).
   · GSAP ScrollTrigger 와 동기화(lenis.on('scroll', ST.update) + gsap.ticker raf).
   · 모달이 열렸을 때만 동작(start/stop), 열릴 때 치수 재계산(resize).
   · prefers-reduced-motion → 부드러운 스크롤 비활성(네이티브 스크롤 유지).
   · window.__processLenis.gwihon 로 노출 → process.js 트랙 클릭이 lenis.scrollTo 사용.
======================================================================= */
(() => {
  const init = () => {
    if (!window.Lenis || !window.gsap) return false;

    const modal = document.querySelector("#process-gwihon");
    const scroller = modal && modal.querySelector(".process__content");
    if (!scroller) return true; // 마크업 없으면 통과

    /* 모션 최소화 존중 — 부드러운 스크롤 끔 */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

    const { gsap } = window;
    const ST = window.ScrollTrigger;

    const lenis = new window.Lenis({
      wrapper: scroller,
      content: scroller,           // 자식이 여러 개라 wrapper 자체로 측정
      duration: 1.05,              // 관성 길이(클수록 더 미끄럽게)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,          // 모바일 터치는 네이티브 유지
      wheelMultiplier: 1,
      autoRaf: false,              // raf 는 gsap.ticker 가 구동
    });
    lenis.stop();                  // 닫혀 있을 땐 정지

    /* ScrollTrigger 동기화 */
    if (ST) lenis.on("scroll", ST.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    /* process.js 트랙 클릭이 사용할 수 있게 전역 등록 */
    window.__processLenis = window.__processLenis || {};
    window.__processLenis.gwihon = lenis;

    /* 모달 열림/닫힘에 맞춰 동작 토글 + 치수 재계산 */
    const sync = () => {
      if (modal.classList.contains("is-open")) {
        lenis.resize();
        lenis.scrollTo(0, { immediate: true });
        lenis.start();
      } else {
        lenis.stop();
      }
    };
    new MutationObserver(sync).observe(modal, { attributes: true, attributeFilter: ["class"] });
    sync(); // 이미 열려 있으면 즉시 반영

    return true;
  };

  /* defer 순서상 보통 준비되지만 CDN 지연 시 폴링 */
  if (!init()) {
    let n = 0;
    const t = setInterval(() => {
      if (init() || ++n > 40) clearInterval(t);
    }, 80);
  }
})();
