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
    let loadSequenceId = 0;
    let isBgmEnabled = false; 

    const validSeasons = Array.from(seasonButtons).map(btn => btn.textContent.trim());

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

    // 실제 화면에 보여줄 때만 이미지를 로드 (20장만)
    function renderPhotosForPage(season, page, updateHistory = true) {
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

    // [핵심] 이미지를 화면에 띄우지 않고, 파일 존재 여부만 빠르게 체크해서 총 갯수 파악
    function checkSeasonTotalImages(season, targetPage = 1, updateHistory = true) {
        const currentLoadId = ++loadSequenceId;

        // 화면에 그리지 않고 fetch(HEAD)나 빈 Image 객체로 존재 유무만 가볍게 확인
        function checkExists(index) {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = `img/${season}/${index}.webp`;
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
            });
        }

        async function findCount() {
            // 1번도 없으면 빈 시즌
            if (!(await checkExists(1))) {
                if (season !== currentSeason || currentLoadId !== loadSequenceId) return;
                totalImagesCount = 0;
                photosContainer.innerHTML = '<p>등록된 이미지가 없습니다.</p>';
                paginationContainer.innerHTML = '';
                return;
            }

            // 1, 2, 4, 8, 16... 배수 단위로 빠르게 상한선 탐색 (요청 횟수 최소화)
            let upperBound = 1;
            while (await checkExists(upperBound * 2)) {
                if (season !== currentSeason || currentLoadId !== loadSequenceId) return;
                upperBound *= 2;
                if (upperBound > 50000) break; 
            }

            // 찾은 범위 안에서 정확한 마지막 번호 확정 (이진 탐색)
            let lowerBound = upperBound;
            upperBound = upperBound * 2;
            let lastValid = lowerBound;

            while (lowerBound <= upperBound) {
                if (season !== currentSeason || currentLoadId !== loadSequenceId) return;
                const mid = Math.floor((lowerBound + upperBound) / 2);
                if (await checkExists(mid)) {
                    lastValid = mid;
                    lowerBound = mid + 1;
                } else {
                    upperBound = mid - 1;
                }
            }

            if (season !== currentSeason || currentLoadId !== loadSequenceId) return;

            totalImagesCount = lastValid;
            const maxPages = Math.ceil(totalImagesCount / itemsPerPage);
            const finalPage = targetPage > maxPages ? maxPages : targetPage;

            // 총 개수 파악 완료 즉시 해당 페이지만 렌더링
            renderPhotosForPage(season, finalPage, updateHistory);
        }

        findCount();
    }

    function changeSeason(targetSeason, targetButton, targetPage = 1, updateHistory = true) {
        currentSeason = targetSeason;
        
        photosContainer.innerHTML = '';
        paginationContainer.innerHTML = '';
        
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

        checkSeasonTotalImages(currentSeason, targetPage, updateHistory);
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