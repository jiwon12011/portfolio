// =============================================================================
// 방문자 대시보드 — Cloudflare Worker (단일 파일)
// -----------------------------------------------------------------------------
// 역할: ①HTTP Basic Auth 게이트 ②GoatCounter API 토큰 숨김 ③한국어 대시보드 렌더
// 정적 GitHub Pages는 서버 인증/토큰 은닉을 못 하므로 이 Worker가 전부 대신한다.
//
// 시크릿은 절대 이 파일에 넣지 말 것 — 전부 Cloudflare Worker 환경변수(env)로:
//   - DASH_USER  : 로그인 아이디
//   - DASH_PASS  : 로그인 비밀번호
//   - GC_TOKEN   : GoatCounter API 토큰 (Settings → API에서 read 권한으로 발급)
//
// 사용자 사이트 코드(jiwonseo)는 공개 정보라 아래 상수로 둔다.
// =============================================================================

const GC_SITE = "jiwonseo"; // GoatCounter 사이트 코드 (공개값 — 시크릿 아님)
const GC_API = `https://${GC_SITE}.goatcounter.com/api/v0`;

// -----------------------------------------------------------------------------
// ⚠️ 엔드포인트/필드명이 실제 GoatCounter API와 다르면 "여기"를 수정하세요.
// GoatCounter API 문서가 빈약해 응답 shape가 버전마다 다를 수 있습니다.
// 각 항목: { path, key } — path는 API 경로, key는 화면에 쓰는 식별자.
// 응답 JSON은 흔한 형태( { stats:[...], total, count } )를 가정하되,
// 아래 normalize* 함수에서 옵셔널 체이닝으로 안전하게 파싱합니다.
// -----------------------------------------------------------------------------
const ENDPOINTS = {
  total:     "/stats/total",      // 총 방문/페이지뷰
  hits:      "/stats/hits",       // 페이지별 + 일별 시계열(그래프용)
  toprefs:   "/stats/toprefs",    // 유입경로(레퍼러)
  browsers:  "/stats/browsers",   // 브라우저
  systems:   "/stats/systems",    // OS/기기
  locations: "/stats/locations",  // 국가
};

export default {
  async fetch(request, env, ctx) {
    // ── 1) 인증: HTTP Basic Auth ──────────────────────────────────────────
    if (!isAuthorized(request, env)) {
      return new Response("인증이 필요합니다.", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="dashboard", charset="UTF-8"',
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }

    // ── 2) 기간 파라미터 (?days=7|30|90, 기본 30) ─────────────────────────
    const url = new URL(request.url);
    const days = normalizeDays(url.searchParams.get("days"));
    const { start, end } = dateRange(days);

    // ── 3) 데이터 수집 (각각 독립 try/catch — 하나 실패해도 나머지 렌더) ──
    const qs = `?start=${start}&end=${end}`;
    const [total, hits, toprefs, browsers, systems, locations] =
      await Promise.all([
        gcFetch(env, ENDPOINTS.total + qs),
        gcFetch(env, ENDPOINTS.hits + qs),
        gcFetch(env, ENDPOINTS.toprefs + qs),
        gcFetch(env, ENDPOINTS.browsers + qs),
        gcFetch(env, ENDPOINTS.systems + qs),
        gcFetch(env, ENDPOINTS.locations + qs),
      ]);

    // ── 4) 렌더 ───────────────────────────────────────────────────────────
    const html = renderDashboard({
      days, start, end, total, hits, toprefs, browsers, systems, locations,
    });

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store", // 개인 대시보드 — 캐시 금지
      },
    });
  },
};

// =============================================================================
// 인증
// =============================================================================
function isAuthorized(request, env) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  let decoded = "";
  try {
    decoded = atob(header.slice(6)); // "user:pass"
  } catch {
    return false;
  }
  const idx = decoded.indexOf(":");
  if (idx < 0) return false;
  const user = decoded.slice(0, idx);
  const pass = decoded.slice(idx + 1);
  // 개인용이라 타이밍 안전 비교까지는 불필요(요구사항). 단순 동등 비교.
  return user === env.DASH_USER && pass === env.DASH_PASS;
}

