window.addEventListener('DOMContentLoaded', () => {
    const photosContainer = document.querySelector('.photos');
    const seasonButtons = document.querySelectorAll('#sbtn li');
    
    let fileIndex = 1;
    let currentSeason = ""; // 자동으로 최신 시즌을 찾습니다.

    // [핵심 기능] 이미지를 순서대로 불러오는 함수
    async function loadNextImage(season) {
        // [검증 1] 이미지를 요청하기 전에 사용자가 다른 시즌 버튼을 눌렀다면 즉시 중단(폭파)
        if (season !== currentSeason) return;

        const imgUrl = `img/${currentSeason}/${fileIndex}.webp`;

        try {
            const response = await fetch(imgUrl, { method: 'HEAD' });

            if (!response.ok) {
                throw new Error('NOT_FOUND');
            }

            // [검증 2] 서버 응답을 기다리는 사이(await) 다른 시즌으로 바꼈는지 다시 검사
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
                // [검증 3] 이미지 로딩이 완료된 시점에도 최종 확인 후 화면에 삽입
                if (season === currentSeason) {
                    photosContainer.appendChild(img);
                    fileIndex++;
                    loadNextImage(season); // 다음 이미지 호출
                }
            };

        } catch (err) {
            // 더 이상 이미지가 없어서 멈춘 정상적인 상황이거나, 다른 시즌 버튼을 눌러 예외 처리가 된 경우
            if (season === currentSeason) {
                printStatusMessage(season, fileIndex - 1);
            }
        }
    }

    // 콘솔 로그 출력용 함수 분리
    function printStatusMessage(season, totalCount) {
        console.log(`%c[시즌 ${season}] 총 ${totalCount}개의 이미지를 전부 불러왔습니다.`, 'color: #00fa9a; font-weight: bold;');
    }

    // [시즌 변경 및 클래스 토글] 
    function changeSeason(targetSeason, targetButton) {
        currentSeason = targetSeason;
        fileIndex = 1;
        photosContainer.innerHTML = ''; // 화면 즉시 비우기
        
        // 버튼 활성화 클래스 조절
        seasonButtons.forEach(btn => btn.classList.remove('on'));
        if (targetButton) {
            targetButton.classList.add('on');
        }

        // 새 시즌 이미지 로딩 기동
        loadNextImage(currentSeason);
    }

    // [이벤트 바인딩] HTML에 적힌 li 버튼들에 클릭 이벤트 부여
    seasonButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedSeason = button.textContent.trim();
            
            // 현재 이미 보고 있는 시즌을 또 누른 경우는 무시합니다.
            if (selectedSeason === currentSeason) return;

            // 로딩 중이든 아니든 상관없이 즉시 해당 시즌으로 교체 처리를 갈겨버립니다.
            changeSeason(selectedSeason, button);
        });
    });

    // [최신 시즌 자동 실행] 맨 마지막 li 요소를 찾아 기본값으로 실행
    if (seasonButtons.length > 0) {
        const latestButton = seasonButtons[seasonButtons.length - 1]; 
        const latestSeason = latestButton.textContent.trim();
        
        changeSeason(latestSeason, latestButton);
    }
});