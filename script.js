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

    // 2. 사용자 입력값 파싱 (공백 제거 후 실제 입력값 추출)
    let items = penaltyInput.value.split(',').map(item => item.trim()).filter(item => item !== "");
    let realPenalties = items.filter(item => item !== "통과!" && item !== "");
    if (realPenalties.length === 0) realPenalties.push("꽝!");

    let targetIndex = parseInt(secretTarget.value) - 1; // 사용자는 1부터 입력하므로 인덱스 보정(-1)

    // 3. 실탄 배치 로직 (버그 수정 및 확률 밸런스 패치)
    if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < TOTAL_ROUNDS) {
        // [A] 저격 모드 활성화 시:
        // 배열 자체가 통째로 들어가는 버그 수정 -> 입력된 이름 중 단 '하나'만 골라 꽂아 넣습니다.
        // 해당 자리를 제외한 나머지 29칸은 무조건 100% 공탄("통과!")이므로 그 전에는 절대 안 터집니다.
        let luckyPick = realPenalties[Math.floor(Math.random() * realPenalties.length)];
        penalties[targetIndex] = luckyPick;
    } else {
        // [B] 순수 랜덤 모드 시 (후반부 확률 버프 적용):
        // 1~10번째(앞쪽) 보다는 11~30번째(뒤쪽) 공간을 우선 확보하여 확률을 뒤로 밉니다.
        let frontIndices = []; // 0 ~ 9 (1~10번째 총알)
        let backIndices = [];  // 10 ~ 29 (11~30번째 총알)
        
        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            if (i < 10) frontIndices.push(i);
            else backIndices.push(i);
        }

        // 입력된 벌칙(또는 이름) 개수만큼 실탄 배치
        for (let k = 0; k < realPenalties.length; k++) {
            let chosenSlot;
            
            // 85%의 높은 확률로 탄창 뒤쪽에 실탄을 배치하여 초반 광탈 방지 및 빌드업 제공
            if (backIndices.length > 0 && (Math.random() < 0.85 || frontIndices.length === 0)) {
                let randKey = Math.floor(Math.random() * backIndices.length);
                chosenSlot = backIndices.splice(randKey, 1)[0];
            } else if (frontIndices.length > 0) {
                let randKey = Math.floor(Math.random() * frontIndices.length);
                chosenSlot = frontIndices.splice(randKey, 1)[0];
            } else {
                break;
            }
            
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
        clearInterval(autoInterval); // 실탄 격발 시 즉시 연사 정지
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
