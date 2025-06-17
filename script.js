// --- script.js (Phase 2 - Revision 2 - Full Code) ---

// --- Utility Functions (Define these FIRST) ---
function toggleModal(modalElement, show) {
    if (!modalElement) {
        return;
    }
    modalElement.classList.toggle('visible', show);
}

// --- GLOBAL CONFIGURATION & STATE ---
let currentQuizQuestions = []; 
let currentTestFlow = [];      
let currentView = 'home';
let currentModuleIndex = 0;
let currentQuestionNumber = 1; 
let userAnswers = {}; 
let isTimerHidden = false;
let isCrossOutToolActive = false;
let isHighlightingActive = false;
let questionStartTime = 0; 

const moduleMetadata = {
    "DT-T0-RW-M1": {
        name: "Reading & Writing - Module 1",
        type: "RW",
        directions: "The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s). All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.",
        // passageText: "<p>...</p>", // REMOVED - Assuming question_text in JSON contains all necessary passage/stimulus for RW
        spr_directions: null,
        spr_examples_table: null
    },
    "DT-T0-MT-M1": { 
        name: "Math - Module 1",
        type: "Math",
        directions: "The questions in this section address a number of important math skills. You may use the calculator for any question in this section. For student-produced response questions, additional directions are provided with the question.",
        passageText: null, // Math modules typically don't have overarching passages
        spr_directions: `<h3>Student-produced response directions</h3><ul><li>If you find <strong>more than one correct answer</strong>, enter only one answer.</li><li>You can enter up to 5 characters for a <strong>positive</strong> answer and up to 6 characters (including the negative sign) for a <strong>negative</strong> answer.</li><li>If your answer is a <strong>fraction</strong> that doesn’t fit in the provided space, enter the decimal equivalent.</li><li>If your answer is a <strong>decimal</strong> that doesn’t fit in the provided space, enter it by truncating or rounding at the fourth digit.</li><li>If your answer is a <strong>mixed number</strong> (such as 3 <span style="font-size: 0.7em; vertical-align: super;">1</span>/<span style="font-size: 0.7em; vertical-align: sub;">2</span>), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).</li><li>Don’t enter <strong>symbols</strong> such as a percent sign, comma, or dollar sign.</li></ul>`,
        spr_examples_table: `<table class="spr-examples-table"><thead><tr><th>Answer</th><th>Acceptable ways to enter answer</th><th>Unacceptable: will NOT receive credit</th></tr></thead><tbody><tr><td>3.5</td><td>3.5<br/>7/2</td><td>3 1/2</td></tr><tr><td>2/3</td><td>2/3<br/>.666<br/>.667</td><td>0.66<br/>0.67</td></tr><tr><td>-15</td><td>-15</td><td></td></tr></tbody></table>`
    }
};

const GITHUB_JSON_BASE_URL = 'https://raw.githubusercontent.com/ghiassabir/Bluebook-UI-UX-with-json-real-data-/main/data/json/'; 

async function loadQuizData(quizName) {
    const url = `${GITHUB_JSON_BASE_URL}${quizName}.json`;
    console.log(`Fetching quiz data from: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${quizName}.json`);
        }
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error(`Data for ${quizName}.json is not an array. Check JSON structure.`);
        }
        currentQuizQuestions = data;
        console.log(`Successfully loaded ${currentQuizQuestions.length} questions for quiz: ${quizName}`);
        // console.log(`currentQuizQuestions populated with ${currentQuizQuestions.length} items. First item:`, currentQuizQuestions.length > 0 ? currentQuizQuestions[0] : 'empty');
        return true;
    } catch (error) {
        console.error("Error loading quiz data:", error);
        alert(`Failed to load quiz data for ${quizName}: ${error.message}. Please check the console and ensure the JSON file is accessible and the GITHUB_JSON_BASE_URL is correct.`);
        currentQuizQuestions = []; 
        return false;
    }
}

