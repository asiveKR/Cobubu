  <!--  팝업 따라오기 스크립트 -->
  const popup = document.getElementById('floating-popup');
  let targetTop = 100;

  function followScroll() {
    const scrollY = window.scrollY;
    const desiredTop = scrollY + 100;

      // 애니메이션 느낌 나도록 조금씩 따라가게 설정한 부분
    targetTop += (desiredTop - targetTop) * 0.15;

    popup.style.top = `${targetTop}px`;
    requestAnimationFrame(followScroll);
  }

  followScroll();


  <!--  스프레드시트 데이터 불러오기 -->

  const sheetID = '1btEr604LSopkLGBwiC8RXRqUhMrU3vnnZGvZt1DtDQs';
  const gid = '0';
  const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:csv&gid=${gid}`;

  fetch(url)
  .then(res => res.text())
  .then(csvText => {
    const cleanRows = csvText.trim().split('\n').map(row =>
      row.split(',').map(cell => cell.replace(/^"(.*)"$/, '$1'))
      );

    const tableBody = document.getElementById('table-body');
    let rankIndex = 0;

    for (let i = 11; i < cleanRows.length; i++) {
      const row = cleanRows[i].slice(1, 5);
      if (!row || row.every(cell => !cell)) continue;

      const tr = document.createElement('tr');
      row.forEach((cell, idx) => {
        const td = document.createElement('td');



        if (idx === 1) {
          td.classList.add('owner');
          cell = ' '.repeat(10) + cell;
          td.innerText = cell;
        } else {
          td.textContent = cell || '';
        }

        tr.appendChild(td);
      });

      tableBody.appendChild(tr);
      rankIndex++;
    }
    const ownerCountMap = new Map();
    const ownerOrder = [];

// 셀 탐색 + 등장 횟수 집계
    for (let i = 11; i < cleanRows.length; i++) {
      const ownerRaw = cleanRows[i][2];
      if (!ownerRaw) continue;

      const trimmed = ownerRaw.trim();
      if (trimmed === '-' || !trimmed.includes('@') || /^[\s\-]*$/.test(trimmed)) continue;

      const cleaned = trimmed.replace(/[-\s]/g, '');
      if (!ownerCountMap.has(cleaned)) {
        ownerCountMap.set(cleaned, { count: 1, raw: ownerRaw });
        ownerOrder.push(cleaned);
      } else {
        ownerCountMap.get(cleaned).count += 1;
      }


    }

// 등장 횟수가 2 이상인 항목만 추출
    const eligible = [...ownerCountMap.entries()]
    .filter(([_, val]) => val.count >= 2)
    .sort((a, b) => {
    // 등장 횟수 내림차순, 같으면 등장 순서 빠른 순
      if (b[1].count !== a[1].count) return b[1].count - a[1].count;
      return ownerOrder.indexOf(a[0]) - ownerOrder.indexOf(b[0]);
    });

// 순위 표시 (최대 3명만)
    const rankIDs = ['rank-1', 'rank-2', 'rank-3'];
    for (let j = 0; j < Math.min(3, eligible.length); j++) {
      const el = document.getElementById(rankIDs[j]);
      if (el) {
        const name = eligible[j][1].raw;
        const count = eligible[j][1].count;
        el.textContent = `${name} "${count}"`;
      }
    }

  })
  .catch(err => {
    console.error("스프레드시트 불러오기 실패:", err);
  });