// =============================================================================
// 날짜 유틸
// =============================================================================
function normalizeDays(raw) {
  const n = parseInt(raw, 10);
  return [7, 30, 90].includes(n) ? n : 30;
}

function dateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { start: ymd(start), end: ymd(end) };
}

function ymd(d) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// =============================================================================
// GoatCounter fetch — { ok, data, error } 형태로 항상 안전 반환
// =============================================================================
async function gcFetch(env, path) {
  try {
    const res = await fetch(GC_API + path, {
      headers: {
        "Authorization": `Bearer ${env.GC_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}`, data: null };
    }
    const data = await res.json();
    return { ok: true, error: null, data };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e), data: null };
  }
}

// =============================================================================
// 응답 정규화 — GoatCounter shape가 흔들려도 안전하게 흡수
// =============================================================================

// 총 방문/페이지뷰. /stats/total은 { total, total_events } 또는 유사 형태.
function normalizeTotal(r) {
  const d = r?.data || {};
  // 흔한 후보 필드들을 차례로 시도 (실제와 다르면 여기 수정)
  const visitors = d.total_visitors ?? d.visitors ?? d.total ?? null;
  const pageviews = d.total ?? d.total_pageviews ?? d.pageviews ?? null;
  return { visitors, pageviews };
}

// 일별 시계열. /stats/hits 응답의 각 페이지엔 stats[] = [{day, daily, ...}] 형태.
// 단일 페이지("/")라 모든 페이지의 일별값을 합산해 그래프 1줄로.
function normalizeDaily(r) {
  const list = asArray(r?.data?.hits ?? r?.data?.stats ?? r?.data);
  const byDay = new Map();
  for (const page of list) {
    const stats = asArray(page?.stats ?? page?.daily ?? page);
    for (const s of stats) {
      const day = s?.day ?? s?.date ?? s?.[0];
      if (day == null) continue;
      const count = num(s?.daily ?? s?.count ?? s?.visitors ?? s?.[1]);
      byDay.set(day, (byDay.get(day) || 0) + count);
    }
  }
  const labels = [...byDay.keys()].sort();
  const values = labels.map((d) => byDay.get(d));
  return { labels, values };
}