// --- DOM Elements ---
const allAppViews = document.querySelectorAll('.app-view');
const homeViewEl = document.getElementById('home-view');
const testInterfaceViewEl = document.getElementById('test-interface-view');
const moduleOverViewEl = document.getElementById('module-over-view');
const finishedViewEl = document.getElementById('finished-view');
const reviewPageViewEl = document.getElementById('review-page-view');
const confettiCanvas = document.getElementById('confetti-canvas');
const startTestPreviewBtn = document.getElementById('start-test-preview-btn');
const returnToHomeBtn = document.getElementById('return-to-home-btn');
const reviewPageSectionName = document.getElementById('review-page-section-name');
const reviewPageQNavGrid = document.getElementById('review-page-qnav-grid');
const reviewDirectionsBtn = document.getElementById('review-directions-btn');
const reviewTimerText = document.getElementById('review-timer-text'); 
const reviewTimerClockIcon = document.getElementById('review-timer-clock-icon'); 
const reviewTimerToggleBtn = document.getElementById('review-timer-toggle-btn'); 
const reviewBackBtnFooter = document.getElementById('review-back-btn-footer');
const reviewNextBtnFooter = document.getElementById('review-next-btn-footer');
const appWrapper = document.querySelector('.app-wrapper'); 
const mainContentAreaDynamic = document.getElementById('main-content-area-dynamic');
const passagePane = document.getElementById('passage-pane');
const sprInstructionsPane = document.getElementById('spr-instructions-pane');
const sprInstructionsContent = document.getElementById('spr-instructions-content');
const paneDivider = document.getElementById('pane-divider-draggable');
const questionPane = document.getElementById('question-pane');
const highlightsNotesBtn = document.getElementById('highlights-notes-btn');
const calculatorBtnHeader = document.getElementById('calculator-btn');
const referenceBtnHeader = document.getElementById('reference-btn');
const answerArea = document.getElementById('answer-area');
const answerOptionsMainEl = document.getElementById('answer-options-main');
const sprInputContainerMain = document.getElementById('spr-input-container-main');
const sprInputFieldMain = document.getElementById('spr-input-field-main');
const sprAnswerPreviewMain = document.getElementById('spr-answer-preview-main');
const calculatorOverlay = document.getElementById('calculator-overlay-main');
const calculatorHeaderDraggable = document.getElementById('calculator-header-draggable');
const calculatorCloseBtn = document.getElementById('calculator-overlay-close-btn');
const referenceSheetPanel = document.getElementById('reference-sheet-panel-main');
const referenceSheetCloseBtn = document.getElementById('reference-sheet-close-btn');
const crossOutToolBtnMain = document.getElementById('cross-out-tool-btn-main');
const sectionTitleHeader = document.getElementById('section-title-header'); 
const passageContentEl = document.getElementById('passage-content');
const questionTextMainEl = document.getElementById('question-text-main'); // This is in the RIGHT pane
const questionNumberBoxMainEl = document.getElementById('question-number-box-main');
const markReviewCheckboxMain = document.getElementById('mark-review-checkbox-main');
const flagIconMain = document.getElementById('flag-icon-main');
const qNavBtnFooter = document.getElementById('qNavBtnFooter'); 
const currentQFooterEl = document.getElementById('current-q-footer'); 
const totalQFooterEl = document.getElementById('total-q-footer');
const backBtnFooter = document.getElementById('back-btn-footer');
const nextBtnFooter = document.getElementById('next-btn-footer');
const directionsBtn = document.getElementById('directions-btn'); 
const directionsModal = document.getElementById('directions-modal');
const directionsModalTitle = document.getElementById('directions-modal-title');
const directionsModalText = document.getElementById('directions-modal-text');
const directionsModalCloseBtn = document.getElementById('directions-modal-close-btn');
const qNavPopup = document.getElementById('qnav-popup');
const qNavTitle = document.getElementById('qnav-title');
const qNavGridMain = document.getElementById('qnav-grid-main');
const qNavCloseBtn = document.getElementById('qnav-close-btn');
const qNavGotoReviewBtn = document.getElementById('qnav-goto-review-btn');
const timerTextEl = document.getElementById('timer-text'); 
const timerClockIconEl = document.getElementById('timer-clock-icon');
const timerToggleBtn = document.getElementById('timer-toggle-btn');
const moreBtn = document.getElementById('more-btn'); 
const moreMenuDropdown = document.getElementById('more-menu-dropdown');
const moreUnscheduledBreakBtn = document.getElementById('more-unscheduled-break');
const moreExitExamBtn = document.getElementById('more-exit-exam');
const unscheduledBreakConfirmModal = document.getElementById('unscheduled-break-confirm-modal');
const understandLoseTimeCheckbox = document.getElementById('understand-lose-time-checkbox');
const unscheduledBreakConfirmBtn = document.getElementById('unscheduled-break-confirm-btn');
const unscheduledBreakCancelBtn = document.getElementById('unscheduled-break-cancel-btn');
const exitExamConfirmModal = document.getElementById('exit-exam-confirm-modal');
const exitExamConfirmBtn = document.getElementById('exit-exam-confirm-btn');
const exitExamCancelBtn = document.getElementById('exit-exam-cancel-btn');

// --- Helper Functions ---
function getCurrentModule() {
    if (currentTestFlow.length > 0 && currentModuleIndex < currentTestFlow.length) {
        const currentQuizName = currentTestFlow[currentModuleIndex];
        return moduleMetadata[currentQuizName] || null;
    }
    return null;
}

function getCurrentQuestionData() {
    if (currentQuizQuestions && currentQuizQuestions.length > 0 && currentQuestionNumber > 0 && currentQuestionNumber <= currentQuizQuestions.length) {
        return currentQuizQuestions[currentQuestionNumber - 1];
    }
    return null;
}

function getAnswerStateKey(moduleIdx = currentModuleIndex, qNum = currentQuestionNumber) {
    return `${moduleIdx}-${qNum}`;
}

function getAnswerState(moduleIdx = currentModuleIndex, qNum = currentQuestionNumber) {
    const key = getAnswerStateKey(moduleIdx, qNum);
    if (!userAnswers[key]) {
        userAnswers[key] = { selected: null, spr_answer: '', marked: false, crossedOut: [], timeSpent: 0 };
    }
    return userAnswers[key];
}

function populateQNavGrid() {
    if (!qNavGridMain || !qNavTitle) { console.error("QNav grid or title element not found for populating."); return; }
    qNavGridMain.innerHTML = '';
    
    const moduleInfo = getCurrentModule();
    if(!moduleInfo) {
        qNavTitle.textContent = "Questions";
        return;
    }
    qNavTitle.textContent = `Section ${currentModuleIndex + 1}: ${moduleInfo.name} Questions`;

    const totalQuestionsInModule = currentQuizQuestions.length;

    for (let i = 1; i <= totalQuestionsInModule; i++) {
        const qState = getAnswerState(currentModuleIndex, i);
        const questionDataForButton = currentQuizQuestions[i-1]; 
        
        const btn = document.createElement('button');
        btn.className = 'qnav-grid-btn';
        if (i === currentQuestionNumber) {
            btn.classList.add('current');
            btn.innerHTML = `<span class="q-num-current-dot"></span>`;
        } else {
            btn.textContent = i;
        }

        let isUnanswered = true; 
        if (questionDataForButton) { 
            if (questionDataForButton.question_type === 'student_produced_response') { 
                isUnanswered = !qState.spr_answer;
            } else { 
                isUnanswered = !qState.selected;
            }
        }

        if (isUnanswered && i !== currentQuestionNumber) btn.classList.add('unanswered');
        if (qState.marked) btn.innerHTML += `<span class="review-flag-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg></span>`;
        
        btn.dataset.question = i;
        btn.addEventListener('click', () => {
            recordTimeOnCurrentQuestion();
            currentQuestionNumber = i;
            isCrossOutToolActive = false; 
            isHighlightingActive = false; if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
            loadQuestion();
            toggleModal(qNavPopup, false);
        });
        qNavGridMain.appendChild(btn);
    }
}

function renderReviewPage() {
    if (!reviewPageViewEl || !reviewPageViewEl.classList.contains('active')) return;
    console.log("Rendering Review Page...");
    
    const moduleInfo = getCurrentModule();
    if(!moduleInfo) {
         if(reviewPageSectionName) reviewPageSectionName.textContent = "Section Review";
        return;
    }
    if(reviewPageSectionName) reviewPageSectionName.textContent = `Section ${currentModuleIndex + 1}: ${moduleInfo.name} Questions`;
    
    if(timerTextEl && reviewTimerText) reviewTimerText.textContent = timerTextEl.textContent;
    if(timerClockIconEl && reviewTimerClockIcon) reviewTimerClockIcon.className = timerClockIconEl.className;
    if(timerToggleBtn && reviewTimerToggleBtn) reviewTimerToggleBtn.textContent = timerToggleBtn.textContent;

    if(reviewPageQNavGrid) reviewPageQNavGrid.innerHTML = ''; else { console.error("Review page QNav grid not found."); return;}

    const totalQuestionsInModule = currentQuizQuestions.length;
    for (let i = 1; i <= totalQuestionsInModule; i++) {
        const qState = getAnswerState(currentModuleIndex, i);
        const qDataForBtn = currentQuizQuestions[i-1];
        const btn = document.createElement('button');
        btn.className = 'qnav-grid-btn';
        btn.textContent = i;

        let isUnanswered = true;
        if (qDataForBtn) {
            if (qDataForBtn.question_type === 'student_produced_response') {
                isUnanswered = !qState.spr_answer;
            } else {
                isUnanswered = !qState.selected;
            }
        }
        if (isUnanswered) btn.classList.add('unanswered');

        if (qState.marked) {
            btn.innerHTML += `<span class="review-flag-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg></span>`;
        }
        btn.addEventListener('click', () => {
            currentQuestionNumber = i; 
            showView('test-interface-view');
        });
        reviewPageQNavGrid.appendChild(btn);
    }
    updateNavigation_OLD(); 
}

let confettiAnimationId; 
const confettiParticles = []; 
function startConfetti() { 
    const canvas = confettiCanvas; if (!canvas) return;
    const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const colors = ["#facc15", "#ef4444", "#2563eb", "#10b981", "#ec4899"];
    class Particle { constructor(x, y) { this.x = x; this.y = y; this.size = Math.random() * 7 + 3; this.weight = Math.random() * 1.5 + 0.5; this.directionX = (Math.random() * 2 - 1) * 2; this.color = colors[Math.floor(Math.random() * colors.length)]; } update() { this.y += this.weight; this.x += this.directionX; if (this.y > canvas.height) { this.y = 0 - this.size; this.x = Math.random() * canvas.width; } if (this.x > canvas.width) { this.x = 0 - this.size; } if (this.x < 0 - this.size ) { this.x = canvas.width; } } draw() { ctx.fillStyle = this.color; ctx.beginPath(); ctx.rect(this.x, this.y, this.size, this.size * 1.5); ctx.closePath(); ctx.fill(); } }
    function initConfetti() { confettiParticles.length = 0; for (let i = 0; i < 150; i++) confettiParticles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height - canvas.height)); }
    function animateConfetti() { if(!finishedViewEl || !finishedViewEl.classList.contains('active')) return; ctx.clearRect(0,0,canvas.width, canvas.height); confettiParticles.forEach(p => { p.update(); p.draw(); }); confettiAnimationId = requestAnimationFrame(animateConfetti); }
    initConfetti(); animateConfetti();
}
function stopConfetti() { if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId); if (confettiCanvas && confettiCanvas.getContext('2d')) confettiCanvas.getContext('2d').clearRect(0,0,confettiCanvas.width, confettiCanvas.height); }

function handleTimerToggle(textEl, iconEl, btnEl) {
    if (!textEl || !iconEl || !btnEl) return;
    isTimerHidden = !isTimerHidden; 
    textEl.classList.toggle('hidden', isTimerHidden); 
    iconEl.classList.toggle('hidden', !isTimerHidden);
    btnEl.textContent = isTimerHidden ? '[Show]' : '[Hide]';
}

// --- View Management ---
function showView(viewId) {
    console.log("Switching to view:", viewId);
    currentView = viewId;
    allAppViews.forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.add('active');
    else { console.error("View not found:", viewId); return; }

    if (viewId === 'test-interface-view') {
        if(qNavBtnFooter) qNavBtnFooter.style.display = 'flex';
        if(backBtnFooter) backBtnFooter.style.display = 'inline-block';
        if(nextBtnFooter) nextBtnFooter.style.display = 'inline-block';
        loadQuestion();
    } else if (viewId === 'review-page-view') {
        if(qNavBtnFooter) qNavBtnFooter.style.display = 'none';
        renderReviewPage();
    } else if (viewId === 'finished-view') {
        startConfetti();
    } else if (viewId === 'home-view') {
        stopConfetti();
        currentTestFlow = [];
        currentQuizQuestions = [];
        currentModuleIndex = 0;
        currentQuestionNumber = 1;
        userAnswers = {};
    }
    updateNavigation_OLD();
}

// --- Core UI Update `loadQuestion()` ---
function loadQuestion() {
    if (!testInterfaceViewEl.classList.contains('active')) {
        return;
    }
    questionStartTime = Date.now(); 

    const currentModuleInfo = getCurrentModule(); 
    const currentQuestionDetails = getCurrentQuestionData(); 

    // console.log(`loadQuestion START: currentModuleIndex=${currentModuleIndex}, currentQuestionNumber=${currentQuestionNumber}`);
    // console.log(`loadQuestion START: currentModuleInfo:`, currentModuleInfo ? JSON.parse(JSON.stringify(currentModuleInfo)) : "null/undefined");
    // console.log(`loadQuestion START: currentQuestionDetails:`, currentQuestionDetails ? JSON.parse(JSON.stringify(currentQuestionDetails)) : "null/undefined");
    
    if (!currentModuleInfo || !currentQuestionDetails) {
        console.error("loadQuestion: ModuleInfo or Question data is null/undefined. Aborting question load.");
        if (questionTextMainEl) questionTextMainEl.innerHTML = "<p>Error: Critical data missing for question display.</p>";
        if (answerOptionsMainEl) answerOptionsMainEl.innerHTML = "";
        if(totalQFooterEl && currentQFooterEl) {
            currentQFooterEl.textContent = currentQuestionNumber;
            totalQFooterEl.textContent = currentQuizQuestions ? currentQuizQuestions.length : 0;
        }
        updateNavigation_OLD();
        return;
    }
    
    const answerState = getAnswerState(); 
    if (!answerState) { 
        console.error(`loadQuestion: getAnswerState() returned undefined. This should not happen.`);
        if (questionTextMainEl) questionTextMainEl.innerHTML = "<p>Error: Could not retrieve answer state.</p>";
        return; 
    }
    answerState.timeSpent = parseFloat(answerState.timeSpent) || 0;

    if(sectionTitleHeader) sectionTitleHeader.textContent = `Section ${currentModuleIndex + 1}: ${currentModuleInfo.name}`;
    if(questionNumberBoxMainEl) questionNumberBoxMainEl.textContent = currentQuestionDetails.question_number || currentQuestionNumber;
    
    const isMathTypeModule = currentModuleInfo.type === "Math";
    if(highlightsNotesBtn) highlightsNotesBtn.classList.toggle('hidden', isMathTypeModule);
    if(calculatorBtnHeader) calculatorBtnHeader.classList.toggle('hidden', !isMathTypeModule);
    if(referenceBtnHeader) referenceBtnHeader.classList.toggle('hidden', !isMathTypeModule);
    if(crossOutToolBtnMain) crossOutToolBtnMain.classList.toggle('hidden', currentQuestionDetails.question_type === 'student_produced_response');

    if(markReviewCheckboxMain) markReviewCheckboxMain.checked = answerState.marked;
    if(flagIconMain) {
        flagIconMain.style.fill = answerState.marked ? 'var(--bluebook-red-flag)' : 'none';
        flagIconMain.style.color = answerState.marked ? 'var(--bluebook-red-flag)' : '#9ca3af';
    }

    if(mainContentAreaDynamic) mainContentAreaDynamic.classList.toggle('cross-out-active', isCrossOutToolActive && currentQuestionDetails.question_type !== 'student_produced_response');
    if(crossOutToolBtnMain) crossOutToolBtnMain.classList.toggle('active', isCrossOutToolActive && currentQuestionDetails.question_type !== 'student_produced_response');

    // Reset panes and content areas initially
    passagePane.style.display = 'none';
    if (passageContentEl) passageContentEl.innerHTML = ''; 
    sprInstructionsPane.style.display = 'none';
    if (sprInstructionsContent) sprInstructionsContent.innerHTML = ''; 
    if (questionTextMainEl) questionTextMainEl.innerHTML = ''; 
    if (answerOptionsMainEl) answerOptionsMainEl.innerHTML = ''; 
    paneDivider.style.display = 'none';
    mainContentAreaDynamic.classList.remove('single-pane');
    answerOptionsMainEl.style.display = 'none'; 
    sprInputContainerMain.style.display = 'none'; 


    if (currentQuestionDetails.question_type === 'student_produced_response') {
        // SPR Question: Instructions Left, Question & Input Right
        mainContentAreaDynamic.classList.remove('single-pane');
        sprInstructionsPane.style.display = 'flex';
        passagePane.style.display = 'none'; 
        paneDivider.style.display = 'block';
        if(sprInstructionsContent) sprInstructionsContent.innerHTML = (currentModuleInfo.spr_directions || 'SPR Directions Missing') + (currentModuleInfo.spr_examples_table || '');
        
        if(questionTextMainEl) questionTextMainEl.innerHTML = currentQuestionDetails.question_text || '<p>Question text missing.</p>';
        sprInputContainerMain.style.display = 'block';
        if(sprInputFieldMain) sprInputFieldMain.value = answerState.spr_answer || '';
        if(sprAnswerPreviewMain) sprAnswerPreviewMain.textContent = `Answer Preview: ${answerState.spr_answer || ''}`;
        answerOptionsMainEl.style.display = 'none';

    } else if (currentModuleInfo.type === "RW" && currentQuestionDetails.question_type.includes('multiple_choice')) {
        // Reading & Writing MCQ: Question Text (which includes passage) Left, Options Right
        mainContentAreaDynamic.classList.remove('single-pane');
        passagePane.style.display = 'flex'; // Show left pane for question_text
        paneDivider.style.display = 'block'; // Show divider
        
        if(passageContentEl) passageContentEl.innerHTML = currentQuestionDetails.question_text || '<p>Question text missing.</p>';

        if(questionTextMainEl) questionTextMainEl.innerHTML = ''; // Clear question text from right pane as it's on left
        answerOptionsMainEl.style.display = 'flex'; // Options will be in the right pane
        sprInputContainerMain.style.display = 'none';

    } else { // Math MCQs or other types that default to single-pane
        mainContentAreaDynamic.classList.add('single-pane');
        passagePane.style.display = 'none';
        sprInstructionsPane.style.display = 'none';
        paneDivider.style.display = 'none';

        if(questionTextMainEl) questionTextMainEl.innerHTML = currentQuestionDetails.question_text || '<p>Question text missing.</p>';
        answerOptionsMainEl.style.display = 'flex'; 
        sprInputContainerMain.style.display = 'none';
    }

    // Render MCQ Options if applicable
    if (currentQuestionDetails.question_type && currentQuestionDetails.question_type.includes('multiple_choice')) {
        // answerOptionsMainEl was already targeted and set to display:flex or display:none above.
        // Ensure it's cleared if we are re-populating:
        if (answerOptionsMainEl) answerOptionsMainEl.innerHTML = ''; 
        
        const options = {};
        if (currentQuestionDetails.option_a !== undefined && currentQuestionDetails.option_a !== null) options['A'] = currentQuestionDetails.option_a;
        if (currentQuestionDetails.option_b !== undefined && currentQuestionDetails.option_b !== null) options['B'] = currentQuestionDetails.option_b;
        if (currentQuestionDetails.option_c !== undefined && currentQuestionDetails.option_c !== null) options['C'] = currentQuestionDetails.option_c;
        if (currentQuestionDetails.option_d !== undefined && currentQuestionDetails.option_d !== null) options['D'] = currentQuestionDetails.option_d;
        if (currentQuestionDetails.option_e !== undefined && currentQuestionDetails.option_e !== null && String(currentQuestionDetails.option_e).trim() !== "") options['E'] = currentQuestionDetails.option_e;

        for (const [key, value] of Object.entries(options)) {
            const isSelected = answerState.selected === key;
            const isCrossedOut = answerState.crossedOut.includes(key);
            
            const containerDiv = document.createElement('div');
            containerDiv.className = 'answer-option-container';
            containerDiv.dataset.optionKey = key;

            const optionDiv = document.createElement('div');
            optionDiv.className = 'answer-option';
            if (isSelected && !isCrossedOut) optionDiv.classList.add('selected');
            if (isCrossedOut) optionDiv.classList.add('crossed-out');
            
            const answerLetterDiv = document.createElement('div');
            answerLetterDiv.className = 'answer-letter';
            if (isSelected && !isCrossedOut) answerLetterDiv.classList.add('selected');
            answerLetterDiv.textContent = key;

            const answerTextSpan = document.createElement('span');
            answerTextSpan.className = 'answer-text';
            if (isCrossedOut) answerTextSpan.classList.add('text-dimmed-for-crossout');
            answerTextSpan.innerHTML = value; 

            optionDiv.appendChild(answerLetterDiv);
            optionDiv.appendChild(answerTextSpan);
            containerDiv.appendChild(optionDiv);

            if (isCrossOutToolActive && !isCrossedOut) {
                const crossOutBtnIndividual = document.createElement('button');
                crossOutBtnIndividual.className = 'individual-cross-out-btn';
                crossOutBtnIndividual.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
                crossOutBtnIndividual.title = `Cross out option ${key}`;
                crossOutBtnIndividual.dataset.action = 'cross-out-individual';
                containerDiv.appendChild(crossOutBtnIndividual);
            } else if (isCrossedOut) {
                const undoBtn = document.createElement('button');
                undoBtn.className = 'undo-cross-out-btn';
                undoBtn.textContent = 'Undo';
                undoBtn.title = `Undo cross out for option ${key}`;
                undoBtn.dataset.action = 'undo-cross-out';
                containerDiv.appendChild(undoBtn);
            }
            if (answerOptionsMainEl) answerOptionsMainEl.appendChild(containerDiv);
        }
    }
    
    if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
        // console.log("Calling MathJax.typesetPromise for main content area (Phase 2.2)");
        MathJax.typesetPromise([passageContentEl, questionTextMainEl, answerOptionsMainEl, sprInstructionsContent]).catch(function (err) {
            console.error('MathJax Typesetting Error:', err);
        });
    } else {
        console.warn("MathJax or MathJax.typesetPromise not available.");
    }
    updateNavigation_OLD();
}

function recordTimeOnCurrentQuestion() {
    if (questionStartTime > 0 && currentQuizQuestions.length > 0 && currentQuestionNumber <= currentQuizQuestions.length) {
        const endTime = Date.now();
        const timeSpentSeconds = (endTime - questionStartTime) / 1000;
        const answerState = getAnswerState(); 
        if (answerState) { 
            answerState.timeSpent = (parseFloat(answerState.timeSpent) || 0) + timeSpentSeconds;
        }
    }
    questionStartTime = 0; 
}

// --- Event Listeners ---
if(answerOptionsMainEl) answerOptionsMainEl.addEventListener('click', function(event) {
    const target = event.target;
    const answerContainer = target.closest('.answer-option-container');
    if (!answerContainer) return;
    const optionKey = answerContainer.dataset.optionKey;
    const action = target.dataset.action || (target.closest('[data-action]') ? target.closest('[data-action]').dataset.action : null);
    
    if (action !== 'cross-out-individual' && action !== 'undo-cross-out' && target.closest('.answer-option')) {
        recordTimeOnCurrentQuestion(); 
    }

    if (action === 'cross-out-individual') handleAnswerCrossOut(optionKey);
    else if (action === 'undo-cross-out') handleAnswerUndoCrossOut(optionKey);
    else if (target.closest('.answer-option')) handleAnswerSelect(optionKey);
});

function handleAnswerSelect(optionKey) {
    const answerState = getAnswerState();
    if (!answerState || answerState.crossedOut.includes(optionKey) || isCrossOutToolActive) {
        return;
    }
    answerState.selected = optionKey;
    loadQuestion(); 
}
function handleAnswerCrossOut(optionKey) {
     const answerState = getAnswerState();
     if (!answerState) return;
     if (!answerState.crossedOut.includes(optionKey)) {
         answerState.crossedOut.push(optionKey);
         if (answerState.selected === optionKey) answerState.selected = null; 
         loadQuestion();
     }
}
function handleAnswerUndoCrossOut(optionKey) {
     const answerState = getAnswerState();
     if (!answerState) return;
     answerState.crossedOut = answerState.crossedOut.filter(opt => opt !== optionKey);
     loadQuestion();
}

if(crossOutToolBtnMain) crossOutToolBtnMain.addEventListener('click', () => {
    const currentQData = getCurrentQuestionData();
    if (currentQData && currentQData.question_type === 'student_produced_response') return;
    isCrossOutToolActive = !isCrossOutToolActive;
    loadQuestion();
});
if(sprInputFieldMain) sprInputFieldMain.addEventListener('input', (event) => {
    const answerState = getAnswerState();
    if (!answerState) return;
    answerState.spr_answer = event.target.value;
    if(sprAnswerPreviewMain) sprAnswerPreviewMain.textContent = `Answer Preview: ${event.target.value}`;
    recordTimeOnCurrentQuestion(); 
});

function updateNavigation_OLD() { // Renamed to avoid conflict with future full updateNavigation
    if (!getCurrentModule() || !currentQuizQuestions || currentQuizQuestions.length === 0 ) { 
        if(backBtnFooter) backBtnFooter.disabled = true;
        if(nextBtnFooter) nextBtnFooter.disabled = true;
        if(currentQFooterEl) currentQFooterEl.textContent = '0';
        if(totalQFooterEl) totalQFooterEl.textContent = '0';
        return;
    }

    const totalQuestionsInModule = currentQuizQuestions.length;

    if(currentQFooterEl) currentQFooterEl.textContent = currentQuestionNumber;
    if(totalQFooterEl) totalQFooterEl.textContent = totalQuestionsInModule;

    if(backBtnFooter) backBtnFooter.disabled = (currentQuestionNumber === 1);
    
    if(nextBtnFooter) {
        if (currentView === 'test-interface-view') {
            nextBtnFooter.textContent = (currentQuestionNumber === totalQuestionsInModule) ? "Review Section" : "Next";
            nextBtnFooter.disabled = false;
        } else if (currentView === 'review-page-view') {
            nextBtnFooter.textContent = (currentModuleIndex === currentTestFlow.length - 1) ? "Finish Test" : "Next Module";
            nextBtnFooter.disabled = false;
        }
    }
}

if(nextBtnFooter) nextBtnFooter.addEventListener('click', () => {
    recordTimeOnCurrentQuestion(); 
    const totalQuestionsInModule = currentQuizQuestions.length;

    if (currentView === 'review-page-view') {
        currentModuleIndex++;
        if (currentModuleIndex < currentTestFlow.length) {
            showView('module-over-view'); 
            setTimeout(async () => {
                currentQuestionNumber = 1;
                const success = await loadQuizData(currentTestFlow[currentModuleIndex]);
                if(success) showView('test-interface-view');
                else showView('home-view');
            }, 1500);
        } else {
            showView('finished-view');
        }
    } else if (currentQuestionNumber < totalQuestionsInModule) {
        currentQuestionNumber++;
        isCrossOutToolActive = false; isHighlightingActive = false; if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
        loadQuestion();
    } else if (currentQuestionNumber === totalQuestionsInModule) {
        showView('review-page-view');
    }
});
if(backBtnFooter) backBtnFooter.addEventListener('click', () => {
    recordTimeOnCurrentQuestion(); 
    if (currentQuestionNumber > 1) {
        currentQuestionNumber--;
        isCrossOutToolActive = false; isHighlightingActive = false; if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
        loadQuestion();
    }
});

if(reviewDirectionsBtn) reviewDirectionsBtn.addEventListener('click', () => {
    const moduleInfo = getCurrentModule();
    if(moduleInfo && directionsModalTitle) directionsModalTitle.textContent = `Section ${currentModuleIndex + 1}: ${moduleInfo.name} Directions`;
    if(moduleInfo && directionsModalText) directionsModalText.innerHTML = moduleInfo.directions || "General directions";
    toggleModal(directionsModal, true);
});
if(reviewTimerToggleBtn && reviewTimerText && reviewTimerClockIcon) reviewTimerToggleBtn.addEventListener('click', () => handleTimerToggle(reviewTimerText, reviewTimerClockIcon, reviewTimerToggleBtn));
if(reviewBackBtnFooter) reviewBackBtnFooter.addEventListener('click', () => showView('test-interface-view') );

if(startTestPreviewBtn) {
    startTestPreviewBtn.addEventListener('click', async () => {
        console.log("Start Test Preview button clicked.");
        currentModuleIndex = 0;
        currentQuestionNumber = 1;
        userAnswers = {};
        isTimerHidden = false;
        isCrossOutToolActive = false;
        isHighlightingActive = false;
        questionStartTime = 0; 
        if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
        if(calculatorOverlay) calculatorOverlay.classList.remove('visible');
        if(referenceSheetPanel) referenceSheetPanel.classList.remove('visible');

        currentTestFlow = ["DT-T0-RW-M1", "DT-T0-MT-M1"]; 

        if (currentTestFlow.length > 0) {
            const firstQuizName = currentTestFlow[currentModuleIndex];
            startTestPreviewBtn.textContent = "Loading...";
            startTestPreviewBtn.disabled = true;
            const success = await loadQuizData(firstQuizName);
            startTestPreviewBtn.textContent = "Start";
            startTestPreviewBtn.disabled = false;

            if (success && currentQuizQuestions.length > 0) {
                showView('test-interface-view');
            } else {
                console.error("Failed to load initial quiz data or no questions found.");
                alert("Could not start the test. Please check the console for errors.");
                showView('home-view');
            }
        } else {
            console.error("Test flow is empty. Cannot start test.");
            alert("No test configured to start.");
        }
    });
}
if(returnToHomeBtn) returnToHomeBtn.addEventListener('click', () => showView('home-view'));

if(calculatorBtnHeader) calculatorBtnHeader.addEventListener('click', () => toggleModal(calculatorOverlay, true));
if(calculatorCloseBtn) calculatorCloseBtn.addEventListener('click', () => toggleModal(calculatorOverlay, false));
if(referenceBtnHeader) referenceBtnHeader.addEventListener('click', () => toggleModal(referenceSheetPanel, true));
if(referenceSheetCloseBtn) referenceSheetCloseBtn.addEventListener('click', () => toggleModal(referenceSheetPanel, false));

let isCalcDragging = false; let currentX_calc_drag, currentY_calc_drag, initialX_calc_drag, initialY_calc_drag, xOffset_calc_drag = 0, yOffset_calc_drag = 0;
if(calculatorHeaderDraggable) {
    calculatorHeaderDraggable.addEventListener('mousedown', (e) => { initialX_calc_drag = e.clientX - xOffset_calc_drag; initialY_calc_drag = e.clientY - yOffset_calc_drag; if (e.target === calculatorHeaderDraggable || e.target.tagName === 'STRONG') isCalcDragging = true; });
    document.addEventListener('mousemove', (e) => { if (isCalcDragging) { e.preventDefault(); currentX_calc_drag = e.clientX - initialX_calc_drag; currentY_calc_drag = e.clientY - initialY_calc_drag; xOffset_calc_drag = currentX_calc_drag; yOffset_calc_drag = currentY_calc_drag; if(calculatorOverlay) calculatorOverlay.style.transform = `translate3d(${currentX_calc_drag}px, ${currentY_calc_drag}px, 0)`;} });
    document.addEventListener('mouseup', () => isCalcDragging = false );
}

if(highlightsNotesBtn && passageContentEl) { 
    highlightsNotesBtn.addEventListener('click', () => {
        isHighlightingActive = !isHighlightingActive;
        highlightsNotesBtn.classList.toggle('active', isHighlightingActive);
        if (isHighlightingActive) {
            document.addEventListener('mouseup', handleTextSelection); // Listen on document for broader selection
            if(mainContentAreaDynamic) mainContentAreaDynamic.classList.add('highlight-active'); 
        } else {
            document.removeEventListener('mouseup', handleTextSelection);
            if(mainContentAreaDynamic) mainContentAreaDynamic.classList.remove('highlight-active'); 
        }
    });
}
function handleTextSelection() {
    if (!isHighlightingActive) return;
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;
    
    const range = selection.getRangeAt(0);
    // Check if selection is within passagePane or questionPane's questionTextMainEl
    const isWithinPassage = passagePane && passagePane.style.display !== 'none' && passagePane.contains(range.commonAncestorContainer);
    const isWithinQuestionText = questionTextMainEl && questionTextMainEl.contains(range.commonAncestorContainer);

    if (!isWithinPassage && !isWithinQuestionText) return;

    const span = document.createElement('span');
    span.className = 'text-highlight';
    try {
        range.surroundContents(span);
    } catch (e) { 
        span.appendChild(range.extractContents());
        range.insertNode(span);
        console.warn("Highlighting across complex nodes, used extract/insert fallback.", e);
    }
    selection.removeAllRanges();
}

if(directionsBtn) directionsBtn.addEventListener('click', () => {
    const moduleInfo = getCurrentModule();
    if(moduleInfo && directionsModalTitle) directionsModalTitle.textContent = `Section ${currentModuleIndex + 1}: ${moduleInfo.name} Directions`;
    if(moduleInfo && directionsModalText) directionsModalText.innerHTML = moduleInfo.directions || "General directions";
    toggleModal(directionsModal, true);
});
if(directionsModalCloseBtn) directionsModalCloseBtn.addEventListener('click', () => toggleModal(directionsModal, false));
if(directionsModal) directionsModal.addEventListener('click', (e) => { if (e.target === directionsModal) toggleModal(directionsModal, false); });

if(qNavBtnFooter) qNavBtnFooter.addEventListener('click', () => { populateQNavGrid(); toggleModal(qNavPopup, true); });
if(qNavCloseBtn) qNavCloseBtn.addEventListener('click', () => toggleModal(qNavPopup, false));
if(qNavGotoReviewBtn) qNavGotoReviewBtn.addEventListener('click', () => { toggleModal(qNavPopup, false); showView('review-page-view'); });

if(markReviewCheckboxMain) markReviewCheckboxMain.addEventListener('change', () => {
    const answerState = getAnswerState();
    if (!answerState) return;
    answerState.marked = markReviewCheckboxMain.checked;
    if(flagIconMain) {
        flagIconMain.style.fill = answerState.marked ? 'var(--bluebook-red-flag)' : 'none';
        flagIconMain.style.color = answerState.marked ? 'var(--bluebook-red-flag)' : '#9ca3af';
    }
});

if(timerToggleBtn) timerToggleBtn.addEventListener('click', () => handleTimerToggle(timerTextEl, timerClockIconEl, timerToggleBtn));
if(reviewTimerToggleBtn && reviewTimerText && reviewTimerClockIcon) reviewTimerToggleBtn.addEventListener('click', () => handleTimerToggle(reviewTimerText, reviewTimerClockIcon, reviewTimerToggleBtn));

if(moreBtn) moreBtn.addEventListener('click', (e) => { e.stopPropagation(); if(moreMenuDropdown) moreMenuDropdown.classList.toggle('visible'); });
document.body.addEventListener('click', (e) => { if (moreMenuDropdown && moreBtn && !moreBtn.contains(e.target) && !moreMenuDropdown.contains(e.target) && moreMenuDropdown.classList.contains('visible')) moreMenuDropdown.classList.remove('visible'); });
if(moreMenuDropdown) moreMenuDropdown.addEventListener('click', (e) => e.stopPropagation());

if(moreUnscheduledBreakBtn) moreUnscheduledBreakBtn.addEventListener('click', () => { toggleModal(unscheduledBreakConfirmModal, true); if(moreMenuDropdown) moreMenuDropdown.classList.remove('visible'); if(understandLoseTimeCheckbox) understandLoseTimeCheckbox.checked = false; if(unscheduledBreakConfirmBtn) unscheduledBreakConfirmBtn.disabled = true; });
if(understandLoseTimeCheckbox) understandLoseTimeCheckbox.addEventListener('change', () => { if(unscheduledBreakConfirmBtn) unscheduledBreakConfirmBtn.disabled = !understandLoseTimeCheckbox.checked; });
if(unscheduledBreakCancelBtn) unscheduledBreakCancelBtn.addEventListener('click', () => toggleModal(unscheduledBreakConfirmModal, false));
if(unscheduledBreakConfirmBtn) unscheduledBreakConfirmBtn.addEventListener('click', () => { alert("Unscheduled Break screen: Future"); toggleModal(unscheduledBreakConfirmModal, false); });

if(moreExitExamBtn) moreExitExamBtn.addEventListener('click', () => { toggleModal(exitExamConfirmModal, true); if(moreMenuDropdown) moreMenuDropdown.classList.remove('visible'); });
if(exitExamCancelBtn) exitExamCancelBtn.addEventListener('click', () => toggleModal(exitExamConfirmModal, false));
if(exitExamConfirmBtn) exitExamConfirmBtn.addEventListener('click', () => { toggleModal(exitExamConfirmModal, false); showView('home-view'); });
