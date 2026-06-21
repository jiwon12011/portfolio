# Portfolio Project — Claude/Codex 작업 메모

## 프로젝트 구조
- 순수 정적 HTML/CSS/JS (빌드 없음)
- 로컬 서버: `http://localhost:8765`
- 이미지: WebP 변환 후 `img/` 하위 폴더에 배치 (`/opt/homebrew/bin/cwebp` 사용)
- 섹션 크기: `height: max(100svh, calc(100vw * 1022 / 1920))`
- 폰트 크기: `clamp(min, Nvw, max)` — 기준 1920px Figma 프레임

## 제작과정(process) 패널 현황

| 프로젝트 | 패널 ID | 상태 |
|---------|--------|------|
| 자린고비 | `#process` | ✅ 완성 (6개 nav: sec1~sec8~sec14 제외) |
| POZE | `#process-poze` | ✅ 완성 (미니멀 뷰티 브랜드. 본문 ~10섹션, nav 5: OVERVIEW·VISUAL DIRECTION·REBUILD·EXPERIENCE·OUTCOME, making-poze.js). 스크롤 핀 pz-s7(COLOR DIRECTION 색카드 페인트-필). 디스플레이 타이틀(영문, 색강조 단어 없음) 아래 룰 드로우 액센트(#8b695f Dusty Rose) |
| 귀혼 | `#process-gwihon` | ✅ 완성 (7개 nav: gw1~gw7, making-gwihon.js, smooth-process 적용) |
| 유미의 세포들 | `#process-yumi` | ✅ 완성 (making-yumi.js, smooth-process 적용) |
| MathHub | `#process-mathhub` | ✅ 완성 — 본문 mh1~mh7(개요·IA재설계·탐색필터·콘텐츠탐색·페이지UI·컬러·시행착오) + nav 7개 + making-mathhub.js, smooth-process 적용. 스크롤 핀: **mh2(카오스→구조 4카드)만 유지**(mh4·mh7 핀은 사용자 요청으로 원복=once 진입). 전 타이틀 강조어(`<b>`)에 **밑줄 드로우+색 점등** 효과(.mh-emph) |
| 상상의 문 | `#process-sangsang` | ✅ 완성 — `making-sangsang.js`, 이미지 30장, mp4 영상 포함. nav·본문 추가 완료 |
| 우리 사이의 음표 | `#process-playlist` | ✅ 본문 7섹션 완성 — pl1 개요·pl2 컨셉·pl3 랜딩디자인·pl4 게임시스템(멀티루트,하트미터 CSS)·pl5 구현구조·pl6 내러티브(타임라인+캐릭터6)·pl7 트러블슈팅+클로징. Figma → cqw 포팅, `pl-*` 클래스, 에셋 `img/playlist_game/process/`(50개,1.9MB), 원본 `raw/`(gitignore). nav 7개(측정상 720px+ 오버플로 없음). 타이틀 색강조 em(#e67889)에 **핑크 글로우 점등**(makeGlow 헬퍼, 네이티브 스크롤이라 once). pl4 게임시스템 **필름스트립 핀 시도 후 사용자 요청으로 원복**(once 유지). pl7 클로징 타이틀 char-split의 NBSP 버그 수정(createTextNode 인자가 U+00A0였음→일반 공백). 남은 일: 상단 인트로 셸(plsec-01) POZE식 교체. pl3·pl6 배경은 전용 이미지 없어 그라데이션 대체 |
| 플레디스 | `#process-pledis` | ✅ 완성 — 본문 pd-hero·pd-r1~r7·outro(9섹션) + nav 5개 + making-pledis.js, smooth-process 적용. 타이틀 색강조(.pd-rN__hl / h1·h2 span, #ff4600) 7곳에 **글로우 점화** 효과. GO TO WEB CTA 주황(#ff5a2a) 오버라이드. (pd-hero·pd6 핀은 시도 후 사용자 요청으로 원복=once 유지) |

### 콘텐츠 추가할 때 할 일 (⏳ 프로젝트)
1. `process__tracks` `<ol>` 안에 `<li>` nav 항목 추가
2. `process__content` 안에 `<section class="mk-sec" id="...">` 본문 추가
3. `process__cta` `href`를 실제 배포 URL로 교체
4. nav 항목이 7개 이상이면 1440px에서 overflow 발생 — 6개 이하로 유지

## process.js 주의 사항
- `setup()` — 페이지 로드 시 모든 모달에 즉시 실행. 이벤트 바인딩/초기 상태만. **네트워크·리소스 로딩 코드 절대 금지.**
- `open()` — 모달이 실제 열릴 때 실행. 이미지 eager 전환, 영상 재생 등 여기에.

## process.js 스크롤 수정 사항 (2025-06)
- nav 클릭 시 목표 위치 계산: `getBoundingClientRect` → `offsetTop` 순회로 교체
  - 이유: 패널 오픈 `scale` 애니메이션 중 viewport px ≠ CSS px 불일치 방지
- 모달 오픈 시 이미지 `loading="eager"` 강제 설정
  - 이유: lazy 이미지 미로딩 상태에서 nav 클릭 시 레이아웃 시프트로 위치 계산 오류
  - 이 두 수정은 `setup()` 함수 내에서 처리되므로 **새 프로젝트 패널 추가 시 자동 적용됨**

## 주요 CSS 관례
- 제작과정 카드 절대 위치: Figma 픽셀 ÷ 1920 × 100% (left), ÷ 1022 × 100% (top)
- 반응형 값: `clamp(최솟값, Nvw, 최댓값)` — N = Figma픽셀 / 1920 × 100
- `data-bcl-anim="fade-up"` + `--bcl-delay` → `danmi-anim.js` IntersectionObserver 트리거

<!-- jiwon-team:start -->
# 작업 팀 (이 레포)

나(서지원)는 6명으로 구성된 고정 팀과 함께 일한다. 팀원 6명은 이 레포 `.claude/agents/` 에 설치돼 있어 이 레포에서 Agent 도구로 호출할 수 있다. **의미 있는 작업**(웹페이지/포트폴리오/UI/기능 구현/기획 등 실제 산출물이 나오는 일)에서는 아래 팀을 관여시킨다. 단순 질문·한 줄 확인·사소한 수정에는 팀을 부르지 않는다(과하면 느려짐).

## 팀원
- **team-lead** — 작업 시작 시 계획/분담 정리, 종료 시 점검·보고, 의견 충돌 시 최종 결정, 접근성·성능·일관성 게이트
- **designer** — 여백·간격·타이포·대비·반응형·일관성 (디테일 튜너, 방향은 안 바꿈)
- **developer** — 유지보수 가능하고 똑똑한 구현, 딥한 개발, 접근성
- **motion-engineer** — GSAP·ScrollTrigger·Lenis 스크롤 연출·모션 전담
- **perf-engineer** — 로딩·Core Web Vitals·이미지/글래스/모션 성능, 모바일 60fps
- **ideator** — 추가 아이디어·차별화·트렌드·카피 제안

## 호출 (트리거 문구)
사용자가 아래 같은 말을 하면 → 이번 작업은 **팀 모드**로 진행한다:
- **"우리팀 불러와"**, **"우리팀 일해"**, **"우리팀 와"**, **"내 팀 불러줘"**, **"팀이랑 같이"**, **"팀 소집"**

팀 모드 진행 순서:
1. **team-lead**(Agent 도구, subagent_type: `team-lead`)를 먼저 띄워 작업을 1~3줄로 정리하고 어떤 팀원이 붙을지 분담을 말한다.
2. 성격에 맞는 팀원(`designer`/`developer`/`motion-engineer`/`perf-engineer`/`ideator`)에게 Agent 도구로 위임한다.
3. 끝나면 **team-lead**가 점검·보고로 마무리한다.

한 명만 부르고 싶으면 이름을 말한다: 예) "designer한테 간격만 봐달라고 해", "perf-engineer로 성능 점검".
트리거 문구가 없어도 의미 있는 작업이면 아래 운영 방식대로 관련 팀원이 자동으로 붙는다.

## 운영 방식
- 실제 작업이 시작되면 성격에 맞는 팀원에게 자동 위임한다(디자인 디테일→designer, 구현→developer, 스크롤/모션→motion-engineer, 성능→perf-engineer, 기획/방향→ideator).
- 규모가 있는 작업은 team-lead가 시작 정리와 종료 보고를 맡는다.
- 성능에 영향 주는 작업(스크롤 연출·글래스·큰 이미지·번들)은 **perf-engineer를 반드시 거친다.**
- 팀원 의견이 갈리면 team-lead가 정한다.

## 항상 지킬 사용자 취향
- 사용자는 **화려하고 멋진 디자인**을 잘 만든다. 이를 존중하고 단조롭게 바꾸지 않는다. 디자이너는 방향을 갈아엎지 말고 **간격·여백·정렬 디테일만** 다듬는다.
- **글래스모피즘(backdrop-blur, 반투명 패널)은 즐겨 쓰는 표현. 금지하지 말고 잘 쓰도록 돕는다.** (대비·성능만 챙김)
- 코드는 유지보수성과 **판을 흔드는 똑똑한 해법**을 둘 다 추구한다(명료할 때 한정).
- 모션은 의미 있을 때만, `prefers-reduced-motion` 존중.
<!-- jiwon-team:end -->
