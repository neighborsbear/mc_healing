window.addEventListener('DOMContentLoaded', () => {
    const photosContainer = document.querySelector('.photos');
    const seasonButtons = document.querySelectorAll('#sbtn li');
    const bgmPlayer = document.getElementById('bgm');
    const bgmToggleBtn = document.getElementById('bgm-toggle');
    const bgmVolumeBar = document.getElementById('bgm-volume');
    
    let currentSeason = ""; 
    let loadSequenceId = 0;
    let isBgmEnabled = false; // 초기 상태는 꺼짐

    // 슬라이드바 왼쪽 채움 색상(#2ecc71) 업데이트 함수
    function updateVolumeSliderUI() {
        const val = bgmVolumeBar.value;
        const min = bgmVolumeBar.min || 0;
        const max = bgmVolumeBar.max || 1;
        const percentage = ((val - min) / (max - min)) * 100;
        
        bgmVolumeBar.style.background = `linear-gradient(to right, #2ecc71 ${percentage}%, #bdffd9 ${percentage}%)`;
    }

    // 초기 볼륨 및 슬라이드바 색상 반영
    bgmPlayer.volume = bgmVolumeBar.value;
    updateVolumeSliderUI();

    // BGM 버튼 UI 업데이트 함수
    function updateBgmButtonUI() {
        if (isBgmEnabled && !bgmPlayer.paused) {
            bgmToggleBtn.textContent = '🔊 BGM ON';
            bgmToggleBtn.classList.add('playing');
        } else {
            bgmToggleBtn.textContent = '🔇 BGM OFF';
            bgmToggleBtn.classList.remove('playing');
        }
    }

    // 우측 상단 BGM 버튼 클릭 이벤트
    bgmToggleBtn.addEventListener('click', () => {
        if (!isBgmEnabled) {
            isBgmEnabled = true;
            bgmPlayer.play().then(() => {
                updateBgmButtonUI();
            }).catch(err => {
                console.log("오디오 재생 실패 (파일 경로 확인 필요):", err);
                isBgmEnabled = false;
                updateBgmButtonUI();
            });
        } else {
            isBgmEnabled = false;
            bgmPlayer.pause();
            updateBgmButtonUI();
        }
    });

    // 볼륨 슬라이드바 조절 이벤트
    bgmVolumeBar.addEventListener('input', (e) => {
        bgmPlayer.volume = e.target.value;
        updateVolumeSliderUI(); // 드래그할 때마다 왼쪽 색상 영역 갱신
    });

    // 이미지를 순차적으로 불러오는 함수
    function loadImagesForSeason(season) {
        const currentLoadId = ++loadSequenceId;
        let fileIndex = 1;
        const maxConsecutiveErrors = 3;
        let consecutiveErrors = 0;

        function tryNext() {
            if (season !== currentSeason || currentLoadId !== loadSequenceId) return;

            const imgUrl = `img/${season}/${fileIndex}.webp`;
            const img = document.createElement('img');
            
            img.src = imgUrl;
            img.alt = `시즌 ${season} 사진 ${fileIndex}`;

            img.onload = function() {
                if (season !== currentSeason || currentLoadId !== loadSequenceId) return;
                
                photosContainer.appendChild(img);
                consecutiveErrors = 0;
                fileIndex++;
                tryNext();
            };

            img.onerror = function() {
                if (season !== currentSeason || currentLoadId !== loadSequenceId) return;
                
                consecutiveErrors++;
                fileIndex++;
                
                if (consecutiveErrors <= maxConsecutiveErrors) {
                    tryNext(); 
                } else {
                    console.log(`%c[시즌 ${season}] 이미지 로딩이 완료되었습니다.`, 'color: #00fa9a; font-weight: bold;');
                }
            };
        }

        tryNext();
    }

    // 시즌 변경 및 BGM / 클래스 토글
    function changeSeason(targetSeason, targetButton) {
        currentSeason = targetSeason;
        photosContainer.innerHTML = '';
        
        seasonButtons.forEach(btn => btn.classList.remove('on'));
        if (targetButton) {
            targetButton.classList.add('on');
        }

        // 시즌별 BGM 파일 경로 지정 (-1.mp3, 0.mp3, 1.mp3 ...)
        bgmPlayer.src = `audio/${targetSeason}.mp3`;

        if (isBgmEnabled) {
            bgmPlayer.play().then(() => {
                updateBgmButtonUI();
            }).catch(() => {
                updateBgmButtonUI();
            });
        } else {
            updateBgmButtonUI();
        }

        loadImagesForSeason(currentSeason);
    }

    // 시즌 버튼 클릭 이벤트 바인딩
    seasonButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedSeason = button.textContent.trim();
            if (selectedSeason === currentSeason) return;
            changeSeason(selectedSeason, button);
        });
    });

    // 최신 시즌 자동 실행
    if (seasonButtons.length > 0) {
        const latestButton = seasonButtons[seasonButtons.length - 1]; 
        const latestSeason = latestButton.textContent.trim();
        changeSeason(latestSeason, latestButton);
    }
});