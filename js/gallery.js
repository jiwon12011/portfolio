/* =======================================================================
   gallery.js — VISUAL ARCHIVE(ABOUT 프로젝트 섹션) 배너 갤러리
   · masonry(CSS columns) 그리드 렌더 + 진입 시 스태거 캐스케이드 등장
   · 클릭 → 라이트박스(크게 보기 + 이전/다음 + Esc/배경 닫기)
   · prefers-reduced-motion 존중
======================================================================= */
(() => {
  const grid = document.getElementById("banner-grid");
  if (!grid) return;

  /* 배너 데이터 — 세로배너(2열) 먼저, 가로배너(wide=풀폭 한 줄씩) 아래로. ar = 종횡비(공간 확보) */
  const BANNERS = [
    { src: "img/banner/promo-spring.webp",       cap: "봄 프로모션 배너",     ar: "4/5" },
    { src: "img/banner/promo-summer.webp",       cap: "여름 프로모션 배너",   ar: "4/5" },
    { src: "img/banner/promo-fall.webp",         cap: "가을 프로모션 배너",   ar: "4/5" },
    { src: "img/banner/promo-winter.webp",       cap: "겨울 프로모션 배너",   ar: "4/5" },
    { src: "img/banner/radio.webp",              cap: "박보검 라디오",        ar: "4/5" },
    { src: "img/banner/bagel.webp",              cap: "치즈 베이글",          ar: "4/5" },
    { src: "img/banner/poster-drunk.webp",       cap: "만취남녀",            ar: "7/10" },
    { src: "img/banner/poster-garbagetime.webp", cap: "가비지타임",          ar: "7/10" },
    { src: "img/banner/graphic.webp",            cap: "그래픽 기초",          ar: "2/1",   wide: true },
    { src: "img/banner/strip-poze.webp",         cap: "POZE 띠배너",          ar: "86/20", wide: true },
    { src: "img/banner/strip-personalcolor.webp",cap: "퍼스널컬러 띠배너",    ar: "86/20", wide: true },
    { src: "img/banner/strip-scissors.webp",     cap: "가위 띠배너",          ar: "86/20", wide: true },
    { src: "img/banner/strip-wine.webp",         cap: "와인 띠배너",          ar: "86/20", wide: true },
    { src: "img/banner/strip-zerowaste.webp",    cap: "제로웨이스트 띠배너",  ar: "86/20", wide: true },
    { src: "img/banner/strip-watch.webp",        cap: "워치 띠배너",          ar: "86/20", wide: true },
  ];
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  grid.innerHTML = BANNERS.map((b, i) =>
    '<button class="banner-item' + (b.wide ? " banner-item--wide" : "") + '" type="button" data-i="' + i + '" style="aspect-ratio:' + b.ar + '" aria-label="' + esc(b.cap) + ' 크게 보기">' +
      '<img src="' + b.src + '" alt="' + esc(b.cap) + '" loading="lazy" />' +
      '<span class="banner-item__cap">' + esc(b.cap) + '</span>' +
    '</button>').join("");

  const countEl = document.getElementById("banner-count");
  if (countEl) countEl.textContent = BANNERS.length + " banners";

  /* 진입 등장 — 스크롤하며 각 배너가 뷰에 들어올 때 하나씩 솟아오름(첫 묶음만 살짝 스태거).
     ABOUT은 평소 display:none이라 IO가 불안정 → 스크롤/열림 시 위치 직접 체크 */
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scroller = document.querySelector(".about__scroll");
  const items = [...grid.querySelectorAll(".banner-item")];
  let n = 0;
  const revealInView = () => {
    if (!scroller) return;
    const s = scroller.getBoundingClientRect();
    items.forEach((it) => {
      if (it.classList.contains("is-in")) return;
      const r = it.getBoundingClientRect();
      if (r.top < s.bottom - 40 && r.bottom > s.top + 20) {
        it.style.transitionDelay = (Math.min(n, 6) * 0.06).toFixed(2) + "s";
        n++;
        it.classList.add("is-in");
      }
    });
  };
  if (reduce() || !scroller) {
    items.forEach((it) => it.classList.add("is-in"));
  } else {
    scroller.addEventListener("scroll", revealInView, { passive: true });
    window.addEventListener("about:open", (e) => {
      if (e.detail === "projects") [380, 720, 1100].forEach((t) => setTimeout(revealInView, t));
    });
  }

  /* ── 라이트박스 ── */
  const lb = document.createElement("div");
  lb.className = "banner-lb";
  lb.setAttribute("aria-hidden", "true");
  lb.innerHTML =
    '<button class="banner-lb__btn banner-lb__close" type="button" aria-label="닫기"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    '<button class="banner-lb__btn banner-lb__prev" type="button" aria-label="이전"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
    '<button class="banner-lb__btn banner-lb__next" type="button" aria-label="다음"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>' +
    '<figure class="banner-lb__fig"><img alt="" /><figcaption class="banner-lb__cap"></figcaption></figure>';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector("img");
  const lbCap = lb.querySelector(".banner-lb__cap");
  let cur = -1;

  const show = (i) => {
    cur = (i + BANNERS.length) % BANNERS.length;
    lbImg.src = BANNERS[cur].src;
    lbImg.alt = BANNERS[cur].cap;
    lbCap.textContent = BANNERS[cur].cap;
  };
  const open = (i) => {
    show(i);
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("lb-open");
  };
  const close = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("lb-open");
    cur = -1;
  };

  grid.addEventListener("click", (e) => {
    const item = e.target.closest(".banner-item");
    if (item) open(+item.dataset.i);
  });
  lb.querySelector(".banner-lb__close").addEventListener("click", close);
  lb.querySelector(".banner-lb__prev").addEventListener("click", () => show(cur - 1));
  lb.querySelector(".banner-lb__next").addEventListener("click", () => show(cur + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });   /* 배경 클릭 닫기 */
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(cur - 1);
    else if (e.key === "ArrowRight") show(cur + 1);
  });
})();
