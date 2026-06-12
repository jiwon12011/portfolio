/* =======================================================================
   intro-toc-preview.js — 라이브 목차 썸네일 호버 시 경량 영상 미리보기
   -----------------------------------------------------------------------
   · 라이브 목차(.intro-list--live) 1개에 공유 <video> 1개를 띄워, 호버한 썸네일
     위로 이동시켜 재생. (li 마다 video 두면 동시 디코딩 폭발 → 공유 1개)
   · 동시 1개 / 디바운스(롤오버 방어) / 떠나면 정지·리셋 / 메인 복귀·재중심 시 정지.
   · 데스크톱(hover+fine)만, prefers-reduced-motion·터치는 비활성(정적 썸네일).
   · 미리보기 소스 = 각 항목의 data-preview(intro-toc.js 가 부여). 가운데(현재)
     항목은 배경 영상이 이미 재생 중이라 건너뜀.
   · ⚠ 좌표는 getBoundingClientRect 기반(viewport 기준).
     이유: 트랙이 translateY 로 굴러가므로 offsetTop(offset parent 기준, transform 무시)
     으로 잡으면 시각 위치와 어긋난다. video 는 .intro-list--live(position:fixed) 자식이라
     viewport 좌표 = fixed 컨테이너 로컬 좌표(컨테이너 좌상단 기준 보정).
======================================================================= */
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const DEBOUNCE = 110;   // 빠른 롤오버 시 불필요한 play() 차단
  const LEAVE = 90;       // 떠난 뒤 약간의 여유

  const list = document.querySelector(".intro-list--live");
  if (!list) return;
  const track = list.querySelector(".intro-list__track");
  if (!track) return;

  const vid = document.createElement("video");
  vid.className = "intro-list__preview";
  vid.muted = true; vid.loop = true; vid.playsInline = true; vid.preload = "none";
  vid.setAttribute("aria-hidden", "true");
  list.appendChild(vid);

  let curItem = null, enterT = null, leaveT = null;

  const stop = () => {
    vid.classList.remove("is-on");
    try { vid.pause(); } catch (e) {}
    vid.removeAttribute("src");          // 디코더·버퍼 메모리 즉시 해제
    delete vid.dataset.src;
    try { vid.load(); } catch (e) {}
    curItem = null;
  };

  const show = (item) => {
    const src = item.dataset.preview;
    const img = item.querySelector("img");
    if (!src || !img) { stop(); return; }
    /* getBoundingClientRect: 트랙 translateY·반응형 scale 이 모두 반영된 실제 화면 위치.
       video 는 list(position:fixed) 자식 → list 좌상단 기준 로컬좌표로 보정. */
    const host = list.getBoundingClientRect();
    const r = img.getBoundingClientRect();
    vid.style.left = (r.left - host.left) + "px";
    vid.style.top = (r.top - host.top) + "px";
    vid.style.width = r.width + "px";
    vid.style.height = r.height + "px";
    if (vid.dataset.src !== src) {
      vid.classList.remove("is-on");      // 새 소스 로드 중엔 숨겨 이전 프레임 가림
      vid.src = src; vid.dataset.src = src;
    }
    try { vid.currentTime = 0; } catch (e) {}
    curItem = item;
    const p = vid.play();                 // 첫 프레임 준비된 뒤 페이드인 → 검정 깜빡임 방지
    if (p && p.then) p.then(() => { if (curItem === item) vid.classList.add("is-on"); }).catch(() => {});
    else vid.classList.add("is-on");
  };

  track.addEventListener("mouseover", (e) => {
    const item = e.target.closest(".intro-list__item");
    if (!item || item === curItem) return;
    clearTimeout(enterT);
    clearTimeout(leaveT);
    if (item.dataset.slot === "0" || !item.dataset.preview) {  // 가운데(현재)·영상없음
      leaveT = setTimeout(stop, LEAVE);   // 즉시 끊지 말고 디바운스(스쳐 지나갈 때 깜빡 방지)
      return;
    }
    enterT = setTimeout(() => show(item), DEBOUNCE);
  });

  track.addEventListener("mouseleave", () => {
    clearTimeout(enterT);
    clearTimeout(leaveT);
    leaveT = setTimeout(stop, LEAVE);
  });

  /* 정지 트리거(라이브 목차는 패널 바깥 고정 1개 → 부모 패널 class 감시 불가):
     1) 메인 복귀 — html.off-main 제거 시 목차가 숨겨지므로 정지 */
  new MutationObserver(() => {
    if (!document.documentElement.classList.contains("off-main")) stop();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  /* 2) 프로젝트 전환 — setCurrent 가 트랙 innerHTML 을 재중심(자식 교체)하면 호버 맥락이
     사라지므로 정지(떠나는 항목 hover 가 새 항목으로 이어지지 않게). */
  new MutationObserver(() => stop())
    .observe(track, { childList: true });
})();
