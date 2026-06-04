/* =======================================================================
   about.js — ABOUT(Profile) 풀페이지 오버레이 열기/닫기
   · 인트로 우상단 네비의 "ABOUT" 항목 클릭 → 오버레이 오픈
   · BACK 버튼 / Esc → 닫기 (닫힘 애니메이션 후 정리)
======================================================================= */
(() => {
  const about = document.getElementById("about");
  if (!about) return;
  const scroller = about.querySelector(".about__scroll");
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const open = () => {
    about.classList.remove("is-closing");
    about.classList.add("is-open");
    about.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("about-open");
    if (scroller) scroller.scrollTop = 0;
  };
  const finishClose = () => {
    about.classList.remove("is-open", "is-closing");
    about.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("about-open");
  };
  const close = () => {
    if (!about.classList.contains("is-open") || about.classList.contains("is-closing")) return;
    if (reduce()) { finishClose(); return; }
    about.classList.add("is-closing");
    let done = false;
    const onEnd = (e) => {
      if (e.target !== about) return;
      done = true; about.removeEventListener("animationend", onEnd); finishClose();
    };
    about.addEventListener("animationend", onEnd);
    setTimeout(() => { if (!done) { about.removeEventListener("animationend", onEnd); finishClose(); } }, 420);
  };

  /* 인트로 네비의 ABOUT 항목 → 열기 (4개 인트로 공통) */
  document.querySelectorAll(".intro-nav__item").forEach((a) => {
    const b = a.querySelector("b");
    if (b && b.textContent.trim() === "ABOUT") {
      a.addEventListener("click", (e) => { e.preventDefault(); open(); });
    }
  });

  /* 닫기 */
  about.querySelectorAll("[data-about-close]").forEach((btn) => btn.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && about.classList.contains("is-open")) close();
  });
})();
