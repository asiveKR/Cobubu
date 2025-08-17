const MANIFEST_URL = "custom_asset/assets.json";

// 상태
let DATA = null;
let currentCat = "HEAD";
let currentSub = "base";
let nickname = "";

// 유틸
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];
const coin = (p = 0.5) => Math.random() < p;

function listSubparts(cat) {
    if (!DATA || !DATA[cat]) return [];
    return Object.keys(DATA[cat]);
}

function listImages(cat, sub) {
    return (DATA && DATA[cat] && DATA[cat][sub]) ? DATA[cat][sub] : [];
}

function setLayer(cat, sub, src) {
    const id = `L-${String(cat).toUpperCase()}-${String(sub).toUpperCase()}`;
    const host = document.getElementById(id);

    if (!host) {
        console.warn(`Layer not found: ${id}`);
        return;
    }

    host.innerHTML = "";

    if (!src) return;

    const img = new Image();
    img.alt = `${cat}/${sub}`;
    img.decoding = "async";
    img.loading = "eager";
    img.onerror = () => {
        host.innerHTML = `<div class='empty'>이미지를 불러올 수 없음<br><small>${src}</small></div>`;
    };
    img.src = src;
    img.draggable = false;
    img.ondragstart = () => false;
    host.appendChild(img);
}

function setNickname(nick) {
    const nicknameLayer = qs("#L-NICKNAME");
    nicknameLayer.innerHTML = "";
    if (nick) {
        const span = document.createElement("span");
        span.textContent = nick;
        nicknameLayer.appendChild(span);
    }
}

function clearAllLayers() {
    qsa(".layer").forEach(L => {
        if (L.id !== "L-NICKNAME") L.innerHTML = "";
    });
}

function renderThumbs(cat, sub) {
    const grid = document.getElementById("thumbs");
    grid.innerHTML = "";
    const items = listImages(cat, sub);
    if (!items.length) {
        grid.innerHTML = `<div class="empty">이미지 없음 · 추가 예정</div>`;
        return;
    }
    items.forEach((src, i) => {
        const card = document.createElement("button");
        card.className = "thumb";
        card.title = `${cat}/${sub}`;
        card.onclick = () => setLayer(cat, sub, src);
        card.innerHTML = `<img src="${src}" alt="${cat}/${sub} ${i+1}" draggable="false" ondragstart="return false;">`;
        card.tabIndex = -1;
        grid.appendChild(card);
    });
}

function renderSubparts(cat) {
    const wrap = document.getElementById("subparts");
    wrap.innerHTML = "";
    const subs = listSubparts(cat);
    subs.forEach(sp => {
        const b = document.createElement("button");
        b.className = "sub-btn";
        b.textContent = sp.toUpperCase();
        b.setAttribute("data-sub", sp);
        b.setAttribute("aria-selected", sp === currentSub);
        b.onclick = () => {
            currentSub = sp;
            qsa(".sub-btn", wrap).forEach(x => x.setAttribute("aria-selected", String(x === b)));
            renderThumbs(cat, sp);
        };
        wrap.appendChild(b);
    });
    if (!subs.includes(currentSub)) currentSub = subs[0] || "base";
    renderThumbs(cat, currentSub);
}

function bindTabs() {
    qsa(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const cat = btn.dataset.cat;
            currentCat = cat;
            qsa(".tab-btn").forEach(b => b.setAttribute("aria-selected", String(b === btn)));
            renderSubparts(cat);
        });
    });
}

function applyDefaults() {
    setLayer("HEAD", "base", "custom_asset/head/head1.png");
    setLayer("BODY", "base", "custom_asset/body/body1.png");
    setLayer("HEAD", "emotion", "custom_asset/head/emotion/emotion1.png");
    setLayer("ACC", "base", "custom_asset/acc/acc1.png");
    setNickname(nickname);
}

