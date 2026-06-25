/* =======================================================================
   gallery.js — VISUAL ARCHIVE(ABOUT 프로젝트 섹션) 배너 갤러리
   · 데스크톱(hover+fine) + non-reduce: CSS sticky + RAF scroll 직결
     ScrollTrigger 완전 제거 — lerp↔pin-transform 이중충돌(judder) 차단
   · 터치/reduce: 네이티브 가로 스냅(scroll-snap)
   · 클릭 → 라이트박스(크게 보기 + 이전/다음 + Esc/배경 닫기)
======================================================================= */
(() => {
  const grid = document.getElementById("banner-grid");
  if (!grid) return;

  /* 배너 데이터 */
  const BANNERS = [
    { src: "img/banner/promo-spring.webp",       cap: "봄 프로모션 배너",     ar: "4/5",
      info: {
        title: "봄 프로모션 배너",
        tools: "Photoshop / Nano Banana 2 / Firefly",
        sections: [
          { label: "기획 의도", en: "CONCEPT", body: "봄의 설렘과 럭키드로우 이벤트를 결합해, 밤하늘 아래 꿈의 구슬을 뽑는 듯한 몽환적인 배너를 제작했습니다." },
          { label: "AI 활용 과정", en: "AI WORKFLOW", body: "AI로 크레인, 유리 구슬, 벚꽃 네온 라인, 꽃잎 소스를 생성한 뒤 Photoshop에서 색감, 빛 번짐, 모션 블러를 보정해 하나의 광고 이미지처럼 완성했습니다." },
          { label: "디자인 포인트", en: "DESIGN POINT", body: "중앙 오브제로 시선을 집중시키고, 딥 블루와 퍼플 톤으로 신비로운 밤의 분위기를 강조했습니다. 상단에는 이벤트 혜택 문구를 배치해 프로모션 정보가 바로 전달되도록 했습니다." },
          { label: "제작 회고", en: "RETROSPECTIVE", body: "작은 밝기 조절과 폰트 두께 차이가 전체 완성도를 크게 바꾼다는 점을 배웠습니다. 감성적인 비주얼 안에서도 정보 전달력이 중요하다는 것을 느꼈습니다." },
        ],
      } },
    { src: "img/banner/promo-summer.webp",       cap: "여름 프로모션 배너",   ar: "4/5",
      info: {
        title: "여름 프로모션 배너",
        tools: "Photoshop / Firefly / Gemini",
        sections: [
          { label: "기획 의도", en: "CONCEPT", body: "여름의 상징적인 오브제들을 커스텀 키링처럼 모아, 사용자가 직접 고르고 수집하는 듯한 프로모션 배너를 제작했습니다. 청량한 해변 배경과 할인 태그, 서핑보드, 여름 참 오브제를 활용해 ‘Pick’과 ‘Collect’의 재미가 느껴지도록 구성했습니다." },
          { label: "AI 활용 과정", en: "AI WORKFLOW", body: "AI로 여름 테마 키링 오브제와 에메랄드빛 해변 배경을 생성했습니다. 이후 Photoshop에서 광원, 그림자, 색감, 오브제 배치를 조정해 각각의 AI 소스가 하나의 공간 안에 자연스럽게 어우러지도록 합성했습니다." },
          { label: "디자인 포인트", en: "DESIGN POINT", body: "중앙에 키링 오브제를 크게 배치해 시선을 집중시키고, 물방울과 해변 요소를 더해 여름 특유의 청량감을 강조했습니다. 할인 태그는 코랄 핑크 톤으로 조정해 프로모션 혜택이 더 잘 보이도록 개선했습니다." },
          { label: "제작 회고", en: "RETROSPECTIVE", body: [
            "복잡한 오브제를 AI로 구현하며 프롬프트 제어와 리터칭의 중요성을 느꼈습니다.",
            "또한 예쁜 비주얼보다 사용자의 시선 흐름과 정보 우선순위를 고려해야, 클릭을 유도하는 프로모션 배너로 완성될 수 있다는 점을 배웠습니다.",
          ] },
        ],
      } },
    { src: "img/banner/promo-fall.webp",         cap: "가을 프로모션 배너",   ar: "4/5",
      info: {
        title: "가을 프로모션 배너",
        tools: "Photoshop / Firefly / Gemini",
        sections: [
          { label: "기획 의도", en: "CONCEPT", body: "가을의 고즈넉한 분위기와 한옥 스테이의 ‘쉼’ 이미지를 결합해, 창밖 풍경을 바라보는 듯한 감성적인 배너를 제작했습니다." },
          { label: "AI 활용 과정", en: "AI WORKFLOW", body: "AI로 한옥 배경, 팔각창 프레임, 단풍잎 소스를 생성한 뒤 Photoshop에서 색감, 그림자, 모션 블러를 보정해 하나의 공간처럼 자연스럽게 합성했습니다." },
          { label: "디자인 포인트", en: "DESIGN POINT", body: "팔각창을 중심에 배치해 시선을 풍경 안쪽으로 유도하고, 오렌지와 골드 톤으로 따뜻한 가을 분위기를 강조했습니다. 불필요한 소품은 덜어내어 한옥 특유의 정갈한 여백을 살렸습니다." },
          { label: "제작 회고", en: "RETROSPECTIVE", body: "이번 작업을 통해 무엇을 보여줄지뿐만 아니라, 어떤 프레임을 통해 보여줄지도 중요하다는 점을 느꼈습니다. AI 소스를 컨셉에 맞게 선별하고 덜어내는 과정에서 디자이너의 판단력이 중요하다는 것을 배웠습니다." },
        ],
      } },
    { src: "img/banner/promo-winter.webp",       cap: "겨울 프로모션 배너",   ar: "4/5",
      info: {
        title: "겨울 프로모션 배너",
        tools: "Photoshop / Firefly / Gemini",
        sections: [
          { label: "기획 의도", en: "CONCEPT", body: "보름달 아래 펼쳐지는 마법 같은 크리스마스 장면을 시네마틱하게 연출한 겨울 프로모션 배너입니다. 루돌프, 썰매, 눈 내린 마을, 리스 프레임을 활용해 클래식하면서도 판타지한 분위기가 느껴지도록 구성했습니다." },
          { label: "AI 활용 과정", en: "AI WORKFLOW", body: "AI로 루돌프, 썰매, 겨울 마을 배경, 크리스마스 리스 프레임을 각각 생성했습니다. 이후 Photoshop에서 광원, 그림자, 눈가루 효과, 색감을 보정해 분리된 소스들이 하나의 장면처럼 자연스럽게 어우러지도록 합성했습니다." },
          { label: "디자인 포인트", en: "DESIGN POINT", body: "전경의 리스, 중경의 루돌프와 썰매, 원경의 달과 마을을 레이어링해 깊이감을 만들었습니다. 보름달을 메인 광원으로 설정하고 텍스트 뒤에 은은한 글로우를 더해 가독성과 크리스마스 무드를 함께 살렸습니다." },
          { label: "제작 회고", en: "RETROSPECTIVE", body: "AI 소스를 그대로 사용하는 것보다, 광원과 원근을 고려해 재조합하는 과정이 완성도를 좌우한다는 점을 배웠습니다. 오브젝트를 분리해 생성하면 수정이 유연하고, 각 요소의 질감을 더 정교하게 조정할 수 있다는 인사이트를 얻었습니다." },
        ],
      } },
    { src: "img/banner/radio.webp",              cap: "박보검 라디오",        ar: "4/5",
      info: {
        title: "박보검 라디오 런칭 배너",
        tools: "Photoshop / Illustrator",
        sections: [
          { label: "기획 의도", en: "CONCEPT", body: "가상 라디오 프로그램 〈박보검의 감사한 밤〉 런칭을 알리는 티저 배너입니다. 미드나잇 블루 배경과 별빛 요소를 활용해 밤하늘의 따뜻함과 스타의 신비로운 분위기를 표현했습니다." },
          { label: "제작 과정", en: "WORKFLOW", body: "팬덤이 알아볼 수 있는 주파수, 실루엣, 화살표 힌트 등을 단계적으로 배치해 궁금증을 유도했습니다. 이후 프로그램명과 첫 방송 정보를 추가하며 티저에서 런칭 배너로 자연스럽게 확장했습니다." },
          { label: "디자인 포인트", en: "DESIGN POINT", body: "블루 배경에 옐로우 포인트 컬러를 더해 밤하늘의 분위기와 가독성을 함께 살렸습니다. ‘밤’ 글자에 달 아이콘을 결합해 프로그램명을 로고처럼 보이도록 구성했습니다." },
          { label: "제작 회고", en: "RETROSPECTIVE", body: "팬덤이 알아볼 수 있는 디테일을 디자인 요소로 활용했을 때, 배너의 몰입감과 유대감이 더 강해진다는 점을 느꼈습니다. 감성적인 무드뿐만 아니라 방송 정보가 명확히 전달되도록 레이아웃을 조정하는 과정도 중요했습니다." },
        ],
      } },
    { src: "img/banner/bagel.webp",              cap: "치즈 베이글",          ar: "4/5",
      info: {
        title: "치즈 베이글 푸드 포스터",
        tools: "Photoshop / Firefly",
        sections: [
          { label: "기획 의도", en: "CONCEPT", body: "‘치즈 폭포’라는 키워드를 중심으로, 한눈에 시선을 사로잡는 강렬한 푸드 포스터를 제작했습니다. 실제보다 더 먹음직스러운 치즈 질감과 베이글의 바삭한 표면을 강조해 압도적인 비주얼을 만들고자 했습니다." },
          { label: "AI 활용 과정", en: "AI WORKFLOW", body: "AI로 치즈가 폭포처럼 흘러내리는 베이글 이미지를 생성했습니다. 이후 Photoshop에서 치즈의 색감, 음식의 입체감, 배경 대비를 보정해 더 선명하고 먹음직스러운 푸드 비주얼로 완성했습니다." },
          { label: "디자인 포인트", en: "DESIGN POINT", body: "딥 블루 배경과 옐로우 치즈의 보색 대비를 활용해 메인 오브제가 더 강하게 보이도록 구성했습니다. 굵은 타이포와 레드 포인트 문구를 함께 사용해 묵직하면서도 경쾌한 푸드 포스터 분위기를 만들었습니다." },
          { label: "제작 회고", en: "RETROSPECTIVE", body: "강한 메인 이미지가 더 돋보이기 위해서는 컬러와 타이포그래피가 함께 뒷받침되어야 한다는 점을 배웠습니다. AI를 단순한 이미지 생성이 아니라, 원하는 구도와 질감을 찾아가는 연출 도구로 활용할 수 있었습니다." },
        ],
      } },
    { src: "img/banner/poster-drunk.webp",       cap: "만취남녀",            ar: "7/10",
      info: {
        title: "만취남녀 프로모션 포스터",
        tools: "Photoshop / Firefly",
        sections: [
          { label: "기획 의도", en: "CONCEPT", body: "웹툰 〈만취남녀〉를 현대적인 실사 프로모션 포스터로 재해석했습니다. 원작의 핑크·레드 무드를 유지하면서, 인물 중심의 강렬한 레이아웃으로 트렌디하고 드라마틱한 분위기를 표현했습니다." },
          { label: "AI 활용 과정", en: "AI WORKFLOW", body: "AI로 레드 커튼, 안개, 무대 조명이 어우러진 배경 소스를 생성했습니다. 이후 Photoshop에서 모델과 배경의 색감, 광원, 외곽선을 보정해 하나의 상업 포스터처럼 자연스럽게 합성했습니다." },
          { label: "디자인 포인트", en: "DESIGN POINT", body: "중앙 타원형 프레임으로 인물에 시선을 집중시키고, 핑크 배경과 레드 커튼의 컬러 밸런스를 조정해 로맨틱하면서도 고급스러운 무드를 만들었습니다. 하단 카피와 로고 배치로 실제 프로모션 포스터 같은 완성도를 더했습니다." },
          { label: "제작 회고", en: "RETROSPECTIVE", body: "필요한 배경을 AI로 직접 설계하며, 원하는 무드와 구도를 더 자유롭게 구현할 수 있었습니다. 서로 다른 소스를 하나의 톤으로 맞추는 과정에서 색감과 광원 조율의 중요성을 배웠습니다." },
        ],
      } },
    { src: "img/banner/poster-garbagetime.webp", cap: "가비지타임",          ar: "7/10",
      info: {
        title: "가비지타임 프로모션 포스터",
        tools: "Photoshop / Generative AI / Adobe Upscaling",
        sections: [
          { label: "기획 의도", en: "CONCEPT", body: "웹툰 〈가비지타임〉의 에너지와 비장미를 실사 영화 포스터처럼 재해석했습니다. 로우 앵글 구도와 역동적인 포즈를 활용해 캐릭터가 화면 밖으로 튀어나올 듯한 압도감을 표현했습니다." },
          { label: "AI 활용 과정", en: "AI WORKFLOW", body: "AI로 로우 앵글 인물, 빈티지 체육관 배경, 네온 광원 소스를 생성했습니다. 이후 Photoshop에서 업스케일링, 광원 보정, 스피드 라인, 모션 블러를 더해 스포츠 영화 같은 현장감을 완성했습니다." },
          { label: "디자인 포인트", en: "DESIGN POINT", body: "초광각 앵글과 과장된 원근감으로 인물과 농구공에 시선을 집중시켰습니다. 볼드한 타이포와 세로 명대사 배치를 더해 영화 포스터의 무게감과 원작 팬이 알아볼 수 있는 서사적 요소를 함께 담았습니다." },
          { label: "제작 회고", en: "RETROSPECTIVE", body: "프롬프트를 통해 원하는 앵글과 질감을 직접 설계하며, AI를 이미지 탐색이 아닌 비주얼 연출 도구로 활용할 수 있었습니다. 또한 텍스트 간격과 여백 조정만으로도 포스터의 완성도가 크게 달라진다는 점을 배웠습니다." },
        ],
      } },
  ];
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  /* ── 마크업: banner-track 래퍼 안에 banner-item 렌더 ── */
  const track = document.createElement("div");
  track.className = "banner-track";
  track.innerHTML = BANNERS.map((b, i) =>
    '<button class="banner-item" type="button" data-i="' + i + '" style="aspect-ratio:' + b.ar + '" aria-label="' + esc(b.cap) + ' 크게 보기">' +
      '<img src="' + b.src + '" alt="' + esc(b.cap) + '" loading="lazy" />' +
      '<span class="banner-item__cap">' + esc(b.cap) + '</span>' +
    '</button>').join("");
  grid.appendChild(track);

  const countEl = document.getElementById("banner-count");
  if (countEl) countEl.textContent = BANNERS.length + " banners";

  /* ── 환경 체크 ── */
  const reduce    = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isDesktop = () => matchMedia("(hover:hover) and (pointer:fine)").matches;
  const scroller  = document.querySelector(".about__scroll");
  const galSection = document.querySelector(".about__section--gallery");
  const items     = [...grid.querySelectorAll(".banner-item")];

  /* ── 핀 상태 (ScrollTrigger 없이 커스텀 핸들러 객체) ── */
  let pinST = null;

  /* ──────────────────────────────────────────────────────────────────
     initPin — CSS sticky + scroll→translateX 직결
     · .banner-viewport (sticky, 100svh) 를 galSection 에 삽입
     · galSection.height = 100svh + distance → 그만큼 세로 스크롤 여지
     · scroll 이벤트에서 getBoundingClientRect 로 progress 계산 → track 이동
     · ScrollTrigger/scrub 완전 제거 → lerp 이중충돌 원천 차단
  ────────────────────────────────────────────────────────────────── */
  const initPin = () => {
    if (!scroller || !galSection) return;
    if (pinST) { pinST.kill(); pinST = null; }

    grid.classList.add("is-pinned");
    grid.classList.remove("is-native");
    items.forEach((it) => { it.classList.add("is-in"); it.style.transitionDelay = ""; });
    galSection.classList.add("has-pin");

    /* ── DOM 재구성: .banner-viewport (sticky 컨테이너) 생성 — 최초 1회 ── */
    let viewport = galSection.querySelector(".banner-viewport");
    if (!viewport) {
      viewport = document.createElement("div");
      viewport.className = "banner-viewport";
      /* eyebrow → viewport 안으로 (sticky 구간에서도 표시 유지) */
      const eyebrow = galSection.querySelector(":scope > .about__eyebrow");
      if (eyebrow) viewport.appendChild(eyebrow);
      /* banner-wrap(제목) → viewport 안으로 */
      const bannerWrap = galSection.querySelector(".banner-wrap");
      if (bannerWrap) viewport.appendChild(bannerWrap);
      /* grid → viewport 안에 banner-wrap 형제로 (풀폭 확보) */
      viewport.appendChild(grid);
      galSection.appendChild(viewport);
    } else {
      /* 재오픈: grid 위치 보장 */
      if (!viewport.contains(grid)) viewport.appendChild(grid);
    }

    /* ── 거리 계산: 트랙 총폭 − viewport 표시폭 ── */
    const getDistance = () => track.scrollWidth - viewport.clientWidth;

    /* ── 섹션 높이: 한 뷰포트(sticky) + 가로 스크롤 거리 ── */
    const updateHeight = () => {
      const dist = getDistance();
      galSection.style.height = "calc(100svh + " + dist + "px)";
    };
    updateHeight();

    /* ── scroll → translateX 직결 (lerp 이후 scrollTop을 1:1 반영) ── */
    let rafPending = false;
    const applyTransform = () => {
      const sRect = galSection.getBoundingClientRect();
      const cRect = scroller.getBoundingClientRect();
      /* relTop: 0 = 갤러리 진입, -(dist) = 가로 스크롤 완료 */
      const relTop = sRect.top - cRect.top;
      const dist = getDistance();
      if (dist <= 0) return;
      const progress = Math.min(Math.max(-relTop / dist, 0), 1);
      track.style.transform = "translateX(" + (-progress * dist).toFixed(1) + "px)";
    };
    const onScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => { rafPending = false; applyTransform(); });
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });

    /* ── 리사이즈 → 높이·거리 재계산 ── */
    let resizeTimer = null;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { updateHeight(); applyTransform(); }, 120);
    };
    window.addEventListener("resize", onResize);

    /* ── 정리 핸들러 (재오픈 시 기존 구독 제거) ── */
    pinST = {
      kill: () => {
        scroller.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        clearTimeout(resizeTimer);
        galSection.style.height = "";
        track.style.transform = "";
        pinST = null;
      },
      refresh: () => { updateHeight(); applyTransform(); },
    };
  };

  /* ── 네이티브 가로 스냅(터치/reduce) ── */
  const initNative = () => {
    if (pinST) { pinST.kill(); pinST = null; }
    galSection.classList.remove("has-pin");
    galSection.style.height = "";
    grid.classList.add("is-native");
    grid.classList.remove("is-pinned");
    items.forEach((it) => { it.classList.add("is-in"); it.style.transitionDelay = ""; });
  };

  /* ── about:open 이벤트 수신 — 열릴 때마다 모드 결정 ── */
  window.addEventListener("about:open", () => {
    if (!reduce() && isDesktop()) {
      /* morphOpen 640ms + 레이아웃 정착 여유 → 720ms 후 핀 생성 */
      setTimeout(initPin, 720);
      /* 이미지 로드 등 추가 정착 후 높이 재계산 */
      setTimeout(() => { if (pinST) pinST.refresh(); }, 1100);
    } else {
      initNative();
    }
  });

  /* ── 초기 기본 상태(About 오픈 전: display:none이라 보이지 않음) ── */
  if (reduce() || !isDesktop()) {
    initNative();
  } else {
    /* 데스크톱: about:open 때까지 네이티브 대기 */
    grid.classList.add("is-native");
    items.forEach((it) => it.classList.add("is-in"));
  }

  /* ── 라이트박스 ── */
  const lb = document.createElement("div");
  lb.className = "banner-lb";
  lb.setAttribute("aria-hidden", "true");
  lb.innerHTML =
    '<button class="banner-lb__btn banner-lb__close" type="button" aria-label="닫기"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
    '<button class="banner-lb__btn banner-lb__prev" type="button" aria-label="이전"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
    '<button class="banner-lb__btn banner-lb__next" type="button" aria-label="다음"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>' +
    '<div class="banner-lb__inner">' +
      '<div class="banner-lb__stage"><img alt="" /><p class="banner-lb__cap"></p></div>' +
      '<aside class="banner-lb__panel"><h3 class="banner-lb__title"></h3><div class="banner-lb__sections"></div></aside>' +
    '</div>';
  document.body.appendChild(lb);
  const lbInner    = lb.querySelector(".banner-lb__inner");
  const lbImg      = lb.querySelector("img");
  const lbCap      = lb.querySelector(".banner-lb__cap");
  const lbPanel    = lb.querySelector(".banner-lb__panel");
  const lbTitle    = lb.querySelector(".banner-lb__title");
  const lbSections = lb.querySelector(".banner-lb__sections");
  let cur = -1;

  /* 본문 포맷: 이스케이프 후 **강조** → <strong> (esc 가 HTML 무력화한 뒤이므로 안전) */
  const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  /* 설명 블록 마크업 (:: 라벨 + 영문 보조 + 본문). body 는 문자열 또는 문단 배열 */
  const secHTML = (label, en, body) => {
    const paras = Array.isArray(body) ? body : [body];
    return '<div class="lb-sec">' +
      '<p class="lb-sec__h"><span class="lb-sec__mk">::</span>' + esc(label) +
        (en ? '<span class="lb-sec__en">' + esc(en) + '</span>' : '') + '</p>' +
      paras.map((p) => '<p class="lb-sec__body">' + fmt(p) + '</p>').join("") +
    '</div>';
  };

  const show = (i) => {
    cur = (i + BANNERS.length) % BANNERS.length;
    const b = BANNERS[cur];
    lbImg.src = b.src;
    lbImg.alt = b.cap;
    lbCap.textContent = b.cap;

    const info = b.info;
    if (info) {
      lbTitle.textContent = info.title || b.cap;
      let html = "";
      if (info.tools) html += secHTML("사용 툴", "TOOLS USED", info.tools);
      (info.sections || []).forEach((s) => { html += secHTML(s.label, s.en, s.body); });
      lbSections.innerHTML = html;
      lbInner.classList.remove("is-bare");
      lbPanel.scrollTop = 0;
    } else {
      lbTitle.textContent = "";
      lbSections.innerHTML = "";
      lbInner.classList.add("is-bare");
    }
  };
  const openLb = (i) => {
    show(i);
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("lb-open");
  };
  const closeLb = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("lb-open");
    cur = -1;
  };

  /* 위임 클릭 — 트랙 래퍼가 생겨도 정상 동작 */
  grid.addEventListener("click", (e) => {
    const item = e.target.closest(".banner-item");
    if (item) openLb(+item.dataset.i);
  });
  lb.querySelector(".banner-lb__close").addEventListener("click", closeLb);
  lb.querySelector(".banner-lb__prev").addEventListener("click", () => show(cur - 1));
  lb.querySelector(".banner-lb__next").addEventListener("click", () => show(cur + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowLeft") show(cur - 1);
    else if (e.key === "ArrowRight") show(cur + 1);
  });
})();
