/* =======================================================================
   about.js — ABOUT(이력서/마케팅/프로젝트) 풀페이지 = 한 세로 스크롤 + 3섹션
   · 진주 네비 ABOUT/LAB/PROJECTS, 메인 카드 → 해당 섹션 앵커로 오픈
   · 우측 인페이지 인디케이터 = 스크롤스파이(현재 강조) + 클릭 점프(GSAP)
   · BACK 버튼 / Esc → 닫기. 섹션 간 이동은 그냥 네이티브 세로 스크롤.
======================================================================= */
(() => {
  const about = document.getElementById("about");
  if (!about) return;
  const scroller = about.querySelector(".about__scroll");
  const sections = [...about.querySelectorAll(".about__section")];
  const navItems = [...about.querySelectorAll(".about-nav__item")];
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const sectionEl = (id) => about.querySelector('.about__section[data-section="' + id + '"]');
  const topOf = (sec) =>
    sec.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;

  const setActive = (id) => navItems.forEach((n) => {
    const on = n.dataset.section === id;
    n.classList.toggle("is-active", on);
    if (on) n.setAttribute("aria-current", "true"); else n.removeAttribute("aria-current");
  });

  /* 스크롤스파이 — 컨테이너 상단 30% 기준선 위로 올라온 마지막 섹션 활성 */
  const spy = () => {
    if (!scroller) return;
    const ctop = scroller.getBoundingClientRect().top;
    const line = scroller.clientHeight * 0.3;
    let cur = sections[0] && sections[0].dataset.section;
    for (const s of sections) {
      if (s.getBoundingClientRect().top - ctop - 8 <= line) cur = s.dataset.section;
    }
    setActive(cur);
  };
  if (scroller) scroller.addEventListener("scroll", spy, { passive: true });

  /* 섹션 점프 — GSAP 으로 scrollTop 보간(커스텀 스크롤러에서 native smooth 끊김 방지) */
  const jumpTo = (id, instant) => {
    const sec = sectionEl(id);
    if (!sec || !scroller) return;
    scroller.dispatchEvent(new Event("overlay:navscroll"));   /* overlay-exit: 프로그램 스크롤 중 오버스크롤 감지 잠금 */
    const top = topOf(sec);
    setActive(id);
    if (instant || reduce() || !window.gsap) {
      if (sec.scrollIntoView) sec.scrollIntoView({ block: "start" });   /* 네이티브 계산 — 레이아웃 미정착에도 안정 */
      else scroller.scrollTop = top;
      return;
    }
    window.gsap.to(scroller, { scrollTop: top, duration: 0.7, ease: "power3.inOut", overwrite: "auto" });
  };
  navItems.forEach((n) =>
    n.addEventListener("click", (e) => { e.preventDefault(); jumpTo(n.dataset.section); }));

  /* 카드 클릭 시: 그 카드 위치에서 풀스크린으로 clip-path 모핑(프로젝트 카드와 동일 연출).
     originRect 없으면(진주 네비·CTA 등) 기존 aboutIn 슬라이드 폴백. */
  const morphOpen = (rect) => {
    if (!rect || reduce() || matchMedia("(max-width:1024px) and (orientation:portrait)").matches) return false;
    const t = Math.round(rect.top), r = Math.round(innerWidth - rect.right),
          b = Math.round(innerHeight - rect.bottom), l = Math.round(rect.left);
    if (t < -200 || l < -200 || r < -200 || b < -200) return false;
    if (rect.width < 20 || rect.height < 20) return false;
    about.classList.add("is-morphing");                 // CSS 에서 aboutIn animation 끔
    about.style.transition = "none";
    about.style.clipPath = `inset(${t}px ${r}px ${b}px ${l}px round 20px)`;
    void about.offsetWidth;                             // reflow
    about.style.transition = "clip-path .6s cubic-bezier(.7,0,.2,1)";
    about.style.clipPath = "inset(0 0 0 0 round 0px)";
    setTimeout(() => {
      about.style.transition = ""; about.style.clipPath = "";
      about.classList.remove("is-morphing");
    }, 640);
    return true;
  };

  const open = (anchor, originRect) => {
    about.classList.remove("is-closing");
    about.classList.add("is-open");
    about.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("about-open");
    morphOpen(originRect);                                       /* 카드 위치에서 펼침(가능 시) */
    const id = anchor || "resume";
    requestAnimationFrame(() => { jumpTo(id, true); spy(); });   /* 오픈은 해당 섹션으로 즉시 */
    setTimeout(() => { jumpTo(id, true); spy(); }, 300);         /* 이미지·갤러리 레이아웃 정착 후 보정 */
    window.dispatchEvent(new CustomEvent("about:open", { detail: id }));  /* 갤러리 등장 트리거 등 */
    if (window.__modalFocus) window.__modalFocus.activate(about);  /* 직전 포커스 저장 + 닫기로 이동 + 배경 inert */
  };
  const finishClose = () => {
    about.classList.remove("is-open", "is-closing");
    about.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("about-open");
  };
  const close = () => {
    if (!about.classList.contains("is-open") || about.classList.contains("is-closing")) return;
    if (window.__modalFocus) window.__modalFocus.deactivate(about);  /* 배경 inert 복원 + 직전 포커스로 복귀 */
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

  /* 진주 네비 3항목 → 해당 섹션으로 오픈 (8개 인트로 공통)
     카피(PROJECTS/LAB/ABOUT)가 아닌 data-nav 로 매칭 → 텍스트 바꿔도 안 깨짐 */
  const ANCHOR = { projects: "projects", lab: "marketing", about: "resume" };
  document.querySelectorAll(".intro-nav__item[data-nav]").forEach((a) => {
    const anchor = ANCHOR[a.dataset.nav];
    if (anchor) {
      a.addEventListener("click", (e) => { e.preventDefault(); open(anchor); });
    }
  });

  /* 메인 오빗의 ABOUT ME 카드 → 이력서, Skills 카드 → 이력서(스킬 섹션 포함) */
  document.querySelectorAll('.card-arm[data-card="about"], .card-arm[data-card="skills"]').forEach((arm) => {
    arm.style.cursor = "pointer";
    arm.setAttribute("role", "button");
    arm.setAttribute("tabindex", "0");
    arm.setAttribute("aria-label", (arm.dataset.card === "skills" ? "Skills" : "About") + " — 이력서 보기");
    const go = (e) => { if (e.target.closest("button")) return; e.preventDefault(); open("resume", arm.getBoundingClientRect()); };
    arm.addEventListener("click", go);
    arm.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open("resume", arm.getBoundingClientRect()); }
    });
  });

  /* 서명 CTA 등 [data-about-open] → 해당 섹션 열기 */
  document.querySelectorAll("[data-about-open]").forEach((el) => {
    el.addEventListener("click", (e) => { e.preventDefault(); open(el.dataset.aboutOpen || "resume"); });
  });

  /* 오빗 VISUAL ARCHIVE → 프로젝트(배너) 섹션, CONTENT LAB → 마케팅 섹션 */
  [["visual-archive", "projects", "Visual Archive"], ["content-lab", "marketing", "Content Lab"]].forEach(([card, anchor, label]) => {
    document.querySelectorAll('.card-arm[data-card="' + card + '"]').forEach((arm) => {
      arm.style.cursor = "pointer";
      arm.setAttribute("role", "button");
      arm.setAttribute("tabindex", "0");
      arm.setAttribute("aria-label", label + " 보기");
      const go = (e) => { if (e && e.target.closest("button")) return; if (e) e.preventDefault(); open(anchor, arm.getBoundingClientRect()); };
      arm.addEventListener("click", go);
      arm.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(anchor, arm.getBoundingClientRect()); } });
    });
  });

  /* 닫기 (BACK / scrim) + Esc */
  about.querySelectorAll("[data-about-close]").forEach((btn) => btn.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && about.classList.contains("is-open")) close();
  });

  window.__aboutCtrl = {
    open, close,
    isOpen: () => about.classList.contains("is-open") && !about.classList.contains("is-closing"),
  };
})();
