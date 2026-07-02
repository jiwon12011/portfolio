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
      client: "iCanNote", type: "WEB", note: "웹 서비스", featured: true,
      // featured 그룹의 우측 설명 카피 (하드코딩 대신 데이터 소스)
      desc: "기존의 복잡한 기능 구조를 정리하고,\n수업 흐름에 맞춰 더 직관적인 판서 경험으로 재설계했습니다.",
      items: [
        // badge 옵셔널 — 없는 항목은 type 그대로 노출
        { title: "아이캔노트", desc: "노트 웹 서비스", url: "https://icannote.com/help/intro.html", urlLabel: "icannote.com", thumb: "img/icannote/icannote.webp", badge: "WEB REDESIGN" },
      ],
    },
    {
      client: "웹네스트", type: "APP", note: "앱 3종", frame: "phone",
      items: [
        { title: "수리수리 도감", desc: "", url: "", thumb: "img/webnest/webnest_1.webp?v=2" },
        { title: "LAST SALVAGE", desc: "", url: "", thumb: "img/webnest/webnest_2.webp?v=2" },
        { title: "퐁당", desc: "", url: "", thumb: "img/webnest/webnest_3.webp" },
      ],
    },
    {
      client: "주노소프트", type: "CAFE24", note: "카페24 스킨 15종",
      items: [
        "MELLOW-POT", "pile-beaute", "ODDROOM", "PAW-ATELIER", "NUVIA",
        "SOMA-LIVING", "DENVIBE", "TINTY", "BLUEBRIM", "TOYPANG",
        "POZE", "ROAMER", "RIPE", "ROUGEN", "NOIRE-TIP",
      ].map((name, i) => ({
        title: name,
        desc: "", url: "", thumb: "img/junosoft/junosoft_" + (i + 1) + ".webp",
      })),
    },
  ];

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // opts.chrome → 브라우저 창 목업 / opts.phone → 세로 폰 기기 프레임 (둘 다 이미지 0개, 전부 CSS)
  const cardHTML = (it, type, opts = {}) => {
    const live = !!it.url;
    const tag = live ? "a" : "span";
    const attrs = live ? ` href="${esc(it.url)}" target="_blank" rel="noopener"` : ' aria-disabled="true"';
    const media = it.thumb
      ? `<img class="cw-card__img" src="${esc(it.thumb)}" alt="" loading="lazy" decoding="async">`
      : `<span class="cw-card__ph" aria-hidden="true"></span>`;
    // 크롬 목업: thumb 있으면 바 아래 스샷, 없으면 플레이스홀더 위에 바만
    const chromeView = `<span class="cw-chrome" aria-hidden="true">
           <span class="cw-chrome__bar">
             <span class="cw-chrome__dots"><i></i><i></i><i></i></span>
             <span class="cw-chrome__url">${esc(it.urlLabel || it.url || "icannote.com")}</span>
           </span>
           <span class="cw-chrome__view">${media}</span>
         </span>`;
    // 폰 목업: 다크 베젤·노치 위 세로 화면(스샷 object-fit:cover, 없으면 별빛 PH)
    const phoneView = `<span class="cw-phone" aria-hidden="true">
           <span class="cw-phone__notch"></span>
           <span class="cw-phone__screen">${media}</span>
         </span>`;
    const view = opts.chrome ? chromeView : opts.phone ? phoneView : media;
    const corner = live
      ? `<span class="cw-card__go material-symbols-outlined" aria-hidden="true">open_in_new</span>`
      : `<span class="cw-card__soon">준비중</span>`;
    // 크롬(featured) 카드는 우측 정보 블록이 설명을 담으므로 하단 메타 생략
    const meta = opts.chrome ? "" : `<span class="cw-card__meta">
          <strong class="cw-card__name">${esc(it.title)}</strong>
          ${it.desc ? `<i class="cw-card__desc">${esc(it.desc)}</i>` : ""}
        </span>`;
    return `<li><${tag} class="cw-card${live ? "" : " is-soon"}${opts.chrome ? " cw-card--chrome" : ""}${opts.phone ? " cw-card--phone" : ""}"${attrs}>
        <span class="cw-card__thumb">${view}</span>
        ${meta}
        ${corner}
      </${tag}></li>`;
  };

  // featured 그룹 우측 정보 블록 (url 있으면 라이브 CTA 자동 노출)
  const featuredInfoHTML = (g) => {
    const it = g.items[0];
    const cta = it.url
      ? `<a class="cw-featured__cta" href="${esc(it.url)}" target="_blank" rel="noopener">
           사이트 보기 <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
         </a>`
      : "";
    return `<li class="cw-featured__cell"><div class="cw-featured__info">
        <h4 class="cw-featured__client">${esc(g.client)}</h4>
        <p class="cw-featured__type">${esc(g.type)} · ${esc(g.note)}</p>
        ${g.desc ? `<p class="cw-featured__desc">${g.desc.split("\n").map(esc).join("<br>")}</p>` : ""}
        ${cta}
      </div></li>`;
  };

  const groupHTML = (g) => {
    const head = `<div class="cw__grouphead">
        <h3 class="cw__groupname">${esc(g.client)}</h3>
        <span class="cw__grouptag">${esc(g.type)} · ${esc(g.note)}</span>
      </div>`;
    // Feature Row: 단일 항목(또는 featured 플래그) → 좌 목업카드 + 우 설명 2단
    if (g.featured || g.items.length === 1) {
      return `<section class="cw__group is-featured">
        ${head}
        <ul class="cw__grid cw__grid--featured">
          ${cardHTML(g.items[0], g.type, { chrome: true })}
          ${featuredInfoHTML(g)}
        </ul>
      </section>`;
    }
    // 그룹 레벨 frame 플래그 → 카드 옵션 (예: 웹네스트 frame:"phone")
    const cardOpts = g.frame === "phone" ? { phone: true } : {};
    return `<section class="cw__group">
      ${head}
      <ul class="cw__grid">${g.items.map((it) => cardHTML(it, g.type, cardOpts)).join("")}</ul>
    </section>`;
  };

  groupsEl.innerHTML = CW_DATA.map(groupHTML).join("");

  /* ── 오픈 / 클로즈 ──────────────────────────────────────────────── */
  const open = () => {
    cw.classList.remove("is-closing");
    cw.classList.add("is-open");
    cw.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("cw-open");
    const sc = cw.querySelector(".cw__scroll"); if (sc) sc.scrollTop = 0;
    window.dispatchEvent(new CustomEvent("clientworks:open"));
    if (window.__modalFocus) window.__modalFocus.activate(cw);  /* 직전 포커스 저장 + 닫기로 이동 + 배경 inert */
  };
  const finishClose = () => {
    cw.classList.remove("is-open", "is-closing");
    cw.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("cw-open");
  };
  const close = () => {
    if (!cw.classList.contains("is-open") || cw.classList.contains("is-closing")) return;
    if (window.__modalFocus) window.__modalFocus.deactivate(cw);  /* 배경 inert 복원 + 직전 포커스로 복귀 */
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
