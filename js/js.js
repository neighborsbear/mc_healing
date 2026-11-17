window.addEventListener('DOMContentLoaded', () => {
    const photosContainer = document.querySelector('.photos');
    const seasonButtons = document.querySelectorAll('#sbtn li');
    const paginationContainer = document.getElementById('pagination');
    const bgmPlayer = document.getElementById('bgm');
    const bgmToggleBtn = document.getElementById('bgm-toggle');
    const bgmVolumeBar = document.getElementById('bgm-volume');
    
    let currentSeason = ""; 
    let totalImagesCount = 0; 
    let currentPage = 1;      
    const itemsPerPage = 20;  
    let loadSequenceId = 0; // 페이지를 빨리 넘길 때 이전 로딩을 무효화하는 ID
    let isBgmEnabled = false; 

    const validSeasons = Array.from(seasonButtons).map(btn => btn.textContent.trim());

    // [최적화 1] 각 시즌별 총 사진 개수를 여기에 상수로 지정합니다. (탐색 딜레이 0초)
    // 사진이 늘어나면 이 숫자만 수정해 주시면 됩니다!
    const seasonTotalCounts = {
        "-1": 190,  // 예시: 시즌 -1 총 개수
        "0": 49,  // 예시: 시즌 0 총 개수
        "1": 651   // 예시: 시즌 1 총 개수
    };

    function updateVolumeSliderUI() {
        const val = bgmVolumeBar.value;
        const min = bgmVolumeBar.min || 0;
        const max = bgmVolumeBar.max || 1;
        const percentage = ((val - min) / (max - min)) * 100;
        bgmVolumeBar.style.background = `linear-gradient(to right, #2ecc71 ${percentage}%, #bdffd9 ${percentage}%)`;
    }

    bgmPlayer.volume = bgmVolumeBar.value;
    updateVolumeSliderUI();

    function updateBgmButtonUI() {
        if (isBgmEnabled && !bgmPlayer.paused) {
            bgmToggleBtn.textContent = '🔊 BGM ON';
            bgmToggleBtn.classList.add('playing');
        } else {
            bgmToggleBtn.textContent = '🔇 BGM OFF';
            bgmToggleBtn.classList.remove('playing');
        }
    }

    bgmToggleBtn.addEventListener('click', () => {
        if (!isBgmEnabled) {
            isBgmEnabled = true;
            bgmPlayer.play().then(() => {
                updateBgmButtonUI();
            }).catch(err => {
                console.log("오디오 재생 실패:", err);
                isBgmEnabled = false;
                updateBgmButtonUI();
            });
        } else {
            isBgmEnabled = false;
            bgmPlayer.pause();
            updateBgmButtonUI();
        }
    });

    bgmVolumeBar.addEventListener('input', (e) => {
        bgmPlayer.volume = e.target.value;
        updateVolumeSliderUI();
    });

    function updateHashPath(season, page) {
        const newHash = `#${season}/${page}`;
        if (window.location.hash !== newHash) {
            window.location.hash = newHash;
        }
    }

    // [최적화 2] 현재 페이지의 이미지만 우선 로드 + 빠르게 넘기면 이전 로딩 즉시 차단
    function renderPhotosForPage(season, page, updateHistory = true) {
        const currentLoadId = ++loadSequenceId; // 로딩 요청 번호 갱신
        photosContainer.innerHTML = '';
        currentPage = page;

        if (updateHistory) {
            updateHashPath(season, currentPage);
        }

        const startIndex = (page - 1) * itemsPerPage + 1;
        const endIndex = Math.min(page * itemsPerPage, totalImagesCount);

        for (let i = startIndex; i <= endIndex; i++) {
            const imgUrl = `img/${season}/${i}.webp`;
            const img = document.createElement('img');
            
            // 이미지가 로드될 때 현재 페이지의 요청이 맞는지 검사하여, 지나쳐버린 페이지의 로딩은 무시
            img.onload = function() {
                if (currentLoadId !== loadSequenceId || season !== currentSeason) return;
            };

            img.src = imgUrl;
            img.alt = `시즌 ${season} 사진 ${i}`;
            photosContainer.appendChild(img);
        }

        renderPagination(season);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderPagination(season) {
        paginationContainer.innerHTML = '';
        const totalPages = Math.ceil(totalImagesCount / itemsPerPage);
        
        if (totalPages <= 1) return;

        const maxVisiblePages = 7;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            addPageButton(1, season);
            if (startPage > 2) addEllipsis();
        }

        for (let i = startPage; i <= endPage; i++) {
            addPageButton(i, season);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) addEllipsis();
            addPageButton(totalPages, season);
        }
    }

    function addPageButton(pageNum, season) {
        const btn = document.createElement('button');
        btn.textContent = pageNum;
        if (pageNum === currentPage) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            if (pageNum !== currentPage) {
                renderPhotosForPage(season, pageNum, true);
            }
        });
        paginationContainer.appendChild(btn);
    }

    function addEllipsis() {
        const span = document.createElement('span');
        span.textContent = '...';
        span.style.padding = '6px 8px';
        span.style.alignSelf = 'center';
        paginationContainer.appendChild(span);
    }

    // 탐색 없이 상수로 즉시 개수 설정 후 렌더링
    function loadSeason(season, targetPage = 1, updateHistory = true) {
        currentSeason = season;
        photosContainer.innerHTML = '';
        paginationContainer.innerHTML = '';
        
        totalImagesCount = seasonTotalCounts[season] || 0;

        if (totalImagesCount > 0) {
            const maxPages = Math.ceil(totalImagesCount / itemsPerPage);
            const finalPage = targetPage > maxPages ? maxPages : targetPage;

            renderPhotosForPage(season, finalPage, updateHistory);
        } else {
            photosContainer.innerHTML = '<p>등록된 이미지가 없습니다.</p>';
            paginationContainer.innerHTML = '';
        }
    }

    function changeSeason(targetSeason, targetButton, targetPage = 1, updateHistory = true) {
        seasonButtons.forEach(btn => btn.classList.remove('on'));
        if (targetButton) {
            targetButton.classList.add('on');
        }

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

        loadSeason(targetSeason, targetPage, updateHistory);
    }

    seasonButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedSeason = button.textContent.trim();
            if (selectedSeason === currentSeason) return;

            let targetBtn = button;
            seasonButtons.forEach(b => {
                if (b.textContent.trim() === selectedSeason) targetBtn = b;
            });

            changeSeason(selectedSeason, targetBtn, 1, true);
        });
    });

    window.addEventListener('hashchange', () => {
        parseHashAndLoad(false);
    });

    function parseHashAndLoad(updateHistory = false) {
        const hash = window.location.hash.replace('#', '');
        const parts = hash.split('/');
        
        let seasonToLoad = "";
        let pageToLoad = 1;

        if (parts.length >= 2 && validSeasons.includes(parts[0]) && !isNaN(parts[1])) {
            seasonToLoad = parts[0];
            pageToLoad = parseInt(parts[1], 10);
        }

        if (!seasonToLoad) {
            seasonToLoad = validSeasons[validSeasons.length - 1];
            pageToLoad = 1;
        }

        let targetBtn = null;
        seasonButtons.forEach(btn => {
            if (btn.textContent.trim() === seasonToLoad) {
                targetBtn = btn;
            }
        });

        if (seasonToLoad !== currentSeason) {
            changeSeason(seasonToLoad, targetBtn, pageToLoad, updateHistory);
        } else if (pageToLoad !== currentPage) {
            renderPhotosForPage(seasonToLoad, pageToLoad, updateHistory);
        }
    }

    if (seasonButtons.length > 0) {
        if (window.location.hash) {
            parseHashAndLoad(true);
        } else {
            const defaultSeason = validSeasons[validSeasons.length - 1];
            changeSeason(defaultSeason, seasonButtons[seasonButtons.length - 1], 1, true);
        }
    }
});