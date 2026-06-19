/* =======================================================================
   making-playlist.js — 우리 사이의 음표 제작과정 (보수적 안전 모션)
   -----------------------------------------------------------------------
   · 네이티브 스크롤(smooth-process 미포함) → scrub/pin 금지, once 진입만
   · 레이아웃을 건드리지 않는 안전 요소만 모션:
     - pl6 캐릭터 카드(.pl-narcard, left-edge 절대배치 → transform 안전)
       통통 등장(opacity+y+scale, clearProps로 원복)
   · transform/opacity 만, prefers-reduced-motion 가드, 미발동 안전망
   · (이전 풀세트 모션은 native 스크롤에서 레이아웃을 깨뜨려 보류)
======================================================================= */
(() => {
  const init = () => {
    if (!window.gsap || !window.ScrollTrigger) return false;
    const scroller = document.querySelector("#process-playlist .process__content");
    if (!scroller) return true;

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    /* reduced-motion → 모션 없이 정상 표시 */
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return true;

    /* ── pl6 캐릭터 단일 이미지 6개 — 하나씩 등장 ──
       .pl-narcard__fig 는 left/bottom 절대배치(translateX 센터링 없음) → transform 안전
       카드(틀)는 정적, 캐릭터만 아래에서 쏙 올라오며 등장 (카드별 once 트리거 → 하나씩) */
    const figs = Array.from(scroller.querySelectorAll("#pl6 .pl-narcard__fig"));
    figs.forEach((fig) => {
      gsap.from(fig, {
        opacity: 0, y: 46, scale: 0.9, transformOrigin: "50% 100%",
        duration: 0.78, ease: "back.out(1.6)",
        scrollTrigger: { trigger: fig.closest(".pl-narcard") || fig, scroller, start: "top 88%", once: true },
        clearProps: "transform",
      });
    });

    /* 안전망: 스크롤러 바닥 도달 시 미발동 once 트리거 강제 완료
       (네이티브 스크롤·짧은 뷰포트에서 카드가 숨은 채 고착되는 것 방지) */
    let safetyFired = false;
    const safety = () => {
      if (safetyFired) return;
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) {
        safetyFired = true;
        ScrollTrigger.getAll().forEach((st) => {
          if (st.scroller === scroller && st.vars.once && st.animation) {
            try { st.animation.progress(1); } catch (e) {}
          }
        });
        scroller.removeEventListener("scroll", safety);
      }
    };
    scroller.addEventListener("scroll", safety, { passive: true });

    /* 이미지 로드 후 위치 재계산 */
    scroller.querySelectorAll(".process__making--playlist img, #process-playlist .pl-sec img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", () => { try { ScrollTrigger.refresh(); } catch (e) {} }, { once: true });
    });

    return true;
  };

  if (!init()) {
    let n = 0;
    const t = setInterval(() => { if (init() || ++n > 30) clearInterval(t); }, 80);
  }
})();
