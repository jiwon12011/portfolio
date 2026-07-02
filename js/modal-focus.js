/* =======================================================================
   modal-focus.js — 모달 공용 포커스 · inert 관리 (단일 소스)
   -----------------------------------------------------------------------
   process(8개)·about·client-works 모달이 공유한다. 열릴 때:
     ① 직전 포커스 저장 → 모달 안 첫 "가시" 포커서블(닫기 버튼 우선)로 이동
        (preventScroll 로 스크롤 튐 방지)
     ② 그 외 배경(body 직계 자식)을 inert → Tab·스크린리더가 뒤로 못 샌다.
   닫힐 때:
     ③ 우리가 건 배경 inert 만 복원 + 직전 포커스로 복귀.

   겹침(모바일 홈 → client-works 등) 대응:
     · 배경은 "첫 오픈"에 한 번만 inert, 마지막 닫힘에 전체 복원(스택).
     · 닫히는 모달 아래에 다른 모달이 남으면 닫힌 건 배경으로 다시 inert.
   deck.js 가 이미 inert 를 관리하는 비활성 deck-panel 은 건드리지 않는다
   (이미 inert 인 요소는 우리 목록에 안 담아 복원 때도 안 지운다).
======================================================================= */
(() => {
  if (window.__modalFocus) return;

  const stack = [];               // 현재 열린 모달(겹침 순서)
  const prevFocus = new Map();    // 모달 → 열기 직전 포커스 요소
  const ourInert = new Set();     // 우리가 inert 를 건 배경 요소(복원 대상만)

  const skip = (el) =>
    el.tagName === "SCRIPT" || el.tagName === "TEMPLATE" || el.id === "splash";

  /* 배경(body 직계) inert — open 모달·제외 대상·이미 inert(남이 관리) 인 건 건너뜀 */
  const inertBackground = (exclude) => {
    for (const el of document.body.children) {
      if (skip(el) || el === exclude || stack.includes(el)) continue;
      if (el.hasAttribute("inert")) continue;   // deck 비활성 패널 등 — 보존
      el.setAttribute("inert", "");
      ourInert.add(el);
    }
  };
  const restoreBackground = () => {
    ourInert.forEach((el) => el.removeAttribute("inert"));
    ourInert.clear();
  };

  /* 모달 내부 첫 "가시" 포커서블 — 닫기 버튼 우선(태블릿서 좌측 nav 숨으면 FAB 로 자동 이동) */
  const CLOSE_SEL =
    ".process__back, .about__back, .cw__back, .process__close-fab, " +
    "[data-close], [data-about-close], [data-cw-close]";
  const FOCUS_SEL =
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  const visible = (el) =>
    !!el && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

  const focusFirst = (modal) => {
    // 후보를 순서대로 시도하되 실제로 포커스가 잡혔는지 확인 — data-close 가
    // 스크림(DIV, 포커스 불가)에도 붙어 있어 첫 매치만 믿으면 조용히 실패한다.
    const cands = [...modal.querySelectorAll(CLOSE_SEL), ...modal.querySelectorAll(FOCUS_SEL)];
    for (const el of cands) {
      if (!visible(el)) continue;
      el.focus({ preventScroll: true });
      if (document.activeElement === el) return;
    }
    modal.setAttribute("tabindex", "-1");        // 포커서블 없으면 컨테이너로
    modal.focus({ preventScroll: true });
  };

  const activate = (modal) => {
    if (!modal || stack.includes(modal)) return;
    prevFocus.set(modal, document.activeElement);
    if (!stack.length) inertBackground(modal);   // 첫 오픈: 배경 통째 inert
    else if (ourInert.has(modal)) {              // 배경으로 inert 됐던 모달이 다시 열림 → 해제
      modal.removeAttribute("inert"); ourInert.delete(modal);
    }
    stack.push(modal);
    requestAnimationFrame(() => focusFirst(modal));  // 오픈 애니메이션 레이아웃 후 포커스
  };

  /* silent=true → 포커스 복원 생략(⏮/⏭ 모달 전환처럼 새 모달이 이미 포커스를 가져간 경우) */
  const deactivate = (modal, silent) => {
    const i = stack.indexOf(modal);
    if (i === -1) return;
    stack.splice(i, 1);
    if (!stack.length) restoreBackground();
    else if (!modal.hasAttribute("inert")) {     // 아래 모달이 남음 → 닫힌 건 배경으로 inert
      modal.setAttribute("inert", ""); ourInert.add(modal);
    }
    const back = prevFocus.get(modal);
    prevFocus.delete(modal);
    if (!silent && back && back.isConnected && typeof back.focus === "function" && visible(back)) {
      back.focus({ preventScroll: true });
    }
  };

  window.__modalFocus = { activate, deactivate };
})();
