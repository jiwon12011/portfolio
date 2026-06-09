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
| POZE | `#process-poze` | ✅ 완성 (5개 nav: pz1~pz-s10) |
| 귀혼 | `#process-gwihon` | ⏳ 셸만 있음 — nav 목차 + 본문 섹션 미추가 |
| 유미의 세포들 | `#process-yumi` | ⏳ 셸만 있음 — nav 목차 + 본문 섹션 미추가 |
| MathHub | `#process-mathhub` | ⏳ 셸만 있음 — nav 목차 + 본문 섹션 미추가 |
| 상상의 문 | `#process-sangsang` | ⏳ 셸만 있음 — nav 목차 + 본문 섹션 미추가 |
| 우리 사이의 음표 | `#process-playlist` | ⏳ 셸만 있음 — 본문 섹션 미추가 |
| 플레디스 | — | ❌ 패널 자체 없음 — 추가 필요하면 jaringobi 구조 참고 |

### 콘텐츠 추가할 때 할 일 (⏳ 프로젝트)
1. `process__tracks` `<ol>` 안에 `<li>` nav 항목 추가
2. `process__content` 안에 `<section class="mk-sec" id="...">` 본문 추가
3. `process__cta` `href`를 실제 배포 URL로 교체
4. nav 항목이 7개 이상이면 1440px에서 overflow 발생 — 6개 이하로 유지

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
