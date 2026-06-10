/* =======================================================================
   intro-nav.js — 인트로 상단 네비를 "진주 1개 → 펼치면 3버블"로 enhance
   -----------------------------------------------------------------------
   · 데스크톱(hover+fine pointer)만 enhance. 터치/모바일은 기존 우상단 칩 유지.
   · 상태의 진실 = .is-open 클래스 1개 (hover/focus/click 모두 여기로 수렴).
   · 진주 = <button aria-expanded aria-controls> 접근성. focus 시에도 펼침.
   · 첫 진입(프로젝트 인트로 처음 보일 때) 1회 자동 펼침 → 학습용, 1.5초 뒤 접힘.
     prefers-reduced-motion 이면 생략. sessionStorage 로 1회만.
======================================================================= */
(() => {
  const navs = [...document.querySelectorAll(".intro-nav")];
  if (!navs.length) return;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;  // 터치/모바일: 그대로

  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let uid = 0;

  const entries = navs.map((nav) => {
    const items = [...nav.querySelectorAll(".intro-nav__item")];
    if (!items.length) return null;

    const cluster = document.createElement("div");
    cluster.className = "intro-nav__cluster";
    cluster.id = "intro-nav-cluster-" + (++uid);
    items.forEach((it) => cluster.appendChild(it));     // 노드 이동 → 기존 핸들러(ABOUT 등) 유지

    const pearl = document.createElement("button");
    pearl.type = "button";
    pearl.className = "intro-nav__pearl";
    pearl.setAttribute("aria-expanded", "false");
    pearl.setAttribute("aria-controls", cluster.id);
    pearl.setAttribute("aria-label", "메뉴 열기");
    pearl.innerHTML = '<span class="intro-nav__orb" aria-hidden="true"></span>';

    cluster.setAttribute("inert", "");           // 닫힘 기본 — 키보드/스크린리더 비노출
    items.forEach((it) => { it.tabIndex = -1; }); // inert 미지원(구형 Safari) 대비 탭 순서 제거
    nav.setAttribute("aria-label", "섹션 메뉴");

    nav.appendChild(pearl);
    nav.appendChild(cluster);
    nav.classList.add("intro-nav--pearl");

    let pinned = false;
    const setOpen = (on) => {
      nav.classList.toggle("is-open", on);
      pearl.setAttribute("aria-expanded", on ? "true" : "false");
      pearl.setAttribute("aria-label", on ? "메뉴 닫기" : "메뉴 열기");
      cluster.toggleAttribute("inert", !on);     // 열림=노출 / 닫힘=키보드·SR 비노출
      items.forEach((it) => { it.tabIndex = on ? 0 : -1; });   // inert 폴백
    };

    nav.addEventListener("mouseenter", () => setOpen(true));
    nav.addEventListener("mouseleave", () => { if (!pinned) setOpen(false); });
    nav.addEventListener("focusin", () => setOpen(true));
    nav.addEventListener("focusout", (e) => {
      if (!pinned && !nav.contains(e.relatedTarget)) setOpen(false);
    });
    pearl.addEventListener("click", (e) => {
      e.preventDefault();
      pinned = !pinned;
      setOpen(pinned || nav.matches(":hover"));
    });

    /* 닫기 직전 포커스가 cluster 내부면 pearl 로 회수(inert 적용 시 포커스 소실 방지) */
    const reclaimFocus = () => {
      if (cluster.contains(document.activeElement)) pearl.focus();
    };

    return {
      nav, pearl, setOpen, reclaimFocus,
      get pinned() { return pinned; },
      unpin() { pinned = false; },
    };
  }).filter(Boolean);

  /* Esc / 바깥 클릭 → 핀 해제 + (마우스 떠나 있으면) 닫기 */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    entries.forEach((x) => { x.unpin(); x.reclaimFocus(); x.setOpen(false); });
  });
  document.addEventListener("click", (e) => {
    entries.forEach((x) => {
      if (x.nav.contains(e.target)) return;
      x.unpin();
      if (!x.nav.matches(":hover")) { x.reclaimFocus(); x.setOpen(false); }
    });
  });

  /* 패널 전환 시 비활성(다른 인트로) 네비 닫기 — 화면 밖에 열린 채 잔류 방지 */
  const closeInactive = () => {
    const active = document.querySelector(".deck-panel.is-active");
    entries.forEach((x) => {
      if (active && active.contains(x.nav)) return;
      x.unpin(); x.setOpen(false);
    });
  };
  entries.forEach((x) => {
    const panel = x.nav.closest(".deck-panel");
    if (panel) new MutationObserver(closeInactive)
      .observe(panel, { attributes: true, attributeFilter: ["class"] });
  });

  /* 첫 진입 1회 자동 펼침(학습): off-main 되며 인트로가 처음 보일 때 활성 패널의 네비를 잠깐 펼침 */
  let taught = sessionStorage.getItem("introNavTaught") === "1";
  const teach = () => {
    if (taught || reduce()) return;
    const panel = document.querySelector(".deck-panel.is-active");
    const entry = panel && entries.find((x) => panel.contains(x.nav));
    if (!entry) return;
    taught = true;
    try { sessionStorage.setItem("introNavTaught", "1"); } catch (e) {}
    entry.setOpen(true);
    setTimeout(() => { if (!entry.pinned) entry.setOpen(false); }, 1500);
  };
  const root = document.documentElement;
  if (root.classList.contains("off-main")) requestAnimationFrame(teach);
  new MutationObserver(() => {
    if (!taught && root.classList.contains("off-main")) teach();
  }).observe(root, { attributes: true, attributeFilter: ["class"] });
})();