// 막대 리스트용: [{name, count}] 정규화 (toprefs/browsers/systems/locations 공용)
function normalizeList(r, nameKeys = ["name", "id", "ref"]) {
  const list = asArray(r?.data?.stats ?? r?.data?.refs ?? r?.data);
  return list
    .map((row) => {
      let name = null;
      for (const k of nameKeys) {
        if (row?.[k] != null && row[k] !== "") { name = row[k]; break; }
      }
      const count = num(row?.count ?? row?.visitors ?? row?.daily ?? 0);
      return { name: name ?? "(미상)", count };
    })
    .filter((x) => x.count > 0 || x.name !== "(미상)")
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function asArray(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// =============================================================================
// HTML 렌더
// =============================================================================
function renderDashboard(ctx) {
  const { days, start, end, total, hits, toprefs, browsers, systems, locations } = ctx;

  const t = normalizeTotal(total);
  const daily = normalizeDaily(hits);

  const visitorsStr = t.visitors != null ? fmt(t.visitors) : "—";
  const pageviewsStr = t.pageviews != null ? fmt(t.pageviews) : "—";

  // 기간 합계가 비면 일별 합으로 폴백 표시
  const dailySum = daily.values.reduce((a, b) => a + b, 0);
  const visitorsFinal = t.visitors != null ? visitorsStr : (dailySum ? fmt(dailySum) : "—");

  const chartData = JSON.stringify({
    labels: daily.labels,
    values: daily.values,
  });

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>방문 대시보드</title>
<style>
  :root{
    --bg:#0d1117; --bg2:#111722;
    --panel:rgba(255,255,255,.045);
    --panel-brd:rgba(255,255,255,.10);
    --ink:#e8edf4; --muted:#8b97a8;
    --accent:#5ea1ff; --accent2:#a07bff;
    --bar:linear-gradient(90deg,#5ea1ff,#a07bff);
    --shadow:0 18px 50px -20px rgba(0,0,0,.7);
    --radius:18px;
  }
  *{box-sizing:border-box}
  html,body{margin:0}
  body{
    font-family:"Pretendard","Pretendard Variable",system-ui,-apple-system,"Segoe UI",
      "Apple SD Gothic Neo","Noto Sans KR",sans-serif;
    color:var(--ink);
    background:
      radial-gradient(1100px 700px at 12% -8%, rgba(94,161,255,.16), transparent 60%),
      radial-gradient(900px 600px at 92% 0%, rgba(160,123,255,.14), transparent 55%),
      var(--bg);
    min-height:100vh;
    -webkit-font-smoothing:antialiased;
    padding:clamp(16px,4vw,40px);
    line-height:1.5;
  }
  .wrap{max-width:1080px;margin:0 auto}

  /* 헤더 */
  .head{
    display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end;
    justify-content:space-between;margin-bottom:26px;
  }
  .head h1{
    font-size:clamp(22px,3.4vw,32px);font-weight:800;letter-spacing:-.02em;margin:0;
    background:linear-gradient(90deg,#fff,#bcd2ff);
    -webkit-background-clip:text;background-clip:text;color:transparent;
  }
  .range-note{color:var(--muted);font-size:13px;margin-top:6px}
  .ranges{display:flex;gap:8px}
  .ranges a{
    text-decoration:none;color:var(--muted);font-size:13px;font-weight:600;
    padding:8px 14px;border-radius:999px;
    border:1px solid var(--panel-brd);background:var(--panel);
    -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
    transition:.18s ease;
  }
  .ranges a:hover{color:var(--ink);border-color:rgba(94,161,255,.5)}
  .ranges a.active{
    color:#fff;border-color:transparent;
    background:linear-gradient(90deg,var(--accent),var(--accent2));
    box-shadow:0 8px 24px -10px rgba(94,161,255,.7);
  }

  /* 글래스 패널 공통 */
  .panel{
    background:var(--panel);
    border:1px solid var(--panel-brd);
    border-radius:var(--radius);
    -webkit-backdrop-filter:blur(16px) saturate(140%);
    backdrop-filter:blur(16px) saturate(140%);
    box-shadow:var(--shadow);
    padding:clamp(16px,2.4vw,24px);
  }

  /* 요약 카드 */
  .cards{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:18px}
  .card .label{color:var(--muted);font-size:13px;font-weight:600;margin-bottom:8px}
  .card .num{font-size:clamp(28px,5vw,44px);font-weight:800;letter-spacing:-.03em;line-height:1}
  .card .sub{color:var(--muted);font-size:12px;margin-top:8px}

  /* 그래프 */
  .chart-panel{margin-bottom:18px}
  .panel h2{font-size:15px;font-weight:700;margin:0 0 16px;letter-spacing:-.01em}
  .chart-box{position:relative;height:clamp(200px,32vw,300px)}

  /* 리스트 그리드 */
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
  .bar-row{margin:0 0 12px}
  .bar-row:last-child{margin-bottom:0}
  .bar-top{display:flex;justify-content:space-between;gap:10px;font-size:13.5px;margin-bottom:6px}
  .bar-top .nm{color:var(--ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .bar-top .ct{color:var(--muted);font-variant-numeric:tabular-nums;font-weight:700;flex:none}
  .bar-track{height:7px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden}
  .bar-fill{height:100%;border-radius:999px;background:var(--bar)}
  .empty{color:var(--muted);font-size:13px;padding:8px 0}
  .err{color:#ff9b9b;font-size:12.5px;padding:6px 0}

  .foot{color:var(--muted);font-size:11.5px;text-align:center;margin-top:26px}

  @media (max-width:680px){
    .cards{grid-template-columns:1fr}
    .grid{grid-template-columns:1fr}
  }
</style>
</head>
<body>
<div class="wrap">

  <div class="head">
    <div>
      <h1>방문 대시보드</h1>
      <div class="range-note">${start} ~ ${end} · 최근 ${days}일</div>
    </div>
    <div class="ranges">
      ${rangeLink(7, days)}
      ${rangeLink(30, days)}
      ${rangeLink(90, days)}
    </div>
  </div>

  <div class="cards">
    <div class="panel card">
      <div class="label">총 방문수</div>
      <div class="num">${visitorsFinal}</div>
      <div class="sub">최근 ${days}일 순방문</div>
    </div>
    <div class="panel card">
      <div class="label">총 페이지뷰</div>
      <div class="num">${pageviewsStr}</div>
      <div class="sub">최근 ${days}일 누적</div>
    </div>
  </div>

  <div class="panel chart-panel">
    <h2>일별 방문 추이</h2>
    ${daily.labels.length
      ? `<div class="chart-box"><canvas id="trend"></canvas></div>`
      : sectionState(hits, "표시할 일별 데이터가 없습니다.")}
  </div>

  <div class="grid">
    ${listPanel("유입경로", toprefs, ["name", "ref", "id"])}
    ${listPanel("국가", locations, ["name", "id", "code"])}
    ${listPanel("브라우저", browsers, ["name", "id"])}
    ${listPanel("기기 · OS", systems, ["name", "id"])}
  </div>

  <div class="foot">GoatCounter · ${GC_SITE} — 개인용 비공개 대시보드</div>
</div>

${daily.labels.length ? `
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  const D = ${chartData};
  const el = document.getElementById('trend');
  if (el && window.Chart) {
    const ctx = el.getContext('2d');
    const g = ctx.createLinearGradient(0,0,0,300);
    g.addColorStop(0,'rgba(94,161,255,.45)');
    g.addColorStop(1,'rgba(94,161,255,0)');
    new Chart(ctx, {
      type:'line',
      data:{
        labels:D.labels,
        datasets:[{
          label:'방문',
          data:D.values,
          borderColor:'#5ea1ff',
          backgroundColor:g,
          borderWidth:2,
          fill:true,
          tension:.35,
          pointRadius:0,
          pointHoverRadius:5,
          pointHoverBackgroundColor:'#a07bff',
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        interaction:{intersect:false,mode:'index'},
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:'rgba(17,23,34,.95)',
            borderColor:'rgba(255,255,255,.12)',borderWidth:1,
            titleColor:'#e8edf4',bodyColor:'#bcd2ff',padding:10,
            callbacks:{label:(c)=> ' 방문 ' + c.parsed.y }
          }
        },
        scales:{
          x:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'#8b97a8',maxRotation:0,autoSkip:true,maxTicksLimit:8}},
          y:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'#8b97a8',precision:0},beginAtZero:true}
        }
      }
    });
  }
</script>` : ""}
</body>
</html>`;
}

// ── 렌더 헬퍼 ────────────────────────────────────────────────────────────────
function rangeLink(n, current) {
  const active = n === current ? " active" : "";
  return `<a class="r${active}" href="?days=${n}">${n}일</a>`;
}

function listPanel(title, result, nameKeys) {
  let body;
  if (!result || result.ok === false) {
    body = `<div class="err">데이터를 불러오지 못함 (엔드포인트 확인 필요)${
      result?.error ? ` · ${escapeHtml(result.error)}` : ""
    }</div>`;
  } else {
    const rows = normalizeList(result, nameKeys);
    if (!rows.length) {
      body = `<div class="empty">데이터 없음</div>`;
    } else {
      const max = Math.max(...rows.map((r) => r.count)) || 1;
      body = rows
        .map((r) => {
          const w = Math.max(3, Math.round((r.count / max) * 100));
          return `<div class="bar-row">
            <div class="bar-top"><span class="nm">${escapeHtml(String(r.name))}</span><span class="ct">${fmt(r.count)}</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div>
          </div>`;
        })
        .join("");
    }
  }
  return `<div class="panel"><h2>${escapeHtml(title)}</h2>${body}</div>`;
}

// 그래프/데이터 섹션이 비었을 때: API 실패면 오류문구, 성공이지만 빈값이면 안내문구
function sectionState(result, emptyMsg) {
  if (!result || result.ok === false) {
    return `<div class="err">데이터를 불러오지 못함 (엔드포인트 확인 필요)${
      result?.error ? ` · ${escapeHtml(result.error)}` : ""
    }</div>`;
  }
  return `<div class="empty">${escapeHtml(emptyMsg)}</div>`;
}

function fmt(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toLocaleString("ko-KR") : "—";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
