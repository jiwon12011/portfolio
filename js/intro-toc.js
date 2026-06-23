/* =======================================================================
   intro-toc.js — 인트로 PROJECTS 목차 (라이브 단일 "피커 휠")
   -----------------------------------------------------------------------
   · 단일 데이터(PROJECTS) 한 곳에서 관리 → 프로젝트 추가는 배열에 한 줄.
   · 패널마다 렌더하던 5칸 목차 → deck 전체에 고정된 "라이브 목차 1개"로 통합.
     (.intro-list--live · index.html 패널 바깥). 가로(패널 슬라이드)와 세로(목차)는
     완전히 직교 분리 — 패널은 translateX, 목차는 트랙 translateY 로만 움직인다.
   · 피커 휠 구조: 전체 링(N개)을 한 줄짜리 트랙(.intro-list__track)에 렌더하고,
     현재 프로젝트가 가운데 칸(선택 프레임)에 오도록 트랙을 translateY 한다.
     - 가운데 ±HALF 칸만 보이고 나머지는 viewport 클립으로 잘림.
     - 네비 시: 트랙을 거리(d)만큼 한 번에 트랜지션(인접=1칸, 먼 점프=다단 롤)
       → transitionend 에 트랜지션 끄고 translateY 0 복귀 + DOM 재중심(점프 안 보임).
   · --row(한 칸 높이+gap)는 JS 가 getBoundingClientRect 로 실측해 세팅(반응형 clamp).
   · 선택 프레임(.intro-list__frame)은 가운데 고정 오버레이로 분리 — Stage1 은 기본 박스.
   · 클릭은 deck.js 가 document 위임으로 잡음(트랙 재렌더로 li 가 갈려도 안전).

   ▼ motion-engineer 훅 (Stage2):
     - 선택 프레임:        .intro-list__frame  (가운데 고정 오버레이 — 글래스/기울임/블러)
     - 트랙:               .intro-list__track  (translateY 가 걸리는 단일 ul)
     - 칸 거리 위계:       .intro-list__item[data-slot="-2..2"] (가운데=0)
     - 한 칸 높이 변수:    --row (live 요소에 px 로 세팅됨)
     - 롤 시작/끝 지점:    setCurrent() 의 startRoll() / settle()(transitionend)
     - 롤 진행 상태 훅:    live.classList "is-rolling" + live.style --roll-d / --roll-dir
====================================================================== */
(() => {
  /* ▼ 프로젝트 추가는 여기 한 줄. 순서 = 목차 순환 순서.
     preview = 호버 미리보기용 경량 클립(없으면 정적 썸네일만) */
  const PROJECTS = [
    { key: "yumi",      num: "01", title: "유미의 세포들", sub: "Branding / 2024", thumb: "img/main/main_yumi.webp",      preview: "img/yumi_cell/yumicell_intro2.mp4" },
    { key: "jaringobi", num: "02", title: "자린고비",      sub: "Branding / 2025", thumb: "img/main/main_jaringobi.webp", preview: "img/jaringobi/jaringobi_intro.mp4?v=3" },
    { key: "gwihon",    num: "03", title: "귀혼",          sub: "UXUI / 2025",     thumb: "img/main/main_hon.webp",       preview: "img/hon/hon_thumb.mp4" },
    { key: "mathhub",   num: "04", title: "MathHub",       sub: "UXUI / 2026",     thumb: "img/main/main_mathhub.webp",   preview: "img/mathhub/mathhub_intro.mp4" },
    { key: "pledis",    num: "05", title: "플레디스",      sub: "Branding / 2025", thumb: "img/main/main_pledis.webp",    preview: "img/pledis/pledis_intro.mp4?v=2" },
    { key: "poze",      num: "06", title: "POZE",          sub: "Branding / 2024", thumb: "img/main/main_poze.webp",      preview: "img/poze/poze_thumb.mp4" },
    { key: "sangsang",  num: "07", title: "상상의 문",     sub: "Web / 2025",      thumb: "img/main/main_door.webp",      preview: "img/sangsangdoor/sangsangdoor_intro.mp4" },
    { key: "playlist",  num: "08", title: "우리 사이의 음표", sub: "Visual Novel / 2025", thumb: "img/main/main_playlist_game.webp", preview: "img/playlist_game/playlist_game_intro.mp4?v=2" },
  ];

  const N = PROJECTS.length;
  const SLOTS = Math.min(5, N);            // 보일 칸 수(가운데 포함, 최대 5)
  const HALF = Math.floor(SLOTS / 2);      // 가운데 위/아래 보이는 칸 수(5 → 2)

  const live = document.querySelector(".intro-list--live");
  const track = live && live.querySelector(".intro-list__track");
  if (!live || !track) return;

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 한 칸 마크업. slot = 가운데(0) 기준 시각 거리(−HALF..HALF), 그 밖은 |slot|>HALF(클립됨).
     클립/런웨이 칸(|slot|>HALF)은 화면 밖이라 aria-hidden — 스크린리더가 보이는 5칸만 읽도록(중복·미표시 칸 제외). */
  const itemHTML = (p, slot, active) =>
    '<li class="intro-list__item' + (active ? " is-active" : "") + '"' +
      ' data-go="' + p.key + '" data-slot="' + slot + '"' +
      ' role="button" tabindex="' + (active ? "0" : "-1") + '"' +
      ' aria-label="' + esc(p.title) + ' 프로젝트로 이동"' +
      (active ? ' aria-current="true"' : "") +
      (Math.abs(slot) > HALF ? ' aria-hidden="true"' : "") +
      (p.preview ? ' data-preview="' + p.preview + '"' : "") + ">" +
      '<img src="' + p.thumb + '" alt="" loading="eager" />' +
      "<div><span>" + esc(p.num) + "</span><h4>" + esc(p.title) + "</h4><p>" + esc(p.sub) + "</p></div>" +
      '<span class="intro-list__eq" aria-hidden="true"></span>' +
    "</li>";

  /* 전체 링을 cur 가 가운데(off 0) 오도록 렌더. 위아래 대칭으로 RING_HALF 칸씩 펼친다.
     RING_HALF = ceil(N/2) → 어떤 최단경로 롤(거리 ≤ floor(N/2))이든 양쪽에 런웨이가 항상 존재
     (롤 중 들어오는 칸이 비지 않음). data-slot = 시각 거리, |slot|>HALF 는 viewport 가 클립.
     N 짝수면 양 끝(off=±RING_HALF)이 같은 프로젝트일 수 있으나 클립 영역이라 무방. */
  const RING_HALF = Math.ceil(N / 2);
  const renderFor = (cur) => {
    let html = "";
    for (let off = -RING_HALF; off <= RING_HALF; off++) {
      const idx = (cur + off + N * 100) % N;  // 큰 양수 보정 → 음수 모듈로 안전
      html += itemHTML(PROJECTS[idx], off, off === 0);
    }
    return html;
  };

  /* 한 칸 실측 높이(+gap) → --row. 반응형 clamp 때문에 하드코딩 금지, 매번 측정.
     gap 은 트랙 computed style 의 row-gap 으로 읽는다. */
  const measureRow = () => {
    /* 반드시 가운데 칸(data-slot="0")을 잰다 — 다른 칸은 transform: scale(<1) 이 걸려
       getBoundingClientRect().height 가 "시각상 줄어든" 높이를 돌려주기 때문(레이아웃 높이 아님).
       scale 칸을 재면 --row/--frame-h 가 작게 잡혀 프레임이 가운데 카드와 한 칸 어긋난다. */
    const first = track.querySelector('.intro-list__item[data-slot="0"]')
               || track.querySelector(".intro-list__item");
    if (!first) return 0;
    const h = first.getBoundingClientRect().height;
    const cs = getComputedStyle(track);
    const gap = parseFloat(cs.rowGap || cs.gap || "0") || 0;
    const row = h + gap;
    live.style.setProperty("--row", row + "px");
    live.style.setProperty("--frame-h", h + "px");  // 선택 프레임 높이 = 한 칸 높이(gap 제외)
    return row;
  };

  let current = -1;            // 아직 미설정(메인). setCurrent 로 진입.
  let rolling = false;         // 롤 진행 중(연속 입력 가드)
  let cleanupTimer = null;     // transitionend 누락 대비 폴백 타이머
  let pendingEnd = null;       // 진행 중인 롤의 transitionend 핸들러(인터럽트 시 해제)

  const resolve = (v) => {
    if (typeof v === "number") return ((v % N) + N) % N;
    const i = PROJECTS.findIndex((p) => p.key === v);
    return i < 0 ? -1 : i;
  };

  /* 트랙을 즉시(트랜지션 없이) cur 중심으로 재렌더 + translateY 0 복귀.
     렌더 직후 측정해 --row 갱신(리사이즈/폰트 로드 후에도 정확). */
  const recenter = (cur) => {
    track.style.transition = "none";
    track.style.transform = "translateY(0)";
    track.innerHTML = renderFor(cur);
    measureRow();
    void track.offsetWidth;  // reflow: 다음 트랜지션이 깔끔히 출발
  };

  /* hadFocus: 교체 직전 목차 항목에 키보드 포커스가 있었는지 → 새 가운데로 이관 */
  const focusCenter = () => {
    const c = track.querySelector('.intro-list__item[data-slot="0"]');
    if (c) { try { c.focus({ preventScroll: true }); } catch (e) {} }
  };

  /* 라이브 목차 갱신 진입점.
     idx : PROJECTS 인덱스 또는 key
     dir : +1(다음)/−1(이전)/0(점프)  — 부호 방향, 거리는 내부에서 계산 */
  const setCurrent = (idx, dir = 0) => {
    const next = resolve(idx);
    if (next < 0 || next === current) return;
    const prev = current;
    current = next;

    /* 테마 즉시 반영(롤 중에도 색은 바로 바뀌어도 무방) */
    live.dataset.project = PROJECTS[next].key;

    const hadFocus = track.contains(document.activeElement) &&
      document.activeElement.classList &&
      document.activeElement.classList.contains("intro-list__item");

    /* 첫 진입(prev<0) · reduce → 연출 없이 즉시 재중심 */
    if (prev < 0 || reduce()) {
      if (cleanupTimer) { clearTimeout(cleanupTimer); cleanupTimer = null; }
      rolling = false;
      live.classList.remove("is-init");   // 실제 진입 시작 → 이후부터 frameRimFlash 허용
      recenter(next);
      if (hadFocus) focusCenter();
      return;
    }

    /* ── 굴러서 이동: 현재 DOM(prev 중심) 기준으로 d칸 만큼 translateY 트랜지션 ──
       방향/거리: 순환 최단 거리 + dir 부호로 시각 진행 방향 결정.
       deck 가 dir(±1)을 주면 그 방향 우선, 0(점프)이면 최단거리로 자동 결정. */
    let d = next - prev;
    // 순환 최단 거리로 정규화(−N/2..N/2)
    d = ((d % N) + N) % N;
    if (d > N / 2) d -= N;
    let signed = d;
    if (dir > 0 && signed < 0) signed += N;       // 강제 다음 방향(아래로 굴림)
    else if (dir < 0 && signed > 0) signed -= N;  // 강제 이전 방향(위로 굴림)
    const dist = Math.abs(signed);
    if (dist === 0) { recenter(next); return; }

    /* 이전 롤이 진행 중이면 타이머·리스너 정리(인플라이트 롤은 버리고 새 롤로 대체) */
    if (cleanupTimer) { clearTimeout(cleanupTimer); cleanupTimer = null; }
    track.removeEventListener("transitionend", pendingEnd);

    /* 트랙을 prev 중심으로 재렌더 후 translateY 0 에서 출발 — 인터럽트(롤 중 새 입력)
       시에도 시작 DOM 이 항상 정확히 맞는다. recenter 가 transition:none + reflow 처리. */
    recenter(prev);

    /* 모션 훅: 거리/방향을 CSS 변수로 노출(Stage2 가 기울임/블러 강도에 활용) */
    live.style.setProperty("--roll-d", String(dist));
    live.style.setProperty("--roll-dir", signed > 0 ? "1" : "-1");
    live.classList.add("is-rolling");
    rolling = true;
    track.style.willChange = "transform";   // 롤 중에만 레이어 승격(정지 중 VRAM 절약)

    /* 굴림 시간: 인접 한 칸 .42s, 먼 점프는 칸당 가속(휠 튀기듯) — 칸수 √스케일로 캡 */
    const dur = Math.min(0.9, 0.42 + Math.sqrt(dist - 1) * 0.16);
    const ease = dist <= 1
      ? "cubic-bezier(.22,1,.36,1)"            // 인접: 부드럽게 한 칸 안착
      : "cubic-bezier(.16,1,.3,1)";            // 먼 점프: 빠른 출발 + 감속 착지(expo-out, 휠 스핀 물리감)
    track.style.transition = `transform ${dur}s ${ease}`;
    /* signed>0(다음): 콘텐츠가 위로 올라가야 다음 칸이 가운데로 → translateY 음수.
       --row(px) 로 calc → 한 칸 실측 높이만큼 정확히 굴림. */
    track.style.transform = `translateY(calc(${-signed} * var(--row)))`;

    /* ── 덜커덩 제거: 롤 시작 시 각 카드 data-slot 을 목적지(=−signed 이동) 기준으로 즉시 갱신.
       recenter(prev) 의 reflow 가 "from" 스냅샷을 확정했으므로, 슬롯이 바뀌면 CSS 가 각 카드의
       scale/opacity/blur 를 굴림 dur/ease 에 맞춰 모핑한다. 가운데로 들어오는 카드가 굴러오며
       풀사이즈로 차오르고, settle 의 recenter(next)는 이미 같은 슬롯값이라 점프가 안 보인다.
       transition 을 트랙 굴림과 동일 dur/ease 로 동기화(filter 포함 — 기본 transition 엔 filter 없음). */
    const itemTrans = `background .25s, border-color .25s,` +
      ` transform ${dur}s ${ease}, opacity ${dur}s ${ease}, filter ${dur}s ${ease}`;
    track.querySelectorAll(".intro-list__item").forEach((item) => {
      item.style.transition = itemTrans;
      const ns = parseInt(item.dataset.slot, 10) - signed;  // 목적지 슬롯
      item.dataset.slot = String(ns);
      /* 롤 도는 동안에도 활성/포커스/aria 를 새 가운데(ns===0)로 즉시 이관.
         안 하면 ~0.5s 간 "재생 중" 도트가 나가는 카드에 남고 aria-current 가 어긋남. */
      const isC = ns === 0;
      item.classList.toggle("is-active", isC);
      item.tabIndex = isC ? 0 : -1;
      if (isC) item.setAttribute("aria-current", "true");
      else item.removeAttribute("aria-current");
      /* 화면 밖(클립) 칸은 SR 에서 숨김 — 보이는 5칸만 노출 */
      if (Math.abs(ns) > HALF) item.setAttribute("aria-hidden", "true");
      else item.removeAttribute("aria-hidden");
    });

    const settle = () => {
      track.removeEventListener("transitionend", onEnd);
      pendingEnd = null;
      if (cleanupTimer) { clearTimeout(cleanupTimer); cleanupTimer = null; }
      rolling = false;
      /* current 는 이미 next. 트랙을 next 중심으로 재중심 + translateY 0 (점프 안 보임).
         data-slot 이 이미 목적지 기준이라 재렌더해도 시각 점프 없음. */
      recenter(next);
      /* is-rolling 해제는 recenter 뒤로 — DOM 안정 후 frameRimFlash 가 깔끔히 발동(확정 튐 완화) */
      live.classList.remove("is-rolling");
      track.style.willChange = "auto";       // 롤 끝 → 레이어 해제
      if (hadFocus) focusCenter();
    };
    const onEnd = (e) => { if (e.target === track && e.propertyName === "transform") settle(); };
    pendingEnd = onEnd;
    track.addEventListener("transitionend", onEnd);
    /* transitionend 누락 방어(탭 비활성 등) — dur + 여유 후 강제 settle */
    cleanupTimer = setTimeout(settle, dur * 1000 + 120);
  };

  /* deck.js 공개 API */
  window.__introToc = {
    setCurrent,
    indexOf: (key) => PROJECTS.findIndex((p) => p.key === key),
    /* 프로젝트 순환 순서(단일 소스) — 제작과정 prev/next 등이 양옆 프로젝트를 키로 계산할 때 사용.
       순서를 바꾸려면 위 PROJECTS 배열만 고치면 됨(이걸 참조하는 곳은 자동으로 따라옴). */
    order: PROJECTS.map((p) => p.key),
    /* 전체 프로젝트 데이터(단일 소스) — 모바일 메인(mobile-home.js)이 리스트·오빗 링을
       이 한 배열로 렌더. key/num/title/sub/thumb/preview 그대로 노출(불변 사용). */
    projects: PROJECTS,
  };

  /* 초기 seed: 첫 프로젝트로 재중심해 둠(메인에선 CSS 가 숨김). current 는 −1 로 둬서
     deck 의 첫 setCurrent(실제 진입)가 reduce 폴백처럼 즉시 재중심으로 정확히 그리게 한다.
     is-init: 시드 단계 표시 — 첫 진입 전까지 frameRimFlash 가 의미 없이 1회 발동하는 것 차단. */
  live.classList.add("is-init");
  recenter(0);
  live.dataset.project = PROJECTS[0].key;

  /* 폰트 로드 후 재중심 — 첫 측정은 폴백 폰트 기준이라 카드 높이(=--row/--frame-h)가
     웹폰트 스왑 후 달라지면서 프레임과 가운데 카드가 한 칸 어긋날 수 있음. 폰트 준비되면
     현재 중심으로 다시 그려(measureRow 포함) 정합을 맞춘다. 롤 중이면 settle 이 처리. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (!rolling) recenter(current < 0 ? 0 : current);
    });
  }

  /* 리사이즈/폰트 로드 후 --row 재측정(롤 중이 아닐 때만, 레이아웃 정합 유지) */
  let rT = null;
  addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(() => { if (!rolling) measureRow(); }, 150);
  });
})();
