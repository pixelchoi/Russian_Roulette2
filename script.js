const TOTAL_ROUNDS = 30;
let penalties = Array(TOTAL_ROUNDS).fill("통과!");
let currentShotCount = 0;
let isGameOver = false;
let autoInterval = null;

// 🎵 [사운드 파일 경로 설정] 
// 파일 이름이나 확장자가 다르다면 이 부분을 실제 파일명으로 수정하세요!
const SHOOT_SOUND_PATH = '1.mp3';  // 보내주신 격발음 파일
const RELOAD_SOUND_PATH = '2.mp3'; // 보내주신 장전음 파일

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

// 🔊 [오디오 재생 시스템] 연사 시 오디오 렉 방지를 위한 인스턴스 재생 기법
function playSound(path, volume = 1.0) {
    try {
        const audio = new Audio(path);
        audio.volume = volume;
        audio.play().catch(e => console.log("오디오 재생은 사용자 상호작용(클릭)이 필요합니다:", e));
    } catch (error) {
        console.error("오디오 파일 로드 실패:", error);
    }
}

// ⚙️ 무기 장전 및 게임 초기화 데이터 시스템
function initGame() {
    clearInterval(autoInterval);
    penalties = Array(TOTAL_ROUNDS).fill("통과!");

    let items = penaltyInput.value.split(',').map(item => item.trim()).filter(item => item !== "");
    let realPenalties = items.filter(item => item !== "통과!" && item !== "");
    if (realPenalties.length === 0) realPenalties.push("꽝!");

    let targetIndex = parseInt(secretTarget.value) - 1;

    if (!isNaN(targetIndex) && targetIndex >= 0 && targetIndex < TOTAL_ROUNDS) {
        // [저격 전술] 지정 자리에 실탄 배치 및 전후방 완전 공탄 격리 패치
        let luckyPick = realPenalties[Math.floor(Math.random() * realPenalties.length)];
        penalties[targetIndex] = luckyPick;
    } else {
        // [랜덤 밸런스 전술] 탄창 후반부 확률 가중치 배치 시스템
        let frontIndices = [];
        let backIndices = [];
        
        for (let i = 0; i < TOTAL_ROUNDS; i++) {
            if (i < 10) frontIndices.push(i);
            else backIndices.push(i);
        }

        for (let k = 0; k < realPenalties.length; k++) {
            let chosenSlot;
            if (backIndices.length > 0 && (Math.random() < 0.85 || frontIndices.length === 0)) {
                let randKey = Math.floor(Math.random() * backIndices.length);
                chosenSlot = backIndices.splice(randKey, 1);
            } else if (frontIndices.length > 0) {
                let randKey = Math.floor(Math.random() * frontIndices.length);
                chosenSlot = frontIndices.splice(randKey, 1);
            } else {
                break;
            }
            penalties[chosenSlot] = realPenalties[k];
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

// 메인 해머 격발 시스템
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

    // 💥 격발할 때마다 무조건 장착한 MP3 사운드 재생
    playSound(SHOOT_SOUND_PATH, 1.0);

    if (currentResult !== "통과!") {
        clearInterval(autoInterval); 
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
    statusText.innerText = "🔥 연사 개시!!";
    statusText.style.color = '#ff9f43';

    autoInterval = setInterval(() => {
        let isHit = pullTrigger();
        if (isHit) { 
            clearInterval(autoInterval); 
        }
    }, 150); // 0.15초 간격으로 드르륵 발사
}

function reloadMagazine() {
    // 🔄 재장전 버튼 누를 때 장전 MP3 사운드 재생
    playSound(RELOAD_SOUND_PATH, 1.0);
    
    statusText.innerText = "철컥, 탄창 분리 후 전술 재장전 중...";
    setTimeout(() => { initGame(); }, 300);
}

secretTarget.addEventListener('input', () => { if(currentShotCount === 0) initGame(); });
penaltyInput.addEventListener('change', () => { if(currentShotCount === 0) initGame(); });
window.onload = initGame;
