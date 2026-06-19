/* =======================================================================
   making-playlist.js — 우리 사이의 음표 제작과정 풀세트 모션
   -----------------------------------------------------------------------
   · 네이티브 스크롤(smooth-process 미포함) → scrub/pin 금지, once 진입만
   · centered 요소(left:50%; translateX(-50%)) 처리 규칙:
       - gsap.set(el, { xPercent: -50 }) 으로 먼저 선점
       - 이후 opacity / y / scale 만 애니메이션
       - clearProps:"transform" 절대 금지 (xPercent 날아가 정렬 깨짐)
   · .pl-tl-ms 컨테이너는 xPercent:-50 선점만 → 자식 요소(dot/d/m/cg)만 애니
   · centered 확인 목록: .pl-fbox / .pl-pill / .pl-fcont / .pl-sys__spine /
     .pl-sys__common / .pl-tl-ms / .pl-close__title / .pl-close__p1, p2
   · left-edge 요소(.pl-info .pl-point .pl-aff .pl-route .pl-endcg .pl-pcard
     .pl-ts .pl-narcard__fig .pl-tl-rail .pl-tl__btn 등)는 transform 자유
   · transform/opacity 위주, prefers-reduced-motion 가드
   · 안전망: 스크롤 바닥 도달 시 미발동 once 트리거 강제 완료
======================================================================= */
(() => {
  const init = () => {
    if (!window.gsap || !window.ScrollTrigger) return false;
    const scroller = document.querySelector('#process-playlist .process__content');
    if (!scroller) return true;

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    /* reduced-motion → 모션 없이 정상 표시 */
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return true;

    /* ── 공통 ScrollTrigger 옵션 헬퍼 ── */
    const ST = (trigger, start = 'top 86%') => ({ trigger, scroller, start, once: true });

    /* ── centered 요소 xPercent:-50 선점 (transform 교란 방지) ──
       이 작업은 init 시 즉시 실행되어 GSAP가 transform을 관리하도록 함 */
    [
      '#pl4 .pl-sys__spine',
      '#pl4 .pl-fbox',
      '#pl4 .pl-pill',
      '#pl4 .pl-fcont',
      '#pl4 .pl-sys__common',
      '#pl7 .pl-close__title',
      '#pl7 .pl-close__p1',
      '#pl7 .pl-close__p2',
    ].forEach(sel => {
      scroller.querySelectorAll(sel).forEach(el => gsap.set(el, { xPercent: -50 }));
    });
    /* pl6 마일스톤 컨테이너 — xPercent 선점만, 자체 애니 없음 */
    scroller.querySelectorAll('#pl6 .pl-tl-ms').forEach(el => gsap.set(el, { xPercent: -50 }));


    /* ================================================================
       PL1 · PROJECT OVERVIEW
    ================================================================ */
    /* 헤더 그룹 */
    gsap.from(scroller.querySelectorAll('#pl1 .pl-badge--1, #pl1 .pl-ov__eyebrow, #pl1 .pl-ov__title'), {
      opacity: 0, y: 28, duration: 0.85, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: ST(scroller.querySelector('#pl1 .pl-ov__eyebrow'), 'top 90%'),
    });
    gsap.from(scroller.querySelector('#pl1 .pl-ov__lead'), {
      opacity: 0, y: 22, duration: 0.82, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl1 .pl-ov__lead'), 'top 88%'),
    });

    /* 정보 카드 4개 stagger (left-edge → transform 자유) */
    gsap.from(scroller.querySelectorAll('#pl1 .pl-info'), {
      opacity: 0, y: 32, scale: 0.93, transformOrigin: '50% 50%',
      duration: 0.72, ease: 'back.out(1.5)', stagger: 0.1,
      scrollTrigger: ST(scroller.querySelector('#pl1 .pl-info--type'), 'top 88%'),
    });
    gsap.from(scroller.querySelectorAll('#pl1 .pl-info__ic'), {
      opacity: 0, scale: 0.3, transformOrigin: '50% 50%',
      duration: 0.45, ease: 'back.out(2.2)', stagger: 0.1, delay: 0.22,
      scrollTrigger: ST(scroller.querySelector('#pl1 .pl-info--type'), 'top 88%'),
    });

    /* NOW PLAYING 카드 (left: 64.444cqw → left-edge, transform 자유) */
    const nowCard = scroller.querySelector('#pl1 .pl-now');
    if (nowCard) {
      gsap.from(nowCard, {
        opacity: 0, scale: 0.92, transformOrigin: '50% 50%',
        duration: 1.0, ease: 'power3.out',
        scrollTrigger: ST(nowCard, 'top 85%'),
      });
      gsap.from(scroller.querySelectorAll('#pl1 .pl-now__dot'), {
        opacity: 0, scale: 0.2, transformOrigin: '50% 50%',
        duration: 0.45, ease: 'back.out(2.5)', stagger: 0.14, delay: 0.35,
        scrollTrigger: ST(nowCard, 'top 85%'),
      });
      gsap.from(scroller.querySelector('#pl1 .pl-now__heart'), {
        opacity: 0, scale: 0.2, transformOrigin: '50% 50%',
        duration: 0.5, ease: 'back.out(2.8)', delay: 0.5,
        scrollTrigger: ST(nowCard, 'top 85%'),
      });
      /* 재생 바 scaleX */
      gsap.from(scroller.querySelector('#pl1 .pl-now__bar i'), {
        scaleX: 0, transformOrigin: '0% 50%',
        duration: 0.9, ease: 'power2.out', delay: 0.6,
        scrollTrigger: ST(nowCard, 'top 85%'),
      });
    }


    /* ================================================================
       PL2 · CONCEPT (pl2 앵커는 #pl1 안 — 별도 트리거 사용)
    ================================================================ */
    /* 음표 random stagger 팝 (opacity: 0→0.45 — GSAP가 CSS opacity 읽음) */
    gsap.from(scroller.querySelectorAll('#pl1 .pl-note'), {
      scale: 0.2, transformOrigin: '50% 50%',
      duration: 0.6, ease: 'back.out(2)', stagger: { each: 0.12, from: 'random' },
      scrollTrigger: ST(scroller.querySelector('#pl1 .pl-cn__eyebrow'), 'top 90%'),
    });

    /* 컨셉 헤더 */
    gsap.from(scroller.querySelectorAll('#pl1 .pl-cn__eyebrow, #pl1 .pl-cn__title'), {
      opacity: 0, y: 26, duration: 0.85, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: ST(scroller.querySelector('#pl1 .pl-cn__eyebrow'), 'top 90%'),
    });
    gsap.from(scroller.querySelector('#pl1 .pl-cn__lead'), {
      opacity: 0, y: 20, duration: 0.82, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl1 .pl-cn__lead'), 'top 88%'),
    });

    /* 재생 버튼 라인 scaleY — left-edge, free */
    const tlLine = scroller.querySelector('#pl1 .pl-tl__line');
    if (tlLine) {
      gsap.from(tlLine, {
        scaleY: 0, transformOrigin: '50% 0%',
        duration: 1.1, ease: 'power2.out',
        scrollTrigger: ST(scroller.querySelector('#pl1 .pl-tl__btn--1'), 'top 90%'),
      });
    }
    /* 버튼 3개 개별 팝 (vertical 간격이 커 각자 트리거) */
    scroller.querySelectorAll('#pl1 .pl-tl__btn').forEach(btn => {
      gsap.from(btn, {
        opacity: 0, scale: 0.3, transformOrigin: '50% 50%',
        duration: 0.55, ease: 'back.out(1.9)',
        scrollTrigger: ST(btn, 'top 90%'),
      });
    });

    /* POINT 카드 3개 — 개별 진입 (top 간격 ~21cqw, 각자 뷰포트 진입 타이밍 다름) */
    scroller.querySelectorAll('#pl1 .pl-point').forEach((pt, i) => {
      gsap.from(pt, {
        opacity: 0, x: i % 2 === 0 ? -36 : 36, y: 16,
        duration: 0.88, ease: 'power3.out',
        scrollTrigger: ST(pt, 'top 86%'),
      });
    });


    /* ================================================================
       PL3 · LANDING DESIGN
    ================================================================ */
    gsap.from(scroller.querySelectorAll('#pl3 .pl-badge--3, #pl3 .pl-land__eyebrow, #pl3 .pl-land__title'), {
      opacity: 0, y: 26, duration: 0.85, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: ST(scroller.querySelector('#pl3 .pl-land__eyebrow'), 'top 88%'),
    });
    gsap.from(scroller.querySelector('#pl3 .pl-land__lead'), {
      opacity: 0, y: 20, duration: 0.82, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl3 .pl-land__lead'), 'top 88%'),
    });

    /* 필름 스트립 clipPath 왼→오른 펼침 (fromTo로 명시) */
    const strip = scroller.querySelector('#pl3 .pl-land__strip');
    if (strip) {
      gsap.fromTo(strip,
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 1.35, ease: 'power3.out',
          scrollTrigger: ST(strip, 'top 82%') });
    }

    /* 어노테이션 4개 — 커넥터 페이드 → 텍스트 순차 */
    scroller.querySelectorAll('#pl3 .pl-anno').forEach(anno => {
      const conn = anno.querySelector('.pl-anno__conn');
      const texts = anno.querySelectorAll('.pl-anno__eyebrow, .pl-anno__title, .pl-anno__body');
      const tl = gsap.timeline({ scrollTrigger: ST(anno, 'top 86%') });
      if (conn) tl.from(conn, { opacity: 0, scaleX: 0, transformOrigin: '0% 50%', duration: 0.45, ease: 'power2.out' }, 0);
      tl.from(texts, { opacity: 0, x: 18, duration: 0.6, ease: 'power2.out', stagger: 0.1 }, conn ? 0.28 : 0);
    });


    /* ================================================================
       PL4 · GAME SYSTEM — 단계별 once 트리거 (폭포 느낌)
       centered 요소: .pl-sys__spine .pl-fbox .pl-pill .pl-fcont .pl-sys__common
       → 이미 xPercent:-50 선점됨 → opacity/y만 애니
    ================================================================ */
    /* 헤더 */
    gsap.from(scroller.querySelectorAll('#pl4 .pl-badge--4, #pl4 .pl-sys__eyebrow, #pl4 .pl-sys__title'), {
      opacity: 0, y: 26, duration: 0.85, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-sys__eyebrow'), 'top 88%'),
    });
    gsap.from(scroller.querySelector('#pl4 .pl-sys__lead'), {
      opacity: 0, y: 20, duration: 0.82, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-sys__lead'), 'top 88%'),
    });

    /* COMMON ROUTE fbox (centered, xPercent 선점 완료 → y만) */
    gsap.from(scroller.querySelector('#pl4 .pl-fbox--common'), {
      opacity: 0, y: 30, duration: 0.8, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-fbox--common'), 'top 86%'),
    });
    /* 공통 루트 video wrapper (centered) */
    gsap.from(scroller.querySelector('#pl4 .pl-sys__common'), {
      opacity: 0, scale: 0.93, transformOrigin: '50% 50%', duration: 0.9, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-sys__common'), 'top 85%'),
    });

    /* 선택지 pill (centered) */
    gsap.from(scroller.querySelector('#pl4 .pl-pill--choice'), {
      opacity: 0, y: 22, duration: 0.7, ease: 'back.out(1.6)',
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-pill--choice'), 'top 88%'),
    });

    /* AFFECTION — fcont 배경 + fbox (centered) */
    gsap.from(scroller.querySelector('#pl4 .pl-fcont--aff'), {
      opacity: 0, y: 24, duration: 0.8, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-fcont--aff'), 'top 86%'),
    });
    gsap.from(scroller.querySelector('#pl4 .pl-fbox--aff'), {
      opacity: 0, y: 20, duration: 0.75, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-fbox--aff'), 'top 86%'),
    });

    /* 캐릭터 6개 (left-edge, transform 자유) — 각자 TL로 캐릭터 등장 + 하트 채우기 */
    scroller.querySelectorAll('#pl4 .pl-aff').forEach((aff, i) => {
      const hearts = aff.querySelectorAll('.pl-aff__hearts i.on');
      const tl = gsap.timeline({ scrollTrigger: ST(aff, 'top 84%') });
      tl.from(aff, {
        opacity: 0, y: 34, scale: 0.88, transformOrigin: '50% 100%',
        duration: 0.68, ease: 'back.out(1.5)',
      }, 0);
      /* 하트 왼쪽부터 채우기 */
      if (hearts.length) {
        tl.from(hearts, {
          opacity: 0, scale: 0.15, transformOrigin: '50% 50%',
          duration: 0.28, ease: 'back.out(3)', stagger: 0.07,
        }, 0.38);
      }
    });

    /* 가장 높은 호감도 pill (centered) */
    gsap.from(scroller.querySelector('#pl4 .pl-pill--top'), {
      opacity: 0, y: 22, duration: 0.7, ease: 'back.out(1.6)',
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-pill--top'), 'top 88%'),
    });

    /* CHARACTER ROUTE fbox (centered) + 루트 이미지 6개 (left-edge) */
    gsap.from(scroller.querySelector('#pl4 .pl-fbox--route'), {
      opacity: 0, y: 24, duration: 0.8, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-fbox--route'), 'top 86%'),
    });
    const firstRoute = scroller.querySelector('#pl4 .pl-route');
    if (firstRoute) {
      gsap.from(scroller.querySelectorAll('#pl4 .pl-route'), {
        opacity: 0, y: 34, scale: 0.86, transformOrigin: '50% 0%',
        duration: 0.72, ease: 'back.out(1.5)', stagger: 0.09,
        scrollTrigger: { trigger: firstRoute, scroller, start: 'top 85%', once: true },
      });
    }

    /* 분기 pill (centered) */
    gsap.from(scroller.querySelector('#pl4 .pl-pill--branch'), {
      opacity: 0, y: 22, duration: 0.7, ease: 'back.out(1.6)',
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-pill--branch'), 'top 88%'),
    });

    /* ENDING — fcont + fbox (centered) + endcg (left-edge) */
    gsap.from(scroller.querySelector('#pl4 .pl-fcont--end'), {
      opacity: 0, y: 24, duration: 0.8, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-fcont--end'), 'top 86%'),
    });
    gsap.from(scroller.querySelector('#pl4 .pl-fbox--end'), {
      opacity: 0, y: 20, duration: 0.75, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-fbox--end'), 'top 86%'),
    });
    gsap.from(scroller.querySelectorAll('#pl4 .pl-endcg'), {
      opacity: 0, y: 28, scale: 0.9, transformOrigin: '50% 50%',
      duration: 0.8, ease: 'back.out(1.4)', stagger: 0.14,
      scrollTrigger: ST(scroller.querySelector('#pl4 .pl-endcg--1'), 'top 86%'),
    });


    /* ================================================================
       PL5 · IMPLEMENTATION STRUCTURE
    ================================================================ */
    gsap.from(scroller.querySelectorAll('#pl5 .pl-badge--5, #pl5 .pl-impl__eyebrow, #pl5 .pl-impl__title'), {
      opacity: 0, y: 26, duration: 0.85, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: ST(scroller.querySelector('#pl5 .pl-impl__eyebrow'), 'top 88%'),
    });
    gsap.from(scroller.querySelector('#pl5 .pl-impl__lead'), {
      opacity: 0, y: 20, duration: 0.82, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl5 .pl-impl__lead'), 'top 88%'),
    });

    /* pcard 4개 — 카드 슬라이드인 + chip 팝 (수직 배치라 개별 트리거) */
    scroller.querySelectorAll('#pl5 .pl-pcard').forEach(card => {
      const chip = card.querySelector('.pl-pcard__chip');
      const tl = gsap.timeline({ scrollTrigger: ST(card, 'top 86%') });
      tl.from(card, { opacity: 0, x: -38, duration: 0.85, ease: 'power3.out' }, 0);
      if (chip) {
        tl.from(chip, {
          opacity: 0, scale: 0.35, transformOrigin: '50% 50%',
          duration: 0.5, ease: 'back.out(2)',
        }, 0.22);
      }
    });

    /* 우측 패널 그룹 fade+up stagger */
    const implPanel = scroller.querySelector('#pl5 .pl-impl__panel');
    if (implPanel) {
      gsap.from(scroller.querySelectorAll('#pl5 .pl-impl__grp'), {
        opacity: 0, y: 36, duration: 0.88, ease: 'power3.out', stagger: 0.16,
        scrollTrigger: { trigger: implPanel, scroller, start: 'top 84%', once: true },
      });
    }


    /* ================================================================
       PL6 · NARRATIVE DESIGN
    ================================================================ */
    gsap.from(scroller.querySelectorAll('#pl6 .pl-badge--6, #pl6 .pl-nar__eyebrow, #pl6 .pl-nar__title'), {
      opacity: 0, y: 26, duration: 0.85, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: ST(scroller.querySelector('#pl6 .pl-nar__eyebrow'), 'top 88%'),
    });
    gsap.from(scroller.querySelector('#pl6 .pl-nar__lead'), {
      opacity: 0, y: 20, duration: 0.82, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl6 .pl-nar__lead'), 'top 88%'),
    });

    /* ── 타임라인 레일 + 마일스톤 5개 — 하나의 공유 TL로 순차 연출 ──
       레일(left-edge, free): scaleX 그리기
       마일스톤(.pl-tl-ms): xPercent:-50 선점 완료, 자식만 애니 */
    const rail = scroller.querySelector('#pl6 .pl-tl-rail');
    const milestones = Array.from(scroller.querySelectorAll('#pl6 .pl-tl-ms'));
    if (rail) {
      const msTl = gsap.timeline({
        scrollTrigger: { trigger: rail, scroller, start: 'top 82%', once: true },
      });

      /* 레일 scaleX 그리기 */
      msTl.from(rail, {
        scaleX: 0, transformOrigin: '0% 50%',
        duration: 1.0, ease: 'power3.out',
      }, 0);

      /* 마일스톤 5개 cascade: dot → 날짜 → 타이핑 → CG */
      milestones.forEach((ms, i) => {
        const dot = ms.querySelector('.pl-tl-ms__dot');
        const d   = ms.querySelector('.pl-tl-ms__d');
        const m   = ms.querySelector('.pl-tl-ms__m');
        const cg  = ms.querySelector('.pl-tl-ms__cg');
        const t   = 0.2 + i * 0.2; /* 마일스톤 간 stagger */

        if (dot) msTl.from(dot, {
          opacity: 0, scale: 0.15, transformOrigin: '50% 50%',
          duration: 0.38, ease: 'back.out(2.8)',
        }, t);
        if (d) msTl.from(d, {
          opacity: 0, y: -12, duration: 0.38, ease: 'power3.out',
        }, t + 0.08);

        /* 타이핑 효과 — 수동 char-split (aria 보존) */
        if (m) {
          const orig = m.textContent;
          /* 이미 분리된 경우 중복 방지 */
          if (!m.dataset.charSplit) {
            m.dataset.charSplit = '1';
            if (!m.getAttribute('aria-label')) m.setAttribute('aria-label', orig);
            const chars = [...orig].map(ch => {
              const s = document.createElement('span');
              s.textContent = ch;
              s.style.display = 'inline-block';
              s.setAttribute('aria-hidden', 'true');
              return s;
            });
            m.textContent = '';
            chars.forEach(s => m.appendChild(s));
            const typeDuration = Math.max(0.28, chars.length * 0.032);
            msTl.from(chars, {
              opacity: 0, y: 7, duration: 0.22, ease: 'power2.out', stagger: 0.032,
            }, t + 0.18);
            if (cg) msTl.from(cg, {
              opacity: 0, y: 18, scale: 0.88, transformOrigin: '50% 50%',
              duration: 0.62, ease: 'power3.out',
            }, t + 0.18 + typeDuration + 0.08);
          }
        } else if (cg) {
          msTl.from(cg, {
            opacity: 0, y: 18, scale: 0.88, transformOrigin: '50% 50%',
            duration: 0.62, ease: 'power3.out',
          }, t + 0.38);
        }
      });
    }

    /* 캐릭터 카드 .pl-narcard__fig 등장 (기존 유지 — clearProps 없음) */
    scroller.querySelectorAll('#pl6 .pl-narcard__fig').forEach(fig => {
      gsap.from(fig, {
        opacity: 0, y: 46, scale: 0.9, transformOrigin: '50% 100%',
        duration: 0.78, ease: 'back.out(1.6)',
        scrollTrigger: {
          trigger: fig.closest('.pl-narcard') || fig,
          scroller, start: 'top 88%', once: true,
        },
      });
    });


    /* ================================================================
       PL7 · TROUBLESHOOTING + 클로징
    ================================================================ */
    gsap.from(scroller.querySelectorAll('#pl7 .pl-badge--7, #pl7 .pl-ts__eyebrow, #pl7 .pl-ts__title'), {
      opacity: 0, y: 26, duration: 0.85, ease: 'power3.out', stagger: 0.1,
      scrollTrigger: ST(scroller.querySelector('#pl7 .pl-ts__eyebrow'), 'top 88%'),
    });
    gsap.from(scroller.querySelector('#pl7 .pl-ts__lead'), {
      opacity: 0, y: 20, duration: 0.82, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl7 .pl-ts__lead'), 'top 88%'),
    });

    /* 이슈 카드 3개 — 3개가 같은 top에 수평 배치 → 공유 트리거로 stagger
       카드 자체는 좌/중/우 방향에서 슬라이드인, 내부 chip+row 순차 */
    const tsFirst = scroller.querySelector('#pl7 .pl-ts--1');
    if (tsFirst) {
      const xDirs = [-40, 0, 40];
      const yDirs = [16, 38, 16];
      scroller.querySelectorAll('#pl7 .pl-ts').forEach((card, i) => {
        const chip = card.querySelector('.pl-ts__chip');
        const rows = card.querySelectorAll('.pl-ts__tag, .pl-ts__row');
        const tl = gsap.timeline({
          scrollTrigger: { trigger: tsFirst, scroller, start: 'top 84%', once: true },
        });
        const t = i * 0.13;
        tl.from(card, {
          opacity: 0, x: xDirs[i], y: yDirs[i],
          duration: 0.85, ease: 'power3.out',
        }, t);
        if (chip) tl.from(chip, {
          opacity: 0, scale: 0.4, transformOrigin: '50% 50%',
          duration: 0.48, ease: 'back.out(2)',
        }, t + 0.22);
        if (rows.length) tl.from(rows, {
          opacity: 0, y: 10, duration: 0.48, ease: 'power2.out', stagger: 0.07,
        }, t + 0.34);
      });
    }

    /* 클로징 타이틀 — 글자 비행 (xPercent:-50 선점 완료 → 컨테이너 위치 유지)
       수동 char-split: TreeWalker로 텍스트 노드만 → 각 글자를 span으로 교체
       aria-label을 컨테이너에 설정해 접근성 유지 */
    const closeTitle = scroller.querySelector('#pl7 .pl-close__title');
    if (closeTitle && !closeTitle.dataset.charSplit) {
      closeTitle.dataset.charSplit = '1';
      if (!closeTitle.getAttribute('aria-label')) {
        closeTitle.setAttribute('aria-label', closeTitle.textContent.replace(/\s+/g, ' ').trim());
      }

      const tw = document.createTreeWalker(closeTitle, NodeFilter.SHOW_TEXT, null);
      const textNodes = [];
      let tn;
      while ((tn = tw.nextNode())) {
        if (tn.textContent.trim()) textNodes.push(tn);
      }

      const allChars = [];
      textNodes.forEach(textNode => {
        const frag = document.createDocumentFragment();
        [...textNode.textContent].forEach(ch => {
          const s = document.createElement('span');
          s.textContent = ch;
          s.style.display = 'inline-block';
          s.setAttribute('aria-hidden', 'true');
          frag.appendChild(s);
          allChars.push(s);
        });
        textNode.replaceWith(frag);
      });

      if (allChars.length) {
        gsap.from(allChars, {
          opacity: 0, y: 38, rotation: 7,
          duration: 0.62, ease: 'power3.out',
          stagger: { each: 0.022, from: 'start' },
          scrollTrigger: ST(closeTitle, 'top 86%'),
        });
      }
    }

    /* 클로징 본문 (centered, xPercent:-50 선점 완료 → y만) */
    gsap.from(scroller.querySelector('#pl7 .pl-close__p1'), {
      opacity: 0, y: 24, duration: 0.8, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl7 .pl-close__p1'), 'top 86%'),
    });
    gsap.from(scroller.querySelector('#pl7 .pl-close__p2'), {
      opacity: 0, y: 24, duration: 0.8, ease: 'power3.out', delay: 0.1,
      scrollTrigger: ST(scroller.querySelector('#pl7 .pl-close__p2'), 'top 86%'),
    });

    /* 최종 히어로 이미지 zoom-settle (left: 0 → transform 자유) */
    gsap.from(scroller.querySelector('#pl7 .pl-ts__hero'), {
      opacity: 0, scale: 1.06, transformOrigin: '50% 50%',
      duration: 1.4, ease: 'power3.out',
      scrollTrigger: ST(scroller.querySelector('#pl7 .pl-ts__hero'), 'top 85%'),
    });


    /* ── 안전망: 스크롤러 바닥 도달 시 미발동 once 트리거 강제 완료 ──
       네이티브 스크롤 + 짧은 뷰포트에서 요소가 숨은 채 고착되는 것 방지 */
    let safetyFired = false;
    const safety = () => {
      if (safetyFired) return;
      if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4) {
        safetyFired = true;
        ScrollTrigger.getAll().forEach(st => {
          if (st.scroller === scroller && st.vars && st.vars.once && st.animation) {
            try { st.animation.progress(1, false); } catch (e) {}
          }
        });
        scroller.removeEventListener('scroll', safety);
      }
    };
    scroller.addEventListener('scroll', safety, { passive: true });

    /* ── 이미지 로드 후 트리거 위치 재계산 (debounce로 묶어 jank 방지) ── */
    let refreshTimer;
    const deferRefresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => { try { ScrollTrigger.refresh(); } catch (e) {} }, 150);
    };
    scroller.querySelectorAll('img').forEach(img => {
      if (!img.complete) img.addEventListener('load', deferRefresh, { once: true });
    });

    /* ── 영상은 보일 때만 재생 (화면 밖 동시 디코딩 부담 ↓) ── */
    const vids = [...scroller.querySelectorAll('video')];
    if (vids.length && 'IntersectionObserver' in window) {
      const vio = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          const v = e.target;
          if (e.isIntersecting) { v.muted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
          else { try { v.pause(); } catch (err) {} }
        });
      }, { root: scroller, rootMargin: '200px 0px', threshold: 0.01 });
      vids.forEach((v) => vio.observe(v));
    }

    return true;
  };

  /* defer 순서상 보통 준비되지만 CDN 지연 시 폴링 */
  if (!init()) {
    let n = 0;
    const t = setInterval(() => { if (init() || ++n > 30) clearInterval(t); }, 80);
  }
})();
