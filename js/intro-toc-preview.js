/* =======================================================================
   intro-toc-preview.js — 목차 썸네일 호버 시 경량 영상 미리보기
   -----------------------------------------------------------------------
   · 패널마다 공유 <video> 1개를 띄워, 호버한 썸네일 위로 이동시켜 재생.
     (li 마다 video 두면 동시 디코딩 폭발 → 공유 1개로 동시 재생 최대 1개)
   · 동시 1개 / 디바운스(롤오버 방어) / 떠나면 정지·리셋 / 비활성 패널 정지.
   · 데스크톱(hover+fine)만, prefers-reduced-motion·터치는 비활성(정적 썸네일).
   · 미리보기 소스 = 각 항목의 data-preview(intro-toc.js 가 부여). 가운데(현재)
     항목은 배경 영상이 이미 재생 중이라 건너뜀.
======================================================================= */
(() => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const DEBOUNCE = 110;   // 빠른 롤오버 시 불필요한 play() 차단
  const LEAVE = 90;       // 떠난 뒤 약간의 여유

  document.querySelectorAll(".intro-list").forEach((list) => {
    const ul = list.querySelector("ul");
    if (!ul) return;

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
      /* 레이아웃 박스(스케일 전) 기준 배치 → video 가 썸네일과 같은 scale 로 확대돼 어긋남 없음 */
      vid.style.left = (item.offsetLeft + img.offsetLeft) + "px";
      vid.style.top = (item.offsetTop + img.offsetTop) + "px";
      vid.style.width = img.offsetWidth + "px";
      vid.style.height = img.offsetHeight + "px";
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

    ul.addEventListener("mouseover", (e) => {
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

    ul.addEventListener("mouseleave", () => {
      clearTimeout(enterT);
      clearTimeout(leaveT);
      leaveT = setTimeout(stop, LEAVE);
    });

    /* 패널이 비활성(화면 밖)되면 즉시 정지 — 디코딩 잔류 방지 */
    const panel = list.closest(".deck-panel");
    if (panel) new MutationObserver(() => {
      if (!panel.classList.contains("is-active")) stop();
    }).observe(panel, { attributes: true, attributeFilter: ["class"] });
  });
})();
