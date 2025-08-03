// 팝업 따라오기 스크립트
const popup = document.getElementById('floating-popup');
let targetTop = 100;

function followScroll() {
  const scrollY = window.scrollY;
  const desiredTop = scrollY * 0.1 + 100;

  targetTop += (desiredTop - targetTop) * 0.15;
  popup.style.top = `${targetTop}px`;
  requestAnimationFrame(followScroll);
}

followScroll();

// 스프레드시트 데이터 불러오기
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
          td.innerText = ' '.repeat(10) + (cell || '');
        } else if (idx === 3 && cell && cell.startsWith('http')) {
          // Note 셀에 http로 시작하는 경우 → 하이퍼링크 처리
          const a = document.createElement('a');
          a.href = cell;
          a.textContent = '💎';
          a.target = '_blank';
          a.style.textDecoration = 'underline';
          td.appendChild(a);
        } else {
          td.textContent = cell || '';
        }

        tr.appendChild(td);
      });

      tableBody.appendChild(tr);
      rankIndex++;
    }

    // 등장 횟수 분석
    const ownerCountMap = new Map();
    const ownerOrder = [];

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

    const eligible = [...ownerCountMap.entries()]
      .filter(([_, val]) => val.count >= 2)
      .sort((a, b) => {
        if (b[1].count !== a[1].count) return b[1].count - a[1].count;
        return ownerOrder.indexOf(a[0]) - ownerOrder.indexOf(b[0]);
      });

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
