const TOTAL_ROUNDS = 30;
let penalties = Array(TOTAL_ROUNDS).fill("통과!");
let currentShotCount = 0;
let isGameOver = false;
let autoInterval = null;

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

function initGame() {
    clearInterval(autoInterval);
    
    // 1. 공탄(통과) 리스트로 탄창 완전 초기화
    penalties = Array(TOTAL_ROUNDS).fill("통과!");

    // 2. 사용자 입력값 파싱 (벌칙탄 추출)
    let items = penaltyInput.value.split(',').map(item => item.trim()).filter(item => item !== "");
    let realPenalties = items.filter(item => item !== "통과!" && item !== "");
    if (realPenalties.length === 0) realPenalties.push("꽝!");

    let targetIndex = parseInt(secretTarget.value) - 1; // 사용자는 1부터 입력하므로 인덱스 보정(-1)

    // 3. 실탄 배치 로직 패치
    if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < TOTAL_ROUNDS) {
        // [A] 저격 모드 활성화 시:
        // 지정된 자리에 첫 번째 벌칙을 확실하게 꽂아 넣고, '그 외의 29칸은 무조건 100% 공탄' 처리합니다.
        penalties[targetIndex] = realPenalties[0];
    } else {
        // [B] 순수 랜덤 모드 시:
        // 사용자가 입력한 벌칙 목록의 개수만큼만 딱 1발씩 무작위 빈 공간을 찾아 배치합니다. (과도한 복사 도배 제거)
        let availableIndices = [];
        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            availableIndices.push(i);
        }
        
        for (let k = 0; k < realPenalties.length; k++) {
            if (availableIndices.length === 0) break;
            // 남아있는 빈 칸 인덱스 중 하나를 무작위 선택
            let randKey = Math.floor(Math.random() * availableIndices.length);
            let chosenSlot = availableIndices.splice(randKey, 1)[0];
            penalties[chosenSlot] = realPenalties[k];
        }
    }

    // 4. 무기 제어 및 UI 리셋
    currentShotCount = 0;
    isGameOver = false;
    resultText.innerText = "";
    statusText.innerText = "조정간 연사/단발 확인됨. 사격 준비 완료.";
    statusText.style.color = "#ccc";
    bulletCounter.innerText = `MAG: 30 / 30 ROUNDS`;
    reloadBtn.classList.remove('active');
    shootBtn.disabled = false;
    autoBtn.disabled = false;

    // 30발 탄창 그래픽 재생성
    magFeed.innerHTML = "";
    for(let i = 0; i < TOTAL_ROUNDS; i++) {
        let node = document.createElement('div');
        node.className = "bullet-node";
        magFeed.appendChild(node);
    }
}

function pullTrigger() {
    if (isGameOver) { return true; } 
    
    if (currentShotCount >= TOTAL_ROUNDS) {
        clearInterval(autoInterval);
        statusText.innerText = "탄창 고갈! 재장전이 필요합니다.";
        statusText.style.color = 'var(--accent-color)';
        shootBtn.disabled = true;
        autoBtn.disabled = true;
        reloadBtn.classList.add('active');
        return true;
    }

    mainContainer.classList.add('recoil-effect');
    setTimeout(() => { mainContainer.classList.remove('recoil-effect'); }, 100);

    let nodes = document.querySelectorAll('.bullet-node');
    nodes[currentShotCount].classList.add('spent');

    let currentResult = penalties[currentShotCount];
    currentShotCount++;
    bulletCounter.innerText = `MAG: ${TOTAL_ROUNDS - currentShotCount} / 30 ROUNDS`;

    if (currentResult !== "통과!") {
        clearInterval(autoInterval); // 실탄 격발 시 즉시 연사 타이머 정지
        isGameOver = true;
        shootBtn.disabled = true;
        autoBtn.disabled = true;
        
        statusText.innerText = "🚨 TARGET HIT! 사격 중 피격당했습니다! 🚨";
        statusText.style.color = 'var(--accent-color)';
        resultText.innerText = `💥 탕! [${currentResult}]`;
        resultText.style.color = 'var(--accent-color)';
        
        reloadBtn.classList.add('active');
        return true;
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
        return false;
    }
}

function startFullAuto() {
    if (isGameOver) return;
    shootBtn.disabled = true;
    autoBtn.disabled = true;
    statusText.innerText = "🔥 드르르르르륵 연사 개시!!";
    statusText.style.color = '#ff9f43';

    autoInterval = setInterval(() => {
        let isHit = pullTrigger();
        if (isHit) { 
            clearInterval(autoInterval); 
        }
    }, 150);
}

function reloadMagazine() {
    statusText.innerText = "철컥, 탄창 분리 후 전술 재장전 중...";
    setTimeout(() => { initGame(); }, 300);
}

secretTarget.addEventListener('input', () => { if(currentShotCount === 0) initGame(); });
penaltyInput.addEventListener('change', () => { if(currentShotCount === 0) initGame(); });
window.onload = initGame;
