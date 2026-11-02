// 전역 SCAR-H 무기 시스템 변수
const TOTAL_ROUNDS = 30;
let penalties = [];
let currentShotCount = 0;
let isGameOver = false;

// DOM 인프라 탐색
const magFeed = document.getElementById('magFeed');
const penaltyInput = document.getElementById('penaltyInput');
const resultText = document.getElementById('resultText');
const statusText = document.getElementById('statusText');
const bulletCounter = document.getElementById('bulletCounter');
const mainContainer = document.getElementById('mainContainer');
const reloadBtn = document.getElementById('reloadBtn');
const shootBtn = document.getElementById('shootBtn');

// 30발 탄창 초기 세팅 시스템
function initGame() {
    // 1. 사용자 입력 파싱
    let items = penaltyInput.value.split(',').map(item => item.trim()).filter(item => item !== "");
    
    // 30발을 채우기 위한 자동 백업 배열 공급 기믹
    penalties = [...items];
    if (penalties.length === 0) penalties.push("꽝!");
    
    // 30칸이 꽉 찰 때까지 기존 패턴 반복 채우기
    let baseItems = [...penalties];
    while(penalties.length < TOTAL_ROUNDS) {
        penalties = penalties.concat(baseItems);
    }
    // 정확히 30발 스펙으로 커팅
    penalties = penalties.slice(0, TOTAL_ROUNDS);

    // 2. 피셔-예이츠 알고리즘으로 30발 내부 무작위 실탄 셔플
    for (let i = penalties.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [penalties[i], penalties[j]] = [penalties[j], penalties[i]];
    }

    // 3. UI 및 노리쇠 후퇴 고정 리셋
    currentShotCount = 0;
    isGameOver = false;
    resultText.innerText = "";
    statusText.innerText = "조정간 단발. 사격 준비 완료.";
    statusText.style.color = "#ccc";
    bulletCounter.innerText = `MAG: 30 / 30 ROUNDS`;
    reloadBtn.classList.remove('active');
    shootBtn.disabled = false;

    // 탄창 컨테이너 내부 총알 30개 동적 빌드
    magFeed.innerHTML = "";
    for(let i = 0; i < TOTAL_ROUNDS; i++) {
        let node = document.createElement('div');
        node.className = "bullet-node";
        magFeed.appendChild(node);
    }
}

// 트리거 해머 격발 제어 메커니즘
function pullTrigger() {
    if (isGameOver) return;

    // 30발 전량 소모 시 락아웃
    if (currentShotCount >= TOTAL_ROUNDS) {
        statusText.innerText = "체임버 개방, 탄창 고갈! 재장전이 시급합니다.";
        statusText.style.color = 'var(--accent-color)';
        return;
    }

    // 전술 반동 임팩트 이펙트 부여
    mainContainer.classList.add('recoil-effect');
    setTimeout(() => {
        mainContainer.classList.remove('recoil-effect');
    }, 200);

    // 현재 사격하는 총알의 인덱스 추출 및 그래픽 파괴 연출
    let nodes = document.querySelectorAll('.bullet-node');
    // 위에서부터 순서대로 지워지도록 인덱스 맵핑
    nodes[currentShotCount].classList.add('spent');

    let currentResult = penalties[currentShotCount];
    currentShotCount++;
    bulletCounter.innerText = `MAG: ${TOTAL_ROUNDS - currentShotCount} / 30 ROUNDS`;

    // 당첨 판정 조건 처리 (입력한 항목 중 '통과!'나 빈칸이 아니면 탄두 격발 처리)
    if (currentResult !== "통과!" && currentResult !== "") {
        isGameOver = true;
        shootBtn.disabled = true;
        statusText.innerText = "🚨 TARGET HIT! 전술 패배 (벌칙 당첨) 🚨";
        statusText.style.color = 'var(--accent-color)';
        
        resultText.innerText = `💥 타당! [${currentResult}]`;
        resultText.style.color = 'var(--accent-color)';
        
        reloadBtn.classList.add('active');
    } else {
        // 불발(안전하게 생존) 처리
        statusText.innerText = "툭... 격침음 없음. 다음 사수 준비.";
        statusText.style.color = 'var(--safe-color)';
        resultText.innerText = "SAFE 🟢";
        resultText.style.color = 'var(--safe-color)';

        // 30발 완전 격발 생존 시 유도 루프
        if (currentShotCount === TOTAL_ROUNDS) {
            statusText.innerText = "작전 성공! 30발 탄창을 완벽히 비워냈습니다.";
            reloadBtn.classList.add('active');
        }
    }
}

// 탄창 교체(전술 재장전) 트랙
function reloadMagazine() {
    statusText.innerText = "철컥, 탄창 제거 후 신형 30Rnd 탄창 삽입 중...";
    setTimeout(() => {
        initGame();
    }, 300);
}

// 입력 폼 제어 이벤트 리스너
penaltyInput.addEventListener('change', () => {
    if(currentShotCount === 0) initGame();
});

// 시스템 런처 오프닝 가동
window.onload = initGame;
