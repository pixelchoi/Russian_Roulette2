// 전역 SCAR-H 무기 시스템 변수
const TOTAL_ROUNDS = 30;
let penalties = [];
let currentShotCount = 0;
let isGameOver = false;
let autoInterval = null; // 연사 타이머 저장용

// DOM 인프라 탐색
const magFeed = document.getElementById('magFeed');
const penaltyInput = document.getElementById('penaltyInput');
const secretTarget = document.getElementById('secretTarget');
const resultText = document.getElementById('resultText');
const statusText = document.getElementById('statusText');
const bulletCounter = document.getElementById('bulletCounter');
const mainContainer = document.getElementById('mainContainer');
const reloadBtn = document.getElementById('reloadBtn');
const shootBtn = document.getElementById('shootBtn');
const autoBtn = document.getElementById('autoBtn');

// 30발 탄창 초기 세팅 시스템
function initGame() {
    // 연사 인터벌이 돌고 있다면 정지
    clearInterval(autoInterval);

    // 1. 사용자 입력 파싱
    let items = penaltyInput.value.split(',').map(item => item.trim()).filter(item => item !== "");
    
    // 벌칙탕 중 실탄(진짜 벌칙)과 통과탄 분리
    let realPenalties = items.filter(item => item !== "통과!" && item !== "");
    if (realPenalties.length === 0) realPenalties.push("꽝!");

    // 30발 공간 생성 (일단 기본은 전부 "통과!"로 채움)
    penalties = Array(TOTAL_ROUNDS).fill("통과!");

    // 2. [저격 모드 메커니즘 검증]
    let targetIndex = parseInt(secretTarget.value) - 1; // 사용자는 1부터 입력하므로 -1 처리

    if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < TOTAL_ROUNDS) {
        // [A] 조작 저격 모드: 지정된 자리에 첫 번째 벌칙을 넣고, 나머지를 빈 곳에 배치
        penalties[targetIndex] = realPenalties[0];
        
        // 나머지 벌칙탄이 있다면 저격 자리를 피해서 랜덤으로 흩뿌림
        let availableIndices = [];
        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            if (i !== targetIndex) availableIndices.push(i);
        }
        
        for (let k = 1; k < realPenalties.length; k++) {
            if (availableIndices.length === 0) break;
            let randKey = Math.floor(Math.random() * availableIndices.length);
            let targetSlot = availableIndices.splice(randKey, 1)[0];
            penalties[targetSlot] = realPenalties[k];
        }
    } else {
        // [B] 순수 랜덤 모드: 기존 방식대로 무작위 분배
        let baseItems = [...realPenalties];
        // 실탄 비율이 적당히 섞이도록 복사
        while(realPenalties.length < TOTAL_ROUNDS * 0.3) { // 약 30%가 실탄이 되도록
            realPenalties = realPenalties.concat(baseItems);
        }
        
        // 30개 탄창 배열에 순서대로 덮어씌운 후 전체 셔플
        for(let i = 0; i < realPenalties.length && i < TOTAL_ROUNDS; i++) {
            penalties[i] = realPenalties[i];
        }
        
        // 피셔-예이츠 알고리즘 작동
        for (let i = penalties.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [penalties[i], penalties[j]] = [penalties[j], penalties[i]];
        }
    }

    // 3. UI 리셋
    currentShotCount = 0;
    isGameOver = false;
    resultText.innerText = "";
    statusText.innerText = "조정간 연사/단발 확인됨. 사격 준비 완료.";
    statusText.style.color = "#ccc";
    bulletCounter.innerText = `MAG: 30 / 30 ROUNDS`;
    reloadBtn.classList.remove('active');
    shootBtn.disabled = false;
    autoBtn.disabled = false;

    // 탄창 컨테이너 내부 총알 30개 생성
    magFeed.innerHTML = "";
    for(let i = 0; i < TOTAL_ROUNDS; i++) {
        let node = document.createElement('div');
        node.className = "bullet-node";
        magFeed.appendChild(node);
    }
}

// 트리거 격발 코어 시스템
function pullTrigger() {
    if (isGameOver) {
        clearInterval(autoInterval);
        return false;
    }

    if (currentShotCount >= TOTAL_ROUNDS) {
        clearInterval(autoInterval);
        statusText.innerText = "탄창 고갈! 재장전이 필요합니다.";
        statusText.style.color = 'var(--accent-color)';
        return false;
    }

    // 반동 효과 연출
    mainContainer.classList.add('recoil-effect');
    setTimeout(() => {
        mainContainer.classList.remove('recoil-effect');
    }, 100);

    // 총알 그래픽 소모 처리
    let nodes = document.querySelectorAll('.bullet-node');
    nodes[currentShotCount].classList.add('spent');

    let currentResult = penalties[currentShotCount];
    currentShotCount++;
    bulletCounter.innerText = `MAG: ${TOTAL_ROUNDS - currentShotCount} / 30 ROUNDS`;

    // 당첨 여부 확인
    if (currentResult !== "통과!") {
        clearInterval(autoInterval); // 연사 중이었다면 즉시 중지
        isGameOver = true;
        shootBtn.disabled = true;
        autoBtn.disabled = true;
        
        statusText.innerText = "🚨 TARGET HIT! 연사 중 피격당했습니다! 🚨";
        statusText.style.color = 'var(--accent-color)';
        
        resultText.innerText = `💥 드르륵... 탕! [${currentResult}]`;
        resultText.style.color = 'var(--accent-color)';
        
        reloadBtn.classList.add('active');
        return true; // 격발됨을 반환
    } else {
        statusText.innerText = `사격 진행 중... [${currentShotCount}발 완료]`;
        statusText.style.color = 'var(--safe-color)';
        resultText.innerText = "SAFE 🟢";
        resultText.style.color = 'var(--safe-color)';

        if (currentShotCount === TOTAL_ROUNDS) {
            statusText.innerText = "작전 성공! 30발 무사 통과.";
            reloadBtn.classList.add('active');
            shootBtn.disabled = true;
            autoBtn.disabled = true;
        }
        return false; // 불발됨을 반환
    }
}

// 💥 [추가기능] 연사(Full-Auto) 모드 타이머 시스템
function startFullAuto() {
    if (isGameOver) return;
    
    shootBtn.disabled = true;
    autoBtn.disabled = true;
    statusText.innerText = "🔥 드르르르르륵 연사 개시!!";
    statusText.style.color = '#ff9f43';

    // 0.15초(150ms) 주기로 당첨탄이 나올 때까지 연속 격발
    autoInterval = setInterval(() => {
        let isHit = pullTrigger();
        if (isHit) {
            clearInterval(autoInterval);
        }
    }, 150);
}

// 탄창 교체(재장전)
function reloadMagazine() {
    statusText.innerText = "철컥, 탄창 분리 후 전술 재장전 중...";
    setTimeout(() => {
        initGame();
    }, 300);
}

// 실시간 저격 세팅 반영 리스너
secretTarget.addEventListener('input', () => {
    if(currentShotCount === 0) initGame();
});
penaltyInput.addEventListener('change', () => {
    if(currentShotCount === 0) initGame();
});

// 초기 실행
window.onload = initGame;
