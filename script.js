const TOTAL_ROUNDS = 30;
let penalties = Array(TOTAL_ROUNDS).fill("통과!");
let currentShotCount = 0;
let isGameOver = false;
let autoInterval = null;

// 🎵 [사운드 파일 경로 전술 설정]
const SHOOT_SOUND_PATH = '1.mp3';  
const RELOAD_SOUND_PATH = '2.mp3'; 

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

// 🔊 [오디오 인스턴스 재생 시스템] 연사 시 오디오 밀림, 씹힘 방지형 재생 함수
function playSound(path) {
    try {
        const audio = new Audio(path);
        audio.preload = 'auto'; // 브라우저가 사전에 미디어를 메모리에 로드하도록 강제
        
        // 브라우저 자동재생 보안 정책 우회 및 에러 핸들링 트래킹
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("브라우저 보안으로 인해 사용자가 먼저 화면을 클릭해야 소리가 납니다:", error);
            });
        }
    } catch (e) {
        console.error("오디오 로드 에러:", e);
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
        let luckyPick = realPenalties[Math.floor(Math.random() * realPenalties.length)];
        penalties[targetIndex] = luckyPick;
    } else {
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

    // 💥 격발음 즉각 재생 가동
    playSound(SHOOT_SOUND_PATH);

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
    statusText.innerText = "🔥 드르르르르륵 연사 개시!!";
    statusText.style.color = '#ff9f43';

    autoInterval = setInterval(() => {
        let isHit = pullTrigger();
        if (isHit) { 
            clearInterval(autoInterval); 
        }
    }, 180); // 오디오 연사 연출 템포 싱크 조절을 위해 180ms로 약간 지연 최적화
}

function reloadMagazine() {
    // 🔄 전술 장전음 재생 가동
    playSound(RELOAD_SOUND_PATH);
    
    statusText.innerText = "철컥, 탄창 분리 후 전술 재장전 중...";
    setTimeout(() => { initGame(); }, 300);
}

secretTarget.addEventListener('input', () => { if(currentShotCount === 0) initGame(); });
penaltyInput.addEventListener('change', () => { if(currentShotCount === 0) initGame(); });
window.onload = initGame;
