# 방문 대시보드 — Cloudflare Worker

비밀번호로 잠긴 **한국어 방문자 대시보드**. 정적 GitHub Pages는 서버 인증·API 토큰
은닉을 못 하므로 Cloudflare Worker 하나가 ①HTTP Basic Auth 게이트 ②GoatCounter API
토큰 숨김 ③한국어 대시보드 HTML 렌더를 모두 처리한다.

흐름: 사용자가 `<worker-name>.workers.dev` 접속 → 브라우저 기본 로그인 창에 아이디/비번
입력 → 한국어 대시보드. 비번 없으면 `401`로 아무것도 안 보인다.

- 파일: [`visitor-dashboard.js`](./visitor-dashboard.js) (모듈 문법 `export default { fetch }`)
- 데이터 출처: GoatCounter (`https://jiwonseo.goatcounter.com/api/v0`)
- 차트: Chart.js (CDN), 글래스모피즘 다크 UI, 모바일 1열 반응형

---

## 환경변수(시크릿) — 코드에 하드코딩 금지, 전부 env

| 변수 | 설명 |
|------|------|
| `DASH_USER` | 로그인 아이디 (직접 정함) |
| `DASH_PASS` | 로그인 비밀번호 (직접 정함) |
| `GC_TOKEN`  | GoatCounter API 토큰 — GoatCounter **Settings → API**에서 **read 권한**으로 발급 |

> 사이트 코드(`jiwonseo`)는 공개값이라 `visitor-dashboard.js` 상단 상수(`GC_SITE`)로 둔다.
> 시크릿 3개는 절대 파일에 적지 말고 Worker 변수에만 넣는다.

---

## 배포 (대시보드 UI — wrangler 없이)

1. **Cloudflare 무료 계정** 생성 → 로그인 (https://dash.cloudflare.com).
2. 좌측 **Workers & Pages → Create application → Create Worker**.
3. 이름 정하고(예: `visitor-dashboard`) **Deploy** → 생성된 Worker의 **Edit code**(`</>`) 진입.
4. 기본 코드를 모두 지우고 [`visitor-dashboard.js`](./visitor-dashboard.js) 내용을 **통째로 붙여넣기** → **Deploy**.
5. Worker 상세 → **Settings → Variables and Secrets**에서 아래 3개를 **Secret(Encrypt)** 으로 추가:
   - `DASH_USER` = 원하는 아이디
   - `DASH_PASS` = 원하는 비밀번호
   - `GC_TOKEN`  = GoatCounter API 토큰
   추가 후 **Deploy(또는 Save and deploy)** 로 반영.
6. `https://<worker-name>.<계정>.workers.dev` 접속 → 브라우저 로그인 창에 아이디/비번 입력 → 대시보드 확인.

### 대안: wrangler CLI 한 줄

```bash
npx wrangler deploy visitor-dashboard.js --name visitor-dashboard
# 시크릿은 각각: npx wrangler secret put DASH_USER  (DASH_PASS / GC_TOKEN 동일)
```

---

## 사용

- 기간 전환: URL `?days=7` / `?days=30` / `?days=90` (헤더의 7·30·90일 링크). 기본 30일.
- 날짜범위는 `?start=YYYY-MM-DD&end=YYYY-MM-DD`로 GoatCounter에 전달(최근 N일 자동 계산).

## 표시 섹션 (전부 한국어)

- 요약 카드: **총 방문수 · 총 페이지뷰**
- **일별 방문 추이** 라인차트 (Chart.js)
- **유입경로 · 국가 · 브라우저 · 기기·OS** — CSS 막대 리스트 "이름 — 수"

## 방어적 동작 (GoatCounter API 문서가 빈약함)

- 각 API 호출은 독립 `try/catch` — 한 섹션이 실패해도 나머지는 정상 렌더.
- 실패한 섹션엔 **"데이터를 불러오지 못함 (엔드포인트 확인 필요)"** 한글 메시지 표시.
- 응답 JSON은 흔한 형태(`{ stats:[...], total, count }`)를 가정하되 **옵셔널 체이닝**으로 안전 파싱.
- 엔드포인트명/필드명이 실제와 다르면 `visitor-dashboard.js` 상단 **`ENDPOINTS` 상수**와
  `normalizeTotal` / `normalizeDaily` / `normalizeList` 함수만 고치면 된다 (코드에 ⚠️ 주석 표시).

## 보안 메모

- 응답에 `noindex`, `Cache-Control: no-store` — 검색 노출·캐시 방지.
- Basic Auth는 개인용이라 타이밍 안전 비교는 생략(요구사항). 토큰은 서버(Worker)에만 존재하며
  브라우저로 절대 전송되지 않는다.
