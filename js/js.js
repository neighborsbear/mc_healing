window.addEventListener('DOMContentLoaded', () => {
    const photosContainer = document.querySelector('.photos');
    const seasonButtons = document.querySelectorAll('#sbtn li');
    
    let fileIndex = 1;
    let currentSeason = ""; // 초기값은 비워두고 자동으로 최신 시즌을 찾습니다.
    let isClickBlocked = false; // 이미지 로딩 중 중복 클릭 방지용 플래그

    // [핵심 기능] 이미지를 순서대로 불러오는 함수
    async function loadNextImage(season) {
        if (season !== currentSeason) return;

        const imgUrl = `img/${currentSeason}/${fileIndex}.webp`;

        try {
            const response = await fetch(imgUrl, { method: 'HEAD' });

            if (!response.ok) {
                throw new Error('NOT_FOUND');
            }

            if (season !== currentSeason) return;

            const lastModified = response.headers.get('Last-Modified');
            let dateString = `${fileIndex}.webp`;

            if (lastModified) {
                const date = new Date(lastModified);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                
                dateString = `${year}${month}${day}_${hours}${minutes}${seconds}`;
            }

            const img = document.createElement('img');
            img.src = imgUrl;
            img.alt = dateString;

            img.onload = function() {
                if (season === currentSeason) {
                    photosContainer.appendChild(img);
                    fileIndex++;
                    loadNextImage(season);
                }
            };

        } catch (err) {
            console.log(`%c[시즌 ${season}] 총 ${fileIndex - 1}개의 이미지를 전부 불러왔습니다.`, 'color: #00fa9a; font-weight: bold;');
            isClickBlocked = false;
        }
    }

    // [시즌 변경 및 클래스 토글] 
    function changeSeason(targetSeason, targetButton) {
        currentSeason = targetSeason;
        fileIndex = 1;
        photosContainer.innerHTML = '';
        
        // 모든 li에서 on 클래스를 지우고, 클릭된 li에만 on 클래스 추가
        seasonButtons.forEach(btn => btn.classList.remove('on'));
        if (targetButton) {
            targetButton.classList.add('on');
        }

        loadNextImage(currentSeason);
    }

    // [이벤트 바인딩] HTML에 적힌 li 버튼들에 클릭 이벤트 부여
    seasonButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedSeason = button.textContent.trim();
            
            if (selectedSeason === currentSeason && photosContainer.children.length > 0) return;
            if (isClickBlocked) return; 

            isClickBlocked = true;
            changeSeason(selectedSeason, button);
        });
    });

    // [최신 시즌 자동 실행] 
    // #sbtn li 중 가장 마지막(가장 밑에 있는) 요소를 찾아 기본값으로 실행합니다.
    if (seasonButtons.length > 0) {
        const latestButton = seasonButtons[seasonButtons.length - 1]; // 맨 마지막 li 선택
        const latestSeason = latestButton.textContent.trim();
        
        isClickBlocked = true;
        changeSeason(latestSeason, latestButton);
    }
});