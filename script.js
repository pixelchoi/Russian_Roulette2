const TOTAL_ROUNDS = 30;
let penalties = [];
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
    let items = penaltyInput.value.split(',').map(item => item.trim()).filter(item => item !== "");
    let realPenalties = items.filter(item => item !== "통과!" && item !== "");
    if (realPenalties.length === 0) realPenalties.push("꽝!");

    penalties = Array(TOTAL_ROUNDS).fill("통과!");
    let targetIndex = parseInt(secretTarget.value) - 1;

    if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < TOTAL_ROUNDS) {
        penalties[targetIndex] = realPenalties; // 첫 번째 실탄 무조건 저격 배치
        
        let availableIndices = [];
        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            if (i !== targetIndex) availableIndices.push(i);
        }
        for (let k = 1; k < realPenalties.length; k++) {
            if (availableIndices.length === 0) break;
            let randKey = Math.floor(Math.random() * availableIndices.length);
            let targetSlot = availableIndices.splice(randKey, 1);
            penalties[targetSlot] = realPenalties[k];
        }
    } else {
        let baseItems = [...realPenalties];
        while(realPenalties.length < TOTAL_ROUNDS * 0.3) {
            realPenalties = realPenalties.concat(baseItems);
        }
        for(let i = 0; i < realPenalties.length && i < TOTAL_ROUNDS; i++) {
            penalties[i] = realPenalties[i];
        }
        for (let i = penalties.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [penalties[i], penalties[j]] = [penalties[j], penalties[i]];
        }
    }

    currentShotCount = 0;
    isGameOver = false;
    resultText.innerText = "";
    statusText.innerText = "조정간 연사/단발 확인됨. 사격 준비 완료.";
    statusText.style.color = "#ccc";
    bulletCounter.innerText = `MAG: 30 / 30 ROUNDS`;
    reloadBtn.classList.remove('active');
    shootBtn.disabled = false;
    autoBtn.disabled = false;

    magFeed.innerHTML = "";
    for(let i = 0; i < TOTAL_ROUNDS; i++) {
        let node = document.createElement('div');
        node.className = "bullet-node";
        magFeed.appendChild(node);
    }
}

function pullTrigger() {
    if (isGameOver) { return true; } // 게임 종료 시 true를 반환하여 연사 타이머 즉각 정지
    
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
        clearInterval(autoInterval); // 연사 스톱
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
