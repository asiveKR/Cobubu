const gallery = document.getElementById("gallery");
  const popup = document.getElementById("popup");
  const popupImg = document.getElementById("popup-img");
  const popupTitle = document.getElementById("popup-title");
  const popupDesc = document.getElementById("popup-desc");

  let descriptionData = {};
  let fullImageList = [];  // 전체 이미지 목록 (경로 포함)
  let imageTagMap = {};    // 이미지 분류 접두어 (movie_, fairy_ 등)

  function showImages(prefix) {
  const left = document.getElementById("left-column");
  const right = document.getElementById("right-column");
  left.innerHTML = '';
  right.innerHTML = '';

  const filtered1500 = fullImageList
    .filter(path => path.includes("1500/") && (prefix === 'all' || path.split("/").pop().startsWith(prefix)));

  const filtered1920 = fullImageList
    .filter(path => path.includes("1920/") && (prefix === 'all' || path.split("/").pop().startsWith(prefix)));

  function renderImage(targetContainer, imagePaths, width, height) {
    imagePaths.forEach(path => {
      const filename = path.split("/").pop();
      const encodedPath = path
        .split("/")
        .slice(0, -1)
        .join("/") + "/" + encodeURIComponent(filename);

      const img = document.createElement("img");
      img.src = encodedPath;
      img.alt = filename;

      img.onclick = () => {
        popupImg.src = encodedPath;
        const key = filename.trim();
        const info = descriptionData[key] || { title: key, desc: "설명이 없습니다." };
        popupTitle.textContent = info.title;
        popupDesc.textContent = info.desc;
        popup.style.display = "flex";
      };

      targetContainer.appendChild(img);
    });
  }

  renderImage(left, filtered1500, 270, 270);
  renderImage(right, filtered1920, 320, 180);
}



  // 버튼 효과
  const filterButtons = document.querySelectorAll('.filter-buttons button');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        if (b.textContent !== 'All') {
          b.classList.remove('selected');
        }
      });
      if (btn.textContent !== 'All') {
        btn.classList.add('selected');
      }
    });
  });

  // 이미지 및 설명 불러오기
  fetch("json/imageList.json")
    .then(res => res.json())
    .then(data => {
      // 1. 1500 → 1920 순서대로 경로 생성
      const from1500 = data["1500"].map(name => {
        const fullPath = `cobubu/1500/${name}`;
        const tag = name.split("_")[0] + "_"; // movie_COBUBU#001.png → movie_
        imageTagMap[fullPath] = tag;
        return fullPath;
      });

      const from1920 = data["1920"].map(name => {
        const fullPath = `cobubu/1920/${name}`;
        const tag = name.split("_")[0] + "_";
        imageTagMap[fullPath] = tag;
        return fullPath;
      });

      fullImageList = [...from1500, ...from1920];

      // 2. 설명 데이터(script.txt)도 같이 로딩
      return fetch("script.txt");
    })
    .then(res => res.text())
    .then(text => {
      const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
      for (let i = 0; i < lines.length; i += 3) {
        const filename = lines[i];
        const title = lines[i + 1] || "";
        const desc = lines[i + 2] || "";
        descriptionData[filename] = { title, desc };
      }

      showImages("all"); // 초기에는 전체 출력
    })
    .catch(err => {
      console.error("로드 실패:", err);
      showImages("all");
    });

  function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const btn = document.getElementById("sidebar-toggle");
    sidebar.classList.toggle("open");
    btn.innerHTML = sidebar.classList.contains("open") ? "❯" : "❮";
  }