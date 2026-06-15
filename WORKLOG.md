# 작업 일지 (WORKLOG)

> jiwon12011/portfolio 작업 기록. **새 작업은 이 파일 맨 위(`## YYYY.MM.DD` 블록)에 최신순으로 추가**한다.
> 형식: 날짜 → 한 줄 요약 → 영역별 변경 → 관련 커밋. 의사결정·주의점도 함께 남긴다.

### 작성 템플릿
```markdown
## YYYY.MM.DD — 한 줄 요약

### 영역명
- 무엇을 / 왜
- 주의점·결정 이유

**커밋:** `hash` 설명
```

---

## 2026.06.15 — MathHub 제작과정 전체 빌드 + 메인 카드 캐러셀 3D 버전(원본/3D 토글) + 임시 위치 편집 도구

> ⚠️ **나중에 바꾸거나 엎을 때 아래 "되돌리기 가이드"부터 읽을 것.** 메인 카드 캐러셀은 임시 dev UI가 붙어 있고 좌표 시스템이 원본/3D 둘로 나뉜다.

### ⭐ 되돌리기 / 변경 가이드 (메인 카드 캐러셀)
- **두 버전 공존.** 우상단 토글: `localStorage('orbitVersion')` = `'3d'` | `'original'`(기본). `?ver=3d` URL로 강제 미리보기. 토글 변경 시 자동 `reload`(orbit은 1회 초기화 구조).
  - **OFF(기본)=원본** = 빌보드 + 마우스 따라 이동(legacy wobble + steering·패럴럭스). 원래 쓰던 버전.
  - **ON=3D** = perspective + 카드별 `rotateY(θ)translateZ(R)` 진짜 실린더 연속회전.
- **좌표가 버전별로 분리됨(핵심).** `js/orbit.js` 상단:
  - 원본: `CENTERS_ORIGINAL` + `GHOST_THETA0_ORIGINAL`
  - 3D: `CENTERS_3D` + `GHOST_THETA0_3D`, **최종 위치는 `THETA0_3D_OVERRIDE`(각도 rad 12) / `Y_3D_OVERRIDE`(높이 px 12)** 가 덮어씀(현재 source of truth). null이면 CENTERS_3D 기본.
  - → **3D 위치 바꾸려면 `THETA0_3D_OVERRIDE`/`Y_3D_OVERRIDE` 배열만** 고치면 됨(원본 안 깨짐).
  - 인덱스 0~11 = `CARD_NAMES` = DOM `.card-arm` 순서: visual-archive·자린고비·귀혼·about·플레디스·유미·POZE·content-lab·skills·MathHub·상상의문·우리사이의음표.
- **임시 dev 컨트롤 — 확정 후 반드시 제거**(없애도 본 기능 영향 없음):
  - HTML(`index.html` `.scene` 안): `.ver-toggle`(#orbitVerToggle) · `.orbit-pause`(#orbitPauseBtn) · `.orbit-edit-btn`(#orbitEditBtn)
  - JS(`orbit.js`): `wireVerToggle()`·`wirePause()`·`buildPosEditor()` IIFE, `userPaused` phase 게이트, `?ver` 파라미터
  - CSS(`style.css`): `.ver-toggle*`·`.orbit-pause*`·`.orbit-edit*`
  - **한 버전 최종 고정**: `IS_3D`를 하드코딩 → 위 임시 UI/JS/CSS 삭제.
- **위치 편집 워크플로우**: `?ver=3d` → ⏸ 회전 멈춤 → ✎ 위치 편집(각도/높이 실시간) → "값 복사" → override 배열에 붙여넣기.
- 튜닝 노브(3D 전용, orbit.js 상단): `CYLINDER_R`(반경=가로 넓이) · `PERSP_3D`(원근, 클수록 카드 작고 덜 휨) · `CARD_SCALE_3D`(전체 크기) · `PLAYER_SCALE_3D`(자린고비·POZE만) · `FOCUS_ADVANCE`(호버 전진).
- 모션 함정: ① 호버 = 카드 **제자리 고정 + trailing `rotateY(-θ·fa)`**(면만 정면). 중앙 이동시키면 커서 이탈 깜빡임. ② trailing 각도 **θ [-π,π] 정규화**(phase 누적 시 '팽이' 방지). ③ about 로드 정면 = `phase` 초기값 `-theta0[FRONT_CARD_3D=3]`.
- **perf 절대 규칙(검증 완료)**: `transform-style:preserve-3d` 금지(filter 평탄화로 글로우/블러 깨짐)→perspective만. 회전 카드 `backdrop-filter` 금지(모바일 붕괴). 모바일·reduceMotion 자동 2D 폴백.
- 고스트 3장(MathHub·상상의문·음표, idx9~11) = 이제 **클릭+호버 정상 카드**(GHOST 디밍/스킵 제거). `index.html`에서 해당 카드에 `data-card`(mathhub/sangsang/playlist) 부여 + `card-arm--ghost`/`aria-hidden` 제거.

### MathHub 제작과정 (#process-mathhub) — 본문 8개 섹션 완성
- 카드 개요(#mhsec-01) 아래 `process__making--mathhub`에 히어로 + #mh1~#mh7
- **1440 Figma 좌표 → `cqw`(=px/14.4)** 변환해 `.mh-sec`(container-type:inline-size) 절대배치(귀혼/유미 패턴)
- 섹션: #mh-hero · #mh1(OVERVIEW+PROBLEM) · #mh2(IA REBUILD) · #mh3(SEARCH&FILTER) · #mh4(CONTENT NAV) · #mh5(PAGE-SPECIFIC) · #mh6(COLOR, 순수 CSS) · #mh7(TROUBLESHOOTING+OUTRO)
- nav 목차 7개 + 인트로 PROCESS INDEX 7개 — `data-track`↔섹션 id(mh1~mh7) 1:1(process.js 제네릭, 자동)
- 모션 `js/making-mathhub.js`(GSAP 진입, transform/opacity·once·reduced-motion) + 스크립트 태그 + smooth-process SELECTORS·**style.css scroll-behavior:auto 목록에 `#process-mathhub` 추가**(이중 스무딩 방지)
- 손글씨 `@font-face 'GangwonEducationHyunokSam'`(noonfonts CDN) → 섹션2 인용구
- ⚠️ 함정: `nth-of-type`은 같은 태그 전체를 셈(모디파이어 클래스로 해결) / **투명모서리 이미지는 box-shadow·border 대신 `filter:drop-shadow`**(알파 따라가 박스 제거) / `.mh-s2__quote`(position:static)에 transform 주면 absolute 자식 튐→opacity만 / GSAP `from`+`clearProps:"transform"`로 translateX(-50%) 중앙정렬 리사이즈 안전 / making header 셀렉터 `[class$="__title"],[class*="__title--"]`로 과매칭 방지
- 섹션2 빠진 에셋(BEFORE 스크린샷+AFTER 아이콘4) 받아 변환. 카드개요 영상 `mathhub_process_re.mp4`로 교체

### 자린고비 인트로 영상
- `img/jaringobi/jaringobi_intro.mp4` 새 영상 교체 + **`?v=3` 캐시버스팅**(파일 바꿔도 브라우저 캐시로 안 바뀌어 보임). 원본 git `29a3107` + `.src-png` 백업

### 에셋 워크플로우
- PNG→WebP: `/opt/homebrew/bin/cwebp`(배경/일반 q82 + 가로1920 상한, 아이콘 lossless). **원본 PNG는 `.src-png/`(gitignore) 백업** 후 루트 정리. MathHub 33종 + 섹션2 5종

### 팀 하네스(jiwon-harness) 설치
- `.claude/agents`(6) + commands + 완료검증 훅 + `team-memory/`. "우리팀 불러와"로 팀 모드
- ⚠️ 이번에 designer 좌표 제안이 회전+인물가림으로 빗나가 여러 번 원복 → **배치/좌표는 에이전트 추측보다 위치 편집기로 직접 잡는 게 정답**(이 교훈으로 편집 패널 제작)

**커밋(주요):** `4a5f696` 이미지33 WebP · `c17ab7d`~`bec42d5` MathHub 섹션 · `df7d8df` 섹션4 도트+drop-shadow · `d43ae2b` 제작과정 모션+스무스 · `ce8c4c3` nav+영상 · `23e26bb` 버전토글 · `2404cfd` 3D실린더 · `dc252f5` 호버제자리·크기 · `80970ae` 회전멈춤 · `81ec217` 편집패널 · `3902935` 위치override

---

## 2026.06.14 — 피커 휠 목차 마감 + 프로젝트 순서 변경 + 제작과정 모션·prev/next 전환 + 숫자 ghost 수정

### 피커 휠 PROJECTS 목차 (라이브 1개로 통합)
- `feat/picker-toc` 머지 → 정렬·색·안착·eq 손질
- **정렬 버그**: `measureRow`가 트랙 첫 카드(런웨이, `scale(.80)`)를 재서 `getBoundingClientRect` 가 줄어든 시각 높이를 줌 → `--row/--frame-h` 가 작게 잡혀 프레임-카드 한 칸 어긋남. **가운데 칸(`data-slot="0"`, scale 1) 실측으로 수정**
- 안착 "덜커덩": 롤 시작 시 각 카드 `data-slot` 을 목적지로 갱신 → scale/opacity/blur 가 굴림과 함께 모핑(settle 점프 제거)
- 프레임 색 테마색(`--it-box-bg/border`)으로 복원(무지개 제거), eq 이퀄라이저 바 → **펄스 도트**
- 팀 점검 후 a11y(롤 중 aria/도트 이관, 클립 칸 aria-hidden)·모션(이징·글로우)·perf(eager·펄스 정지) 마이크로 패치

### 프로젝트 순서 변경 ⭐
- 순서: **귀혼·자린고비·유미·상상의문·MathHub·플레디스·POZE·우리사이의음표**
- ⚠️ **순서의 진짜 기준 = `index.html` 의 `.deck-panel` DOM 순서**(deck.js 가 querySelectorAll 순서를 그대로 피커 `setCurrent` 에 넘김). 바꾸려면 ① 인트로 패널 8개 블록 이동 ② 각 패널 정적 `PROJECT 0N` eyebrow 번호 ③ `intro-toc.js` PROJECTS 배열+num — **셋 다**. (하단 `NN/08` 페이저는 deck.js 동적 갱신, `.process` 모달 DOM 순서는 무관)

### 제작과정 디테일
- POZE 노션 배지 세이지그린→**더스티 로즈(`#cf9ea6`)**, 플레디스 NOW PLAYING **앨범아트** 추가
- **플레디스 제작과정 스크롤 모션 신규**(`js/making-pledis.js`, GSAP ScrollTrigger). 9섹션 시네마틱
- ⚠️ **smooth-process 적용 모달은 CSS `scroll-behavior:auto` 목록(style.css ~1450)에 꼭 포함.** 빠지면 기본 `scroll-behavior:smooth` 와 lerp 가 이중 스무딩 충돌 → 스크롤이 바닥까지 안 감(플레디스가 이걸로 헤맴)
- ⚠️ **플레디스 섹션 숫자 ghost**: `-webkit-text-stroke` + `background-clip:text`(투명 채움) = "4" 등 글리프 외곽선이 이중 렌더되는 webkit 버그(정적 CSS, 모션 무관). 외곽선 제거 + 그라데이션 끝색 `#fff→#ffc9bf`(흰 배경에 안 묻히게)

### NOW PLAYING ⏮/⏭ → 양옆 프로젝트 제작과정 전환 (신규)
- 순환 + 덱/피커 동기화(닫으면 그 프로젝트로 복귀) + 8개 전부
- **reorder-safe 핵심**: 양옆을 `window.__introToc.order`(=PROJECTS 키 순서, 단일 소스)에서 계산하고 **키로** 모달 open → 목차 순서 바꿔도 자동. `.process` 모달 DOM 순서에 의존 안 함
- 전환은 **크로스페이드로 결정**(슬라이드 반려). ⚠️ 모달이 닫힐 때 `display:none` 이라 열 때 첫 페인트 비용 발생 → 슬라이드는 "타겟 페인트 전엔 못 움직여" 시작 멈칫이 보임. 깜빡임 3원인 = ① `void offsetWidth` 강제 리플로우 ② 슬라이드 끝 backdrop-filter 재활성 플래시 ③ 끝의 `ScrollTrigger.refresh`(197개) 프리즈 → 각각 제거(리플로우 삭제 / 블러 토글 안 함 / refresh·덱싱크를 `requestIdleCallback`)
- `__introToc.order` 노출(intro-toc.js), `__deck.jumpToProject(key)` 노출(deck.js, 쿨다운 없이 즉시 동기화)

### 검증
- 전 JS 17개 문법 OK + 헤드리스(`npx playwright`, 전역 `~/.npm/_npx/*`)로 6개 플로우 콘솔 에러 0

**커밋:** `efefd2f` 피커 색/정렬/덜커덩/eq · `16d7a92` 순서 재배치+a11y/모션/perf+POZE배지/플레디스앨범아트 · `78ab3a4` 플레디스 모션+스무스스크롤 · `0f0a8af` prev/next 전환 · `b05574d` 숫자 ghost

---

## 2026.06.04 — 인트로 소개·테마 마감 + POZE 제작과정 모달 + 비례 스케일링

### 프로젝트 인트로
- 소개 문구 4개 실제 내용으로 교체: 자린고비(소비를 게임처럼 / 절약을 습관으로…), 귀혼(스크롤만으로 귀혼의 세계를…), 유미(세계관 팬 아카이브…), POZE(브랜드 아이덴티티부터 커머스까지…)
- 인트로 글래스 박스 **회색 띠 수정** — box-shadow의 하드코딩 파란 글로우(`0 0 22px`) 제거(따뜻 테마와 충돌·세로 긴 창에서 번짐)

### POZE 제작과정 모달 (신규)
- 자린고비 모달 구조 복제 → 첫 화면(뮤직플레이어형): 좌측 5트랙(브랜드소개/비주얼무드/사용자경험/리빌드/결과), NOW PLAYING POZE, 히어로 영상(poze_process.mp4), 4카드(Personal Project·GO TO WEB·ADMIN SYSTEM·PROCESS)
- 네비 하단 **GO TO WEB** 고스트 버튼(자린고비 GO TO APP 자리)
- **따뜻한 다크 토프 + 핑크(무화과) 테마**(`.process--poze` 한정), 히어로 크기 자린고비와 동일(`#pzsec-01`)
- `process.js` **멀티-모달 리팩터** — 인트로 클릭 시 프로젝트별 모달 오픈(자린고비/POZE), 모달 없는 프로젝트는 클릭-오픈 비활성
- 에셋: 4배 업스케일 PNG → webp 교체(커밋 `4ff14bc`). 소스는 `process/poze/`(gitignore)
- ⚠️ TODO: GO TO WEB·ADMIN·PROCESS(Notion) URL 현재 placeholder(`#`), 본문 섹션(pz1~5)

### 인트로 영상 / 커서
- 인트로 영상 전부 **음소거**(muted + deck.js), 귀혼 영상 교체(사용자 업로드본)
- 플레이 커서 **톤다운**(어두운 인트로에서 과한 헤일로 완화, 커밋 `438c924`)

### 1440→1920 비례 스케일링 (팀 작업)
- **zoom 방식 반려**(perf — 기존 `--scale` transform 시스템과 충돌·canvas/backdrop 비용)
- **인트로/모달 유동(vw) 확대**: clamp 상한을 1920값으로(제목 60→75px@1920 등), **1440 렌더 불변**(case별 vw 재앵커). perf 0
- **메인 오빗**: 세로기준(vh/847) 실험 → 양옆 빈틈/블러 시도했으나 **풀스크린 cover로 원복**(사용자 요청). 대신 **카드만 `--card-k`로 1920에서 축소**(≤1440=1, 1920≈0.88, 씬·배경·위치 불변)
- 메모: 오빗은 배경·인물(1920×1095 cover)·카드(1466×847 캔버스)가 한 묶음(cover)이라, 풀스크린+카드무크롭 동시 달성은 끝 카드 안전구역 이동 필요(보류)

---

## 2026.06.03 — 자린고비 제작과정 모달 마무리 + 프로젝트 인트로 전면 정비

### 제작과정 모달 (자린고비)
- **섹션 14·15 추가로 본문 1~15 완성**
  - 섹션14: TOOLS / ROLE / TIME 크레딧(앱아이콘 9개·기간 표기)
  - 섹션15: `jaringobi_process.mp4` 풀블리드 마무리 영상 — 뷰 진입 시에만 재생(IntersectionObserver), `preload="metadata"`로 레이아웃 안정
- **네비(PLAYLIST) ↔ 본문 섹션 연결**
  - 01~07 트랙을 실제 섹션(sec1·2·3·4·6·8·14)에 매핑 → 클릭 시 부드러운 스크롤 이동
  - 스크롤스파이를 **위치 기반**으로 교체(컨테이너 40% 기준선), **맨 위(랜딩)에선 무선택**
- **GO TO APP**(좌측 네비 하단, 얇은 고스트 버튼) → 웹앱 `https://1team-jaringobi.vercel.app/`
- **첫 화면 카드 4개 전체 클릭 링크화**(stretched-link, 새 탭·`noopener`)
  - LIVE SERVICE→Google Play / MARKETING→TikTok / PROCESS→Notion
- 섹션9 인증샷 사진 위치 `top: 62%`

**커밋:** `3b255a3` 섹션 8~15 마무리 · `929fcd1` 네비 연결 + GO TO APP·카드 링크

### 팝업 모션 · 반응형
- 제작과정 팝업 **등장/퇴장 모션**: 스크림 페이드 + 패널 떠오름·스케일(닫힘도 부드럽게, `prefers-reduced-motion` 존중)
- 팝업 좌우→세로 전환 분기 **820 → 640px**로 하향(좁아져도 좌우 배치 유지, 휑한 전체폭 네비 방지)

**커밋:** `1fdb7ba`

### 메인 페이지
- 오빗 카드 **귀혼 ↔ 플레디스 위치 교환** (위치는 `orbit.js`의 `CENTERS` 배열이 DOM 인덱스로 결정 — 인라인 `--x/--y`·`data-angle`은 no-js 폴백/예약값)

**커밋:** `1fdb7ba`

### 프로젝트 인트로
- 자린고비 인트로 **PROCESS INDEX를 실제 제작과정 7섹션**(Overview/Desk Research/Goal & Persona/Problem Solving/Visual/Experience/Outcome)에 맞춤
  - 주의: 좌하단 페이저(`01/0N`)는 `deck.js`가 **프로젝트 수**로 동적 계산 → 제작섹션과 무관, 건드리지 않음
- **귀혼·유미·POZE 인트로 패널 추가**(자린고비 구조 복제, 소개문구 임시 + `<!-- TODO -->`). 플레디스는 영상 없어 보류. `deck.js`가 `.deck-panel` 자동 인식
- **인트로 영상 전부 음소거**(`muted` 속성 + `deck.js` 재생 시 `v.muted=true`)
- 귀혼 영상 교체(사용자가 GitHub에 직접 업로드 → 로컬 sync)

**커밋:** `929fcd1`, `1fdb7ba`, `bdb30a6`

### 프로젝트별 인트로 테마 (배경영상 무드 매칭) ⭐
- 기존 문제: 4개 인트로가 모두 남색 글자+파란 글래스 → 따뜻한 영상 위에서 붕 뜸
- 인트로 UI 색을 **테마 변수**(`--it-accent/title/text/muted/box-bg/box-border/eq`)로 변수화(남색 fallback, `#intro-XXX` 한정 → 메인·모달 무영향)
- **핵심 인사이트(검증 루프에서 발견):** 영상들이 밝은↔어두운으로 **크게 변동** → 어두운 글자는 어두운 프레임에서 안 읽힘
  - **밝은 영상(자린고비)** → 어두운 갈색 글자 + 크림 글래스 + 오렌지 액센트
  - **어두운/변동 영상(귀혼·유미·POZE)** → 밝은 오프화이트 글자 + 좌측 다크 스크림으로 통일
    - 귀혼: 골드(등불) / 유미: 핑크 + 다크 플럼 글래스 / POZE: 세지그린(초록 사과) + 다크 모카
- 글래스모피즘(rim-light·blur)은 유지, 색만 테마. perf 영향 없음(새 backdrop-filter 없음)
- 남은 참고: 유미 영상은 자체 자막·UI가 박혀 있어 바쁜 프레임에선 오버레이와 약간 겹침(영상 콘텐츠 특성)

**커밋:** `bdb30a6` 프로젝트 인트로 배경영상별 테마 + 인트로 영상 음소거

### 플레이 커서 톤다운
- 마우스 따라다니는 ▶ 글래스 디스크(`#play-cursor`)가 밝은 자린고비에선 묻혔는데 **어두운 인트로(귀혼·유미·POZE)에선 흰 헤일로가 과하게** 튐
- 크기 52→42px, **밝은 블루 글로우 제거**, 불투명도/펄스링/라벨/리플 모두 톤다운 → 양쪽 다 은은하게
- 주의: 커서는 매 프레임 이동 → `backdrop-filter` 안 씀(perf)

### 에셋 파이프라인 메모
- 4배 업스케일 PNG → `cwebp`로 2000px webp 변환(소스는 `.gitignore`, webp만 커밋)
- 영상: `img/<project>/<project>_intro.mp4`(+ `_process.mp4`)