function randomizeAll(options = { includeProb: 0.5 }) {
    const p = options.includeProb ?? 0.5;

    clearAllLayers();

    const hb = listImages("HEAD", "base");
    if (hb.length) setLayer("HEAD", "base", hb[Math.floor(Math.random() * hb.length)]);

    const bb = listImages("BODY", "base");
    if (bb.length) setLayer("BODY", "base", bb[Math.floor(Math.random() * bb.length)]);

    Object.entries(DATA || {}).forEach(([cat, parts]) => {
        Object.keys(parts).forEach(sub => {
            if (sub.toLowerCase() === "base") return;
            const arr = listImages(cat, sub);
            if (!arr.length) return;
            if (coin(p)) {
                const pick = arr[Math.floor(Math.random() * arr.length)];
                setLayer(cat, sub, pick);
            } else {
                setLayer(cat, sub, null);
            }
        });
    });

    setNickname(nickname);
}

function captureStage() {
    const stage = qs("#stage");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const layers = qsa(".layer img, #L-NICKNAME span", stage);
    
    canvas.width = stage.offsetWidth;
    canvas.height = stage.offsetHeight;

    layers.forEach(el => {
        if (el.tagName === "IMG" && el.src) {
            ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
        } else if (el.tagName === "SPAN" && el.textContent) {
            ctx.font = `600 ${2 * canvas.width / 50}px "Bitcount Single", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`;
            ctx.fillStyle = "#2b2a28";
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";
            ctx.fillText(el.textContent, canvas.width - 10, canvas.height - 10);
        }
    });

    return canvas.toDataURL("image/png");
}

function showSavePopup() {
    const popup = qs("#save-popup");
    const preview = qs("#popup-preview");
    const img = new Image();
    img.src = captureStage();
    img.alt = "Custom character preview";
    img.draggable = false;
    img.ondragstart = () => false;
    preview.innerHTML = "";
    preview.appendChild(img);
    popup.style.display = "flex";
}

function showNicknamePopup() {
    const popup = qs("#nickname-popup");
    const input = qs("#nickname-input");
    input.value = "";
    popup.style.display = "flex";
}

function bindNicknamePopup() {
    const popup = qs("#nickname-popup");
    const input = qs("#nickname-input");
    const submitBtn = qs("#btn-submit-nickname");

    submitBtn.addEventListener("click", () => {
        const nick = input.value.trim();
        if (nick) {
            nickname = nick;
            setNickname(nickname);
            popup.style.display = "none";
            document.querySelector(".app").style.display = "grid";
            document.querySelector(".header").style.display = "flex";
        } else {
            alert("Please enter a valid nickname!");
        }
    });

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            submitBtn.click();
        }
    });
}

function bindActions() {
    qs("#btn-reset").addEventListener("click", () => {
        clearAllLayers();
        applyDefaults();
    });

    qs("#btn-random").addEventListener("click", () => {
        randomizeAll({ includeProb: 0.5 });
    });

    qs("#btn-save").addEventListener("click", () => {
        showSavePopup();
    });

    qs("#btn-download").addEventListener("click", () => {
        const dataUrl = captureStage();
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "custom-character.png";
        link.click();
    });

    qs("#btn-share-x").addEventListener("click", () => {
        const dataUrl = captureStage();
        const text = encodeURIComponent(`✨ This is my own COBUBU by ${nickname}! Make yours too! 👉 https://cobubu.xyz/custom #COBUBU`);
        const blob = dataURLtoBlob(dataUrl);
        const localUrl = URL.createObjectURL(blob);
        const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(localUrl)}`;
        window.open(shareUrl, "_blank");
    });

    qs("#btn-share-memex").addEventListener("click", () => {
        alert("MemeX 공유는 나중에 구현 예정입니다!");
    });

    qs("#btn-close-popup").addEventListener("click", () => {
        qs("#save-popup").style.display = "none";
    });
}

function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

async function boot() {
    try {
        const res = await fetch(MANIFEST_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`fetch ${MANIFEST_URL} ${res.status}`);
        const manifest = await res.json();
        DATA = manifest.parts || {};
    } catch (err) {
        console.error(err);
        alert("json file scan failed");
        DATA = { HEAD: { base: [], emotion: [] }, BODY: { base: [] }, ACC: { base: [] } };
    }

    document.querySelector(".app").style.display = "none";
    document.querySelector(".header").style.display = "none";
    showNicknamePopup();
    bindNicknamePopup();
    bindTabs();
    bindActions();
    applyDefaults();
    renderSubparts(currentCat);
    renderThumbs(currentCat, currentSub);
}

boot();