window.addEventListener('DOMContentLoaded', () => {
  const bgmAudio = document.getElementById('bgm-audio');
  const bgmIcon = document.getElementById('bgm-icon');
  const bgmLabel = document.querySelector('.bgm-label');
  const bgmToggle = document.getElementById('bgm-toggle');
  const volumeSlider = document.getElementById('volume-slider');

  // BGM 상태 가져오기
  const bgmStatus = sessionStorage.getItem('bgmStatus') || 'on';

  // 재생 위치 복구
  const startTime = sessionStorage.getItem('bgmStartTime');
  if (startTime) {
    const elapsed = (Date.now() - parseInt(startTime, 10)) / 1000;
    bgmAudio.currentTime = elapsed;
  }

  // 초기 볼륨 적용
  bgmAudio.volume = parseFloat(volumeSlider.value);

  // BGM 상태에 따라 재생/중지
  if (bgmStatus === 'on') {
    bgmAudio.play().catch((e) => console.warn("Autoplay blocked:", e));
    if (bgmIcon) bgmIcon.src = 'img/BGM_ON.png';
    bgmLabel.textContent = 'BGM ON';
  } else {
    bgmAudio.pause();
    if (bgmIcon) bgmIcon.src = 'img/BGM_OFF.png';
    bgmLabel.textContent = 'BGM OFF';
  }

  // 재생 시간 계속 저장
  setInterval(() => {
    if (!bgmAudio.paused) {
      const currentRealTime = Date.now() - (bgmAudio.currentTime * 1000);
      sessionStorage.setItem('bgmStartTime', currentRealTime);
    }
  }, 1000);

  // 랜덤 효과음 재생
  function playRandomButtonSound() {
    const rand = Math.floor(Math.random() * 4) + 1;
    const audio = new Audio(`effect/bgmButton${rand}.mp3`);
    audio.play();
  }

  //  BGM 토글
  function toggleBGM() {
  const startButton = document.getElementById('start-button');  
  if (startButton) {
    startButton.classList.add('clicked');
    setTimeout(() => startButton.classList.remove('clicked'), 150);
  }

  playRandomButtonSound();

  if (bgmAudio.paused) {
    bgmAudio.play();
    if (bgmIcon) bgmIcon.src = 'img/BGM_ON.png';
    bgmLabel.textContent = 'BGM ON';
    sessionStorage.setItem('bgmStatus', 'on');

    const resumedTimestamp = Date.now() - (bgmAudio.currentTime * 1000);
    sessionStorage.setItem('bgmStartTime', resumedTimestamp);
  } else {
    bgmAudio.pause();
    if (bgmIcon) bgmIcon.src = 'img/BGM_OFF.png';
    bgmLabel.textContent = 'BGM OFF';
    sessionStorage.setItem('bgmStatus', 'off');
  }
}

  // 볼륨 슬라이더 동기화
volumeSlider.addEventListener('input', () => {
  const value = volumeSlider.value * 100;
  volumeSlider.style.setProperty('--value', `${value}%`);
  bgmAudio.volume = parseFloat(volumeSlider.value);
});

  // 버튼 클릭 이벤트 연결
const startButton = document.getElementById('start-button');
if (startButton) {
  startButton.addEventListener('click', () => {
    toggleBGM();
  });
}
});
