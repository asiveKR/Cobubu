const BUTTON_CAP_IMAGE = "img/C_cap.png";
const BASE_DIR = "library_asset";
const LANGS = ["en", "ko", "zh"];
const LANG_LABELS = {
  en: "EN",
  ko: "한글",
  zh: "中文"
};
let currentLang = "en";
let currentNovelId = null;
let currentStoryId = null;

let currentPage = 0; // 현재 페이지 인덱스 (0-based, 페이지당 2개 챕터)
let isTurning = false; // 페이지 넘김 중 복수 입력 방지


const textCache = new Map();


// 하위 챕터 추가 내역은 여기서 수정
const NOVELS = [
  {
    id: "novel1",
    cover: "img/novels/novel1.png",
    status: "ready",
    titles: { en: "Novel 1 — C & Z Capsule", ko: "소설 1 — C & Z 캡슐", zh: "小说 1 — C & Z 膠囊" },
    chapters: [{ id: "000", label: "-0-" }, { id: "001", label: "-1-" }, { id: "002", label: "-2-" }, { id: "003", label: "-3-" }
      , { id: "004", label: "-4-" }, { id: "005", label: "-5-" }, { id: "006", label: "-6-" }, { id: "007", label: "7" } /*, { id: "008", label: "8" } */

    ],
    coverColor: "linear-gradient(135deg, #a87342, #6c4422)" // novel1: 브라운 톤
  },
  {
    id: "novel2",
    cover: "img/novels/novel2.png",
    status: "preparing",
    titles: { en: "Novel 2 — (TBD)", ko: "소설 2 — (준비중)", zh: "小说 2 — (准备中)" },
    chapters: [],
    coverColor: "linear-gradient(135deg, #4a6b9e, #2a3b6e)" // novel2: 블루 톤 (색상 차이로 책 구분)
  }
];

const novelGrid = document.getElementById("novel-grid");
const chapterGrid = document.getElementById("chapter-grid");
const backBtn = document.getElementById("back-btn");
const novelTitleEl = document.getElementById("novel-title");
const langSwitch = document.getElementById("lang-switch");

const popup = document.getElementById("popup");
const popupImgEl = document.getElementById("popup-img");
const popupTitle = document.getElementById("popup-title");
const popupDesc = document.getElementById("popup-desc");
const popupClose = document.getElementById("popup-close");


function formatStoryText(t) {
  if (!t) return "";
  t = t.replace(/([.?!])(?=\s|$)/g, "$1<br>");
  t = t.replace(/\.(")/g, '.<br>$1');
  t = t.replace(/\n{2,}/g, "<br><br>").replace(/\n/g, "<br>");
  return t;
}
function chapterMainImage(novelId, chapterId) {
  return `${BASE_DIR}/${novelId}/${chapterId}/main.png`;
}

// 텍스트 파싱 함수
function parseLanguageSection(fullText, lang) {
  let langCode = lang;
  if (lang === "zh") langCode = "ch"; // 예시 'ch'에 맞춰 zh → ch 매핑
  const regex = /([a-z]{2})\s*\*\s*(.*?)\s*\*/gs;
  let match;
  while ((match = regex.exec(fullText)) !== null) {
    if (match[1] === langCode) {
      return match[2].trim();
    }
  }
  return "";
}

// 텍스트 파일 찾는 위치   
function chapterTextUrl(novelId, chapterId, type) {
  return `${BASE_DIR}/${novelId}/${chapterId}/${type}.txt`;
}

async function fetchChapterText(novelId, chapterId, type, lang) {
  const key = `${novelId}:${chapterId}:${type}`; // lang 없이 캐시 키
  let fullText;
  if (textCache.has(key)) {
    fullText = textCache.get(key);
  } else {
    try {
      const res = await fetch(chapterTextUrl(novelId, chapterId, type), { cache: "no-store" });
      if (!res.ok) throw 0;
      fullText = (await res.text()).replace(/^\uFEFF/, "");
      textCache.set(key, fullText);
    } catch (_) {
      return "";
    }
  }
  for (const L of [lang, "en"]) {
    const parsed = parseLanguageSection(fullText, L);
    if (parsed) return parsed;
  }
  return "";
}




// 페이지 넘김 애니메이션 함수 추가
function animatePageTurn(direction, novel) {
  if (isTurning) return;
  const spread = chapterGrid.querySelector('.book-spread');
  if (!spread) { turnPage(direction, novel); return; }

  isTurning = true;
  spread.classList.add('turning');

  // 오버레이 생성
  const flip = document.createElement('div');
  flip.className = 'page-flip ' + (direction > 0 ? 'from-right' : 'from-left');
  const paper = document.createElement('div');
  paper.className = 'paper';
  flip.appendChild(paper);
  spread.appendChild(flip);

  // 버튼 잠금
  const prevBtn = chapterGrid.querySelector('.page-turn.prev');
  const nextBtn = chapterGrid.querySelector('.page-turn.next');
  if (prevBtn) prevBtn.disabled = true;
  if (nextBtn) nextBtn.disabled = true;

  // 강제 리플로우로 초기 프레임 고정
  // eslint-disable-next-line no-unused-expressions
  flip.offsetWidth;

  // 방향별 애니메이션 클래스
  if (direction > 0) {
    flip.classList.add('animate-right');
  } else {
    flip.classList.add('animate-left');
  }

  // 애니메이션 종료 후 실제 페이지 전환
  const handleEnd = () => {
    flip.removeEventListener('animationend', handleEnd);
    try { flip.remove(); } catch (e) { }
    // 실제 인덱스 이동 + 재렌더
    turnPage(direction, novel);
    spread.classList.remove('turning');
    isTurning = false;
  };
  flip.addEventListener('animationend', handleEnd);
}

function getNovelTitle(novel) { return novel.titles?.[currentLang] || novel.titles?.en || "(No Title)"; }

/* ---------- 언어 토글 ---------- */
function ensureLangSwitch() {
  if (!langSwitch.childElementCount) {
    LANGS.forEach(L => {
      const b = document.createElement("button");
      b.className = "lang-btn";
      b.dataset.lang = L;
      b.textContent = LANG_LABELS[L] || L.toUpperCase();
      b.onclick = async () => {
        if (currentLang === L) return;
        currentLang = L;
        updateLangButtons();

        if (currentNovelId) {
          // 소설 뷰: 제목만 갱신
          const nv = NOVELS.find(n => n.id === currentNovelId);
          if (nv) novelTitleEl.textContent = getNovelTitle(nv);
        } else {
          // 첫 화면: 캡션을 새 언어로 다시 렌더
          renderNovels();
        }

        // 팝업이 열려 있으면 본문도 갱신
        if (popup.style.display === "flex" && currentStoryId) {
          const titleTxt = await fetchChapterText(currentNovelId, currentStoryId, "title", currentLang);
          const bodyTxt = await fetchChapterText(currentNovelId, currentStoryId, "story", currentLang);
          popupTitle.textContent = titleTxt || "(No title)";
          popupDesc.innerHTML = bodyTxt ? formatStoryText(bodyTxt) : "No script found.";
        }
      };
      langSwitch.appendChild(b);
    });
  }
  updateLangButtons();
}
function updateLangButtons() {
  [...langSwitch.children].forEach(b => b.classList.toggle("active", b.dataset.lang === currentLang));
}

/* ---------- 렌더링 ---------- */
function renderNovels() {
  // 상단 상태
  backBtn.hidden = true;
  novelTitleEl.hidden = true;
  novelTitleEl.textContent = "";

  // 언어 토글은 첫 화면에서도 보이게 유지
  langSwitch.hidden = false;

  chapterGrid.hidden = true;
  chapterGrid.style.display = "none";
  novelGrid.hidden = false;
  novelGrid.style.display = "";
  novelGrid.innerHTML = "";

  NOVELS.forEach(n => {
    // 캡션 + 버튼 묶음
    const wrap = document.createElement("div");
    wrap.className = "novel-card";

    const cap = document.createElement("div");
    cap.className = "novel-caption";
    cap.textContent = getNovelCaption(n); // "Novel 1 - (title)"
    wrap.appendChild(cap);

    const btn = document.createElement("button");
    btn.className = "novel-item";
    const cover = document.createElement("button");
    cover.className = "book-cover";
    cover.setAttribute("aria-label", "Open cover");
    cover.style.background = n.coverColor || "linear-gradient(135deg, #a87342, #6c4422)"; // NOVELS의 coverColor 사용, 기본값 설정
    const img = document.createElement("img");
    img.className = "novel-art";
    img.src = n.cover;
    img.alt = getNovelTitle(n);
    btn.appendChild(img);
    btn.appendChild(cover);
    btn.onclick = (e) => {
      // 다른 책 닫기
      document.querySelectorAll('.novel-item').forEach(b => {
        if (b !== btn) b.classList.remove('open');
      });
      // 애니메이션 토글
      btn.classList.toggle('open');
      // 애니메이션 후 handleNovelClick 호출
      setTimeout(() => {
        if (btn.classList.contains('open')) {
          handleNovelClick(n);
        }
      }, 1200); // 지연 시간 1.2초로 증가 (더 여유롭게 전환)
    };

    wrap.appendChild(btn);
    novelGrid.appendChild(wrap);
  });
}

function turnPage(direction, novel) {
  const totalChapters = novel.chapters.length;
  const totalPages = totalChapters + 2;
  const maxSpread = Math.ceil(totalChapters / 2);

  const newSpread = currentPage + direction;
  if (newSpread < -1 || newSpread > maxSpread - (totalPages % 2 === 1 ? 1 : 0)) return;

  currentPage = newSpread;
  const newPage = newSpread === -1 ? 1 : newSpread * 2 + 2;
  $("#flipbook").turn("page", newPage);
}


function addPageControls(novel) {
  const totalChapters = novel.chapters.length;
  const totalPages = totalChapters + 2;
  const maxSpread = Math.ceil(totalChapters / 2);

  const existingPrev = document.querySelector(".page-turn.prev");
  const existingNext = document.querySelector(".page-turn.next");
  if (existingPrev) existingPrev.remove();
  if (existingNext) existingNext.remove();

  const prevBtn = document.createElement("button");
  prevBtn.className = "page-turn prev";
  prevBtn.textContent = "◀";
  prevBtn.disabled = currentPage === -1; // 첫 페이지에서 비활성화
  prevBtn.onclick = () => turnPage(-1, novel);
  chapter攻略

System: chapterGrid.appendChild(prevBtn);

  const nextBtn = document.createElement("button");
  nextBtn.className = "page-turn next";
  nextBtn.textContent = "▶";
  nextBtn.disabled = currentPage >= maxSpread - (totalPages % 2 === 1 ? 1 : 0);
  nextBtn.onclick = () => turnPage(1, novel);
  chapterGrid.appendChild(nextBtn);
}

function handleNovelClick(novel) {
  if (novel.status === "preparing") { return; }
  currentNovelId = novel.id;
  currentPage = 0; // 페이지 초기화

  // 상단: Back + 소제목 + 언어토글
  backBtn.hidden = false;
  novelTitleEl.hidden = false;
  novelTitleEl.textContent = getNovelTitle(novel);
  ensureLangSwitch();
  langSwitch.hidden = false;

  // 그리드 전환
  novelGrid.hidden = true;
  novelGrid.style.display = "none";
  chapterGrid.hidden = false;
  chapterGrid.style.display = "";
  renderBookPages(novel); // 변경
}



function getNovelNumber(novel) { // novel1 → 1
  const m = /novel(\d+)/i.exec(novel.id);
  return m ? m[1] : "";
}
function getNovelCaption(novel) {
  const num = getNovelNumber(novel);
  const t = getNovelTitle(novel);
  // 아니면 "Novel {n} - {title}" 포맷으로 표시
  return /novel|소설|小说/i.test(t) ? t : 'Novel ${num} - ${t}';
}




// d
function renderBookPages(novel) {
  chapterGrid.hidden = false;
  chapterGrid.innerHTML = "";
  chapterGrid.className = "book-layout";

  const flipbook = document.createElement("div");
  flipbook.id = "flipbook";

  const emptyFirstPage = document.createElement("div");
  emptyFirstPage.className = "page empty-page book-cover";
  emptyFirstPage.dataset.page = 1;
  flipbook.appendChild(emptyFirstPage);

  novel.chapters.forEach((chapter, index) => {
    const page = document.createElement("div");
    page.className = `page ${index % 2 === 0 ? 'even' : 'odd'}`;
    page.dataset.page = index + 2;
    const chapterItem = createChapterItem(novel.id, chapter);
    page.appendChild(chapterItem);
    flipbook.appendChild(page);
  });

  const emptyLastPage = document.createElement("div");
  emptyLastPage.className = "page empty-page back-cover";
  emptyLastPage.dataset.page = novel.chapters.length + 2;
  flipbook.appendChild(emptyLastPage);

  chapterGrid.appendChild(flipbook);

  addPageControls(novel);

  setTimeout(() => {
    if ($("#flipbook").data("initialized")) {
      $("#flipbook").turn("destroy");
    }

    $("#flipbook").turn({
      width: 1000,
      height: 800,
      pages: novel.chapters.length + 2,
      display: "double",
      gradients: false,
      acceleration: true,
      autoCenter: true,
      when: {
        turning: function(e, page) {
          const totalPages = novel.chapters.length + 2;
          if (page < 1 || page > totalPages || (totalPages % 2 === 1 && page >= totalPages)) {
            e.preventDefault();
            return;
          }
          currentPage = page === 1 ? -1 : Math.floor((page - 2) / 2); // 첫 페이지: -1
          const isFirstPage = page === 1;
          $(this).toggleClass("spread", !isFirstPage);

          const prevBtn = document.querySelector(".page-turn.prev");
          const nextBtn = document.querySelector(".page-turn.next");
          if (prevBtn) prevBtn.disabled = page === 1;
          if (nextBtn) nextBtn.disabled = page >= totalPages - (totalPages % 2 === 1 ? 1 : 2);
        }
      }
    }).data("initialized", true);

    $("#flipbook").turn("page", currentPage === -1 ? 1 : (currentPage * 2 + 2));
  }, 100);
}


function addPageControls(novel) {
  const totalChapters = novel.chapters.length;
  const totalPages = totalChapters + 2;
  const maxSpread = Math.ceil(totalChapters / 2);

  const existingPrev = document.querySelector(".page-turn.prev");
  const existingNext = document.querySelector(".page-turn.next");
  if (existingPrev) existingPrev.remove();
  if (existingNext) existingNext.remove();

  const prevBtn = document.createElement("button");
  prevBtn.className = "page-turn prev";
  prevBtn.textContent = "◀";
  prevBtn.disabled = currentPage === 0;
  prevBtn.onclick = () => turnPage(-1, novel);
  chapterGrid.appendChild(prevBtn);

  const nextBtn = document.createElement("button");
  nextBtn.className = "page-turn next";
  nextBtn.textContent = "▶";
  nextBtn.disabled = currentPage >= maxSpread - (totalPages % 2 === 1 ? 1 : 0);
  nextBtn.onclick = () => turnPage(1, novel);
  chapterGrid.appendChild(nextBtn);
}


// 챕터 아이템 생성 헬퍼 함수 (기존 로직 재사용)
function createChapterItem(novelId, chapter) {
  const btn = document.createElement("button");
  btn.className = "cap-item";
  const img = document.createElement("img");
  img.src = chapterMainImage(novelId, chapter.id);
  img.alt = chapter.label;
  const lab = document.createElement("div");
  lab.className = "cap-title";
  lab.textContent = chapter.label;
  btn.appendChild(img);
  btn.appendChild(lab);
  btn.onclick = () => {
    popupDesc.innerHTML = "Loading...";
    openChapter(novelId, chapter.id);
  };
  return btn;
}

/* ---------- 준비중 팝업 ---------- */
function showPreparing(novel) {
  popupImgEl.src = "img/preparing.png";
  popupTitle.textContent = getNovelTitle(novel);
  popupDesc.innerHTML = "Preparing…";
  openPopup();
}

/* ---------- 팝업 ---------- */
async function openChapter(novelId, chapterId) {
  currentStoryId = chapterId;
  popupImgEl.src = chapterMainImage(novelId, chapterId);
  popupDesc.innerHTML = "Loading...";
  openPopup(); // 팝업을 즉시 열어 로딩 상태 표시
  const [titleTxt, bodyTxt] = await Promise.all([
    fetchChapterText(novelId, chapterId, "title", currentLang),
    fetchChapterText(novelId, chapterId, "story", currentLang)
  ]);
  popupTitle.textContent = titleTxt || "(No title)";
  popupDesc.innerHTML = bodyTxt ? formatStoryText(bodyTxt) : "No script found.";
}
function openPopup() {
  popup.style.display = "flex";
  popup.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  popupClose.focus();
}
function closePopup() {
  popup.style.display = "none";
  popup.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
popup.addEventListener("click", e => { if (e.target === popup) closePopup(); });
popupClose.addEventListener("click", closePopup);
document.addEventListener("keydown", e => { if (e.key === "Escape" && popup.style.display === "flex") closePopup(); });

/* ---------- Back ---------- */
backBtn.addEventListener("click", () => {
  currentNovelId = null; currentStoryId = null;
  renderNovels(); // renderNovels가 위에서 display/hidden을 함께 복구
});


/* ---------- 시작 ---------- */
renderNovels();
ensureLangSwitch();        // ← 초기에도 토글 버튼 생성
langSwitch.hidden = false; // ← 첫 화면부터 노출