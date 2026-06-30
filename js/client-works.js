/* =======================================================================
   client-works.js — 외주 작업(Client Works) 풀페이지 오버레이
   · 사이트 네비 "외주 작업"(data-nav="client") 클릭 → 오픈
   · 타일은 아래 CW_DATA 단일 소스에서 렌더. 썸네일/URL 만 채우면 자동 갱신.
   · BACK / scrim / Esc → 닫기. window.__clientWorksCtrl 로 외부(모바일 등) 제어.
======================================================================= */
(() => {
  const cw = document.getElementById("client-works");
  if (!cw) return;
  const groupsEl = cw.querySelector(".cw__groups");
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 데이터 단일 소스 ────────────────────────────────────────────────
     url   : 실제 배포/스토어 주소 (빈 문자열이면 "준비중" 비활성 타일)
     thumb : 썸네일 경로 (빈 문자열이면 별빛 그라데이션 플레이스홀더)        */
  const CW_DATA = [
    {
      client: "iCanNote", type: "WEB", note: "웹 서비스",
      items: [
        { title: "아이캔노트", desc: "노트 웹 서비스", url: "", thumb: "" },
      ],
    },
    {
      client: "웹네스트", type: "APP", note: "앱 4종",
      items: [
        { title: "웹네스트 앱 1", desc: "", url: "", thumb: "" },
        { title: "웹네스트 앱 2", desc: "", url: "", thumb: "" },
        { title: "웹네스트 앱 3", desc: "", url: "", thumb: "" },
        { title: "웹네스트 앱 4", desc: "", url: "", thumb: "" },
      ],
    },
    {
      client: "주노소프트", type: "CAFE24", note: "카페24 스킨 15종",
      items: Array.from({ length: 15 }, (_, i) => ({
        title: "카페24 스킨 " + String(i + 1).padStart(2, "0"),
        desc: "", url: "", thumb: "",
      })),
    },
  ];

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const cardHTML = (it, type) => {
    const live = !!it.url;
    const tag = live ? "a" : "span";
    const attrs = live ? ` href="${esc(it.url)}" target="_blank" rel="noopener"` : ' aria-disabled="true"';
    const thumb = it.thumb
      ? `<img class="cw-card__img" src="${esc(it.thumb)}" alt="" loading="lazy" decoding="async">`
      : `<span class="cw-card__ph" aria-hidden="true"></span>`;
    const corner = live
      ? `<span class="cw-card__go material-symbols-outlined" aria-hidden="true">open_in_new</span>`
      : `<span class="cw-card__soon">준비중</span>`;
    return `<li><${tag} class="cw-card${live ? "" : " is-soon"}"${attrs}>
        <span class="cw-card__thumb">${thumb}<span class="cw-card__badge">${esc(type)}</span></span>
        <span class="cw-card__meta">
          <strong class="cw-card__name">${esc(it.title)}</strong>
          ${it.desc ? `<i class="cw-card__desc">${esc(it.desc)}</i>` : ""}
        </span>
        ${corner}
      </${tag}></li>`;
  };

  const groupHTML = (g) => `<section class="cw__group">
      <div class="cw__grouphead">
        <h3 class="cw__groupname">${esc(g.client)}</h3>
        <span class="cw__grouptag">${esc(g.type)} · ${esc(g.note)}</span>
      </div>
      <ul class="cw__grid">${g.items.map((it) => cardHTML(it, g.type)).join("")}</ul>
    </section>`;

  groupsEl.innerHTML = CW_DATA.map(groupHTML).join("");

  /* ── 오픈 / 클로즈 ──────────────────────────────────────────────── */
  const open = () => {
    cw.classList.remove("is-closing");
    cw.classList.add("is-open");
    cw.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("cw-open");
    const sc = cw.querySelector(".cw__scroll"); if (sc) sc.scrollTop = 0;
    window.dispatchEvent(new CustomEvent("clientworks:open"));
  };
  const finishClose = () => {
    cw.classList.remove("is-open", "is-closing");
    cw.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("cw-open");
  };
  const close = () => {
    if (!cw.classList.contains("is-open") || cw.classList.contains("is-closing")) return;
    if (reduce()) { finishClose(); return; }
    cw.classList.add("is-closing");
    let done = false;
    const onEnd = (e) => {
      if (e.target !== cw) return;
      done = true; cw.removeEventListener("animationend", onEnd); finishClose();
    };
    cw.addEventListener("animationend", onEnd);
    setTimeout(() => { if (!done) { cw.removeEventListener("animationend", onEnd); finishClose(); } }, 420);
  };

  /* 네비 "외주 작업"(data-nav="client") + scrim + BACK + Esc */
  document.querySelectorAll('.intro-nav__item[data-nav="client"]').forEach((a) =>
    a.addEventListener("click", (e) => { e.preventDefault(); open(); }));
  cw.querySelectorAll("[data-cw-close]").forEach((b) => b.addEventListener("click", close));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && cw.classList.contains("is-open")) close();
  });

  window.__clientWorksCtrl = {
    open, close,
    isOpen: () => cw.classList.contains("is-open") && !cw.classList.contains("is-closing"),
  };
})();
