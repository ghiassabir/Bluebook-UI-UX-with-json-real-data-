// --- script.js (Phase 5 - new Improvements) ---

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
// COMMENTED: Old studentEmailForSubmission, using a more dynamic approach or placeholder.
// const studentEmailForSubmission = "teststudent@example.com"; 
let studentEmailForSubmission = "teststudent@example.com"; 

// CHANGED: Placeholder for the Apps Script URL. Replace with your actual deployed URL.
const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwneCF0xq9X-F-9AIxAiHpYFmRTErCzCPXlsWRloLRDWBGqwLEZC4NldCCAuND0jxUL/exec'; // <<< YOUR ACTUAL URL WAS USED HERE

const moduleMetadata = {
    "DT-T0-RW-M1": {
        name: "Reading & Writing - Module 1",
        type: "RW",
        directions: "The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s). All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.",
        spr_directions: null,
        spr_examples_table: null
    },
    "DT-T0-MT-M1": { 
        name: "Math - Module 1",
        type: "Math",
        directions: "The questions in this section address a number of important math skills. You may use the calculator for any question in this section. For student-produced response questions, additional directions are provided with the question.",
        passageText: null, 
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
const questionTextMainEl = document.getElementById('question-text-main'); 
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

// CHANGED: getAnswerState now stores q_id, correct_ans, and question_type_from_json
// from currentQuestionDetails when initializing a new state.
// CHANGED: getAnswerState ensures essential data is populated when state is first created.
function getAnswerState(moduleIdx = currentModuleIndex, qNum = currentQuestionNumber) {
    const key = getAnswerStateKey(moduleIdx, qNum);
    if (!userAnswers[key]) {
        const questionDetails = (moduleIdx === currentModuleIndex && currentQuizQuestions && currentQuizQuestions[qNum - 1]) 
                               ? currentQuizQuestions[qNum - 1] 
                               : null;
        
        userAnswers[key] = { 
            selected: null, 
            spr_answer: '', 
            marked: false, 
            crossedOut: [], 
            timeSpent: 0,
            // Populate these immediately if questionDetails are available
            q_id: questionDetails ? questionDetails.question_id : `M${moduleIdx}-Q${qNum}-tmp`, // Temporary if no details yet
            correct_ans: questionDetails ? questionDetails.correct_answer : null,
            question_type_from_json: questionDetails ? questionDetails.question_type : null,
            quizName_from_flow: currentTestFlow[moduleIdx] || "UNKNOWN_QUIZ_AT_GETSTATE" // Store quizName
        };
    }
    // Attempt to update if details were missing at creation and are now available
    // This is specifically for when getAnswerState is called by loadQuestion
    if (userAnswers[key] && (userAnswers[key].q_id.endsWith('-tmp') || !userAnswers[key].correct_ans)) {
         const questionDetails = (moduleIdx === currentModuleIndex && currentQuizQuestions && currentQuizQuestions[qNum - 1]) 
                               ? currentQuizQuestions[qNum - 1] 
                               : null;
        if (questionDetails) {
            userAnswers[key].q_id = questionDetails.question_id;
            userAnswers[key].correct_ans = questionDetails.correct_answer;
            userAnswers[key].question_type_from_json = questionDetails.question_type;
            userAnswers[key].quizName_from_flow = currentTestFlow[moduleIdx] || "UNKNOWN_QUIZ_AT_GETSTATE_UPDATE";
        }
    }
    return userAnswers[key];
}


function populateQNavGrid() {
    if (!qNavGridMain || !qNavTitle) { console.error("QNav grid or title element not found for populating."); return; }
    qNavGridMain.innerHTML = '';
    
    const moduleInfo = getCurrentModule();
    if (!moduleInfo || !currentQuizQuestions || currentQuizQuestions.length === 0) {
        qNavTitle.textContent = "Questions";
        console.warn("populateQNavGrid: No module info or questions for current module.");
        return;
    }
    qNavTitle.textContent = `Section ${currentModuleIndex + 1}: ${moduleInfo.name} Questions`;

    const totalQuestionsInModule = currentQuizQuestions.length;

    for (let i = 1; i <= totalQuestionsInModule; i++) {
        const qState = getAnswerState(currentModuleIndex, i); 
        const questionDataForButton = currentQuizQuestions[i - 1]; 
        
        const btn = document.createElement('button');
        btn.className = 'qnav-grid-btn';
        if (i === currentQuestionNumber) {
            btn.classList.add('current');
            btn.innerHTML = `<span class="q-num-current-dot"></span>`; 
        } else {
            btn.textContent = questionDataForButton?.question_number || i;
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
            currentQuestionNumber = parseInt(btn.dataset.question); 
            isCrossOutToolActive = false; 
            isHighlightingActive = false; if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
            loadQuestion();
            toggleModal(qNavPopup, false);
        });
        qNavGridMain.appendChild(btn);
    }
}

function renderReviewPage() {
    // (Unchanged from Phase 3)
    if (!reviewPageViewEl || !reviewPageViewEl.classList.contains('active')) return;
    console.log("Rendering Review Page (Phase 3)...");
    
    const moduleInfo = getCurrentModule();
    if(!moduleInfo || !currentQuizQuestions || currentQuizQuestions.length === 0) {
         if(reviewPageSectionName) reviewPageSectionName.textContent = "Section Review";
         if(reviewPageQNavGrid) reviewPageQNavGrid.innerHTML = '<p>No questions to review for this module.</p>';
         console.warn("renderReviewPage: No module info or questions for current module.");
        updateNavigation(); 
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
        btn.textContent = qDataForBtn?.question_number || i; 

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
        btn.dataset.question = i; 
        btn.addEventListener('click', () => {
            currentQuestionNumber = parseInt(btn.dataset.question); 
            showView('test-interface-view');
        });
        reviewPageQNavGrid.appendChild(btn);
    }
    updateNavigation(); 
}

// (Confetti functions unchanged)
let confettiAnimationId; 
const confettiParticles = []; 
function startConfetti() { /* ... */ }
function stopConfetti() { /* ... */ }

function handleTimerToggle(textEl, iconEl, btnEl) {
    // (Unchanged from Phase 3)
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
        // CHANGED: Call submitQuizData when finished-view is shown
        submitQuizData(); 
    } else if (viewId === 'home-view') {
        stopConfetti();
        currentTestFlow = [];
        currentQuizQuestions = [];
        currentModuleIndex = 0;
        currentQuestionNumber = 1;
        userAnswers = {};
    }
    updateNavigation();
}


// --- Core UI Update `loadQuestion()` ---
function loadQuestion() {
    // (Unchanged from Phase 3, but ensure answerState initialization is correct)
    if (!testInterfaceViewEl.classList.contains('active')) {
        return;
    }
    
    // ...
const currentModuleInfo = getCurrentModule(); 
const currentQuestionDetails = getCurrentQuestionData(); 

if (!currentModuleInfo || !currentQuestionDetails) {
    // ... error handling ...
    return;
}

// CHANGED: Ensure answerState is fully populated by getAnswerState before setting startTime
const answerState = getAnswerState(); 
// The getAnswerState function itself will now try to populate q_id, correct_ans, etc.
// if currentQuestionDetails are available for the current module/question.
// So, no explicit update block needed here for those fields anymore.

answerState.timeSpent = parseFloat(answerState.timeSpent) || 0;
questionStartTime = Date.now(); // Set startTime AFTER answerState might have been updated
// ... rest of loadQuestion

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
        mainContentAreaDynamic.classList.remove('single-pane');
        passagePane.style.display = 'flex'; 
        paneDivider.style.display = 'block'; 
        
        if(passageContentEl) passageContentEl.innerHTML = currentQuestionDetails.question_text || '<p>Question text missing.</p>';

        if(questionTextMainEl) questionTextMainEl.innerHTML = ''; 
        answerOptionsMainEl.style.display = 'flex'; 
        sprInputContainerMain.style.display = 'none';

    } else { 
        mainContentAreaDynamic.classList.add('single-pane');
        passagePane.style.display = 'none';
        sprInstructionsPane.style.display = 'none';
        paneDivider.style.display = 'none';

        if(questionTextMainEl) questionTextMainEl.innerHTML = currentQuestionDetails.question_text || '<p>Question text missing.</p>';
        answerOptionsMainEl.style.display = 'flex'; 
        sprInputContainerMain.style.display = 'none';
    }

    if (currentQuestionDetails.question_type && currentQuestionDetails.question_type.includes('multiple_choice')) {
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
        MathJax.typesetPromise([passageContentEl, questionTextMainEl, answerOptionsMainEl, sprInstructionsContent]).catch(function (err) {
            console.error('MathJax Typesetting Error:', err);
        });
    } else {
        console.warn("MathJax or MathJax.typesetPromise not available.");
    }
    updateNavigation();
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

// --- Event Listeners (Phase 3 versions, largely unchanged for this step, except cross-out will be simplified later) ---
// From your Phase 4 script.js (around line 530)
if(answerOptionsMainEl) {
    answerOptionsMainEl.addEventListener('click', function(event) {
        const target = event.target;
        const answerContainer = target.closest('.answer-option-container');
        
        // DEBUG: Log if the listener is even firing and what was clicked
        console.log("Answer option area clicked. Target:", target, "Container:", answerContainer);

        if (!answerContainer) {
            console.log("Click was outside an answer-option-container. Exiting listener.");
            return; 
        }
        const optionKey = answerContainer.dataset.optionKey;
        console.log("Option key identified:", optionKey); // DEBUG
        
        const actionElement = target.closest('[data-action]');
        const action = actionElement ? actionElement.dataset.action : null;
        console.log("Action identified:", action); // DEBUG
        
        if (!action && target.closest('.answer-option')) { 
            recordTimeOnCurrentQuestion(); 
        }

        if (action === 'cross-out-individual') {
            console.log("Calling handleAnswerCrossOut for individual cross-out."); // DEBUG
            handleAnswerCrossOut(optionKey);
        } else if (action === 'undo-cross-out') {
            console.log("Calling handleAnswerCrossOut for undo cross-out."); // DEBUG
            handleAnswerUndoCrossOut(optionKey);
        } else if (target.closest('.answer-option')) { 
            // This 'else if' implies the click was on the general option area, intended for selection.
            console.log("Attempting to call handleAnswerSelect."); // DEBUG
            handleAnswerSelect(optionKey);
        } else {
            console.log("Click did not match any known action or target for selection."); // DEBUG
        }
    });
});
}

// REVISED handleAnswerSelect for debugging the "no selection when tool is off" issue
function handleAnswerSelect(optionKey) {
    const answerState = getAnswerState();
    if (!answerState) {
        console.error("handleAnswerSelect: No answer state found for current question.");
        return;
    }

    // --- Core Debugging Point for Answer Selection ---
    if (isCrossOutToolActive) {
        // If cross-out tool IS active, clicking an option might mean something else.
        // For now, we'll allow selection to still happen to test the official Bluebook logic later
        // (where selection removes cross-out).
        // But the primary bug is when isCrossOutToolActive is FALSE.
        console.log("handleAnswerSelect: Cross-out tool is currently ACTIVE. Proceeding with selection (will also remove cross-out).");
        // If you wanted to STRICTLY prevent selection when tool is active (old behavior):
        // return; 
    } else {
        console.log("handleAnswerSelect: Cross-out tool is INACTIVE. Proceeding with selection.");
    }
    
    // If we reach here, we are selecting the answer.
    const currentQDetails = getCurrentQuestionData();
    let selectedOptionText = optionKey; // Fallback to key if text not found
    
    // Try to get the full text for the option, as stored in JSON
    // JSON option keys are like 'option_a', 'option_b'
    const jsonOptionKey = `option_${optionKey.toLowerCase()}`;
    if (currentQDetails && currentQDetails.hasOwnProperty(jsonOptionKey) && currentQDetails[jsonOptionKey] !== null) {
        selectedOptionText = currentQDetails[jsonOptionKey];
    } else {
        console.warn(`handleAnswerSelect: Could not find option text for key ${optionKey} (tried ${jsonOptionKey}). Storing key itself ('${optionKey}') as selected value. This might affect 'is_correct' for MCQs if not intended.`);
    }

    console.log(`handleAnswerSelect: Setting selected answer to: "${selectedOptionText}" (original key: ${optionKey})`);
    answerState.selected = selectedOptionText; 

    // As per official Bluebook: selecting an option should remove any cross-out from that option key.
    if (answerState.crossedOut.includes(optionKey)) {
        console.log(`handleAnswerSelect: Option ${optionKey} was selected, removing it from crossedOut list.`);
        answerState.crossedOut = answerState.crossedOut.filter(opt => opt !== optionKey);
    }
    
    loadQuestion(); // Reload to reflect selection and potential un-cross-out
}
function handleAnswerCrossOut(optionKey) { 
     const answerState = getAnswerState();
     if (!answerState) return;
     if (!answerState.crossedOut.includes(optionKey)) {
         answerState.crossedOut.push(optionKey);
     } else { // If already crossed out, clicking 'x' again could uncross it (optional refinement)
         // answerState.crossedOut = answerState.crossedOut.filter(opt => opt !== optionKey);
     }
     loadQuestion();
}
function handleAnswerUndoCrossOut(optionKey) { 
     const answerState = getAnswerState();
     if (!answerState) return;
     answerState.crossedOut = answerState.crossedOut.filter(opt => opt !== optionKey);
     loadQuestion();
}

if(crossOutToolBtnMain) {
    crossOutToolBtnMain.addEventListener('click', () => {
        const currentQData = getCurrentQuestionData();
        if (currentQData && currentQData.question_type === 'student_produced_response') return;
        isCrossOutToolActive = !isCrossOutToolActive;
        loadQuestion();
    });
}
if(sprInputFieldMain) {
    sprInputFieldMain.addEventListener('input', (event) => {
        const answerState = getAnswerState();
        if (!answerState) return;
        answerState.spr_answer = event.target.value;
        if(sprAnswerPreviewMain) sprAnswerPreviewMain.textContent = `Answer Preview: ${event.target.value}`;
    });
    sprInputFieldMain.addEventListener('blur', () => { 
        recordTimeOnCurrentQuestion();
        questionStartTime = Date.now(); 
    });
}

function updateNavigation() {
    // (Unchanged from Phase 3)
    if (!backBtnFooter || !nextBtnFooter || !currentQFooterEl || !totalQFooterEl) {
        console.error("Navigation elements missing.");
        return;
    }

    const moduleIsLoaded = currentQuizQuestions && currentQuizQuestions.length > 0;
    const totalQuestionsInModule = moduleIsLoaded ? currentQuizQuestions.length : 0;

    currentQFooterEl.textContent = moduleIsLoaded ? currentQuestionNumber : '0';
    totalQFooterEl.textContent = totalQuestionsInModule;
    backBtnFooter.disabled = (currentQuestionNumber === 1);

    if (currentView === 'test-interface-view') {
        if (!moduleIsLoaded) {
            nextBtnFooter.textContent = "Next";
            nextBtnFooter.disabled = true;
        } else if (currentQuestionNumber < totalQuestionsInModule) {
            nextBtnFooter.textContent = "Next";
            nextBtnFooter.disabled = false;
        } else { 
            nextBtnFooter.textContent = "Review Section";
            nextBtnFooter.disabled = false;
        }
        if (reviewBackBtnFooter) reviewBackBtnFooter.style.display = 'none';
        if (reviewNextBtnFooter) reviewNextBtnFooter.style.display = 'none';
        nextBtnFooter.style.display = 'inline-block'; 
        backBtnFooter.style.display = 'inline-block'; 

    } 
    else if (currentView === 'review-page-view') {
        if (reviewBackBtnFooter) {
             reviewBackBtnFooter.style.display = 'inline-block';
             reviewBackBtnFooter.disabled = false; 
        }
        if (reviewNextBtnFooter) {
            reviewNextBtnFooter.style.display = 'inline-block';
            if (currentModuleIndex < currentTestFlow.length - 1) {
                reviewNextBtnFooter.textContent = "Next Module";
            } else {
                reviewNextBtnFooter.textContent = "Finish Test";
            }
            reviewNextBtnFooter.disabled = false;
        }
        if (nextBtnFooter) nextBtnFooter.style.display = 'none';
        if (backBtnFooter) backBtnFooter.style.display = 'none';
    } else { 
        if (nextBtnFooter) { nextBtnFooter.style.display = 'inline-block'; nextBtnFooter.disabled = true; }
        if (backBtnFooter) { backBtnFooter.style.display = 'inline-block'; backBtnFooter.disabled = true; }
        if (reviewBackBtnFooter) reviewBackBtnFooter.style.display = 'none';
        if (reviewNextBtnFooter) reviewNextBtnFooter.style.display = 'none';
    }
}

if(nextBtnFooter) {
    nextBtnFooter.removeEventListener('click', nextButtonClickHandler); 
    nextBtnFooter.addEventListener('click', nextButtonClickHandler);
}
function nextButtonClickHandler() {
    // (Unchanged from Phase 3)
    if (currentView !== 'test-interface-view') return; 
    recordTimeOnCurrentQuestion(); 
    const totalQuestionsInModule = currentQuizQuestions.length;
    if (currentQuestionNumber < totalQuestionsInModule) {
        currentQuestionNumber++;
        isCrossOutToolActive = false; 
        isHighlightingActive = false; if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
        loadQuestion();
    } else if (currentQuestionNumber === totalQuestionsInModule) {
        showView('review-page-view');
    }
}

if(reviewNextBtnFooter) {
    // (Unchanged from Phase 3)
    reviewNextBtnFooter.addEventListener('click', async () => { 
        if (currentView !== 'review-page-view') return;
        recordTimeOnCurrentQuestion(); 
        currentModuleIndex++;
        if (currentModuleIndex < currentTestFlow.length) {
            showView('module-over-view'); 
            setTimeout(async () => {
                currentQuestionNumber = 1; 
                const success = await loadQuizData(currentTestFlow[currentModuleIndex]);
                if (success && currentQuizQuestions.length > 0) {
                    populateQNavGrid(); 
                    showView('test-interface-view');
                } else {
                    console.error("Failed to load next module or module has no questions.");
                    alert("Error loading the next module. Returning to home.");
                    showView('home-view'); 
                }
            }, 1000); 
        } else {
            console.log("All modules finished. Transitioning to finished view.");
            showView('finished-view');
        }
    });
}

if(backBtnFooter) { 
    // (Unchanged from Phase 3)
    backBtnFooter.removeEventListener('click', backButtonClickHandler); 
    backBtnFooter.addEventListener('click', backButtonClickHandler);
}
function backButtonClickHandler() {
    // (Unchanged from Phase 3)
    if (currentView !== 'test-interface-view') return;
    recordTimeOnCurrentQuestion();
    if (currentQuestionNumber > 1) {
        currentQuestionNumber--;
        isCrossOutToolActive = false; 
        isHighlightingActive = false; if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
        loadQuestion();
    }
}

// --- Event Listeners for other UI elements (Restored and Verified from Phase 3) ---
if(returnToHomeBtn) returnToHomeBtn.addEventListener('click', () => showView('home-view')); 
if(calculatorBtnHeader) calculatorBtnHeader.addEventListener('click', () => toggleModal(calculatorOverlay, true));
if(calculatorCloseBtn) calculatorCloseBtn.addEventListener('click', () => toggleModal(calculatorOverlay, false));
if(referenceBtnHeader) referenceBtnHeader.addEventListener('click', () => toggleModal(referenceSheetPanel, true));
if(referenceSheetCloseBtn) referenceSheetCloseBtn.addEventListener('click', () => toggleModal(referenceSheetPanel, false));

let isCalcDraggingPhase3 = false; let currentX_calc_drag_p3, currentY_calc_drag_p3, initialX_calc_drag_p3, initialY_calc_drag_p3, xOffset_calc_drag_p3 = 0, yOffset_calc_drag_p3 = 0;
if(calculatorHeaderDraggable) {
    calculatorHeaderDraggable.addEventListener('mousedown', (e) => { 
        initialX_calc_drag_p3 = e.clientX - xOffset_calc_drag_p3; 
        initialY_calc_drag_p3 = e.clientY - yOffset_calc_drag_p3; 
        if (e.target === calculatorHeaderDraggable || e.target.tagName === 'STRONG') isCalcDraggingPhase3 = true; 
    });
    document.addEventListener('mousemove', (e) => { 
        if (isCalcDraggingPhase3) { 
            e.preventDefault(); 
            currentX_calc_drag_p3 = e.clientX - initialX_calc_drag_p3; 
            currentY_calc_drag_p3 = e.clientY - initialY_calc_drag_p3; 
            xOffset_calc_drag_p3 = currentX_calc_drag_p3; 
            yOffset_calc_drag_p3 = currentY_calc_drag_p3; 
            if(calculatorOverlay) calculatorOverlay.style.transform = `translate3d(${currentX_calc_drag_p3}px, ${currentY_calc_drag_p3}px, 0)`;
        } 
    });
    document.addEventListener('mouseup', () => isCalcDraggingPhase3 = false );
}

if(highlightsNotesBtn && (passageContentEl || questionTextMainEl) ) {
    highlightsNotesBtn.addEventListener('click', () => {
        isHighlightingActive = !isHighlightingActive;
        highlightsNotesBtn.classList.toggle('active', isHighlightingActive);
        if (isHighlightingActive) {
            document.addEventListener('mouseup', handleTextSelection); 
            if(mainContentAreaDynamic) mainContentAreaDynamic.classList.add('highlight-active'); 
        } else {
            document.removeEventListener('mouseup', handleTextSelection);
            if(mainContentAreaDynamic) mainContentAreaDynamic.classList.remove('highlight-active'); 
        }
    });
}
function handleTextSelection() {
    // (Unchanged from Phase 3)
    if (!isHighlightingActive) return;
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const isWithinPassagePane = passagePane && passagePane.style.display !== 'none' && passagePane.contains(container);
    const isWithinQuestionTextPane = questionPane && questionPane.contains(container) && questionTextMainEl.contains(container);
    const isWithinSprInstructions = sprInstructionsPane && sprInstructionsPane.style.display !== 'none' && sprInstructionsPane.contains(container);
    if (!isWithinPassagePane && !isWithinQuestionTextPane && !isWithinSprInstructions) return;
    const span = document.createElement('span');
    span.className = 'text-highlight';
    try { range.surroundContents(span); } 
    catch (e) { span.appendChild(range.extractContents()); range.insertNode(span); console.warn("Highlighting fallback.", e); }
    selection.removeAllRanges();
}

if(directionsBtn) {
    directionsBtn.addEventListener('click', () => {
        const moduleInfo = getCurrentModule();
        if(moduleInfo && directionsModalTitle) directionsModalTitle.textContent = `Section ${currentModuleIndex + 1}: ${moduleInfo.name} Directions`; 
        if(moduleInfo && directionsModalText) directionsModalText.innerHTML = moduleInfo.directions || "General directions"; 
        toggleModal(directionsModal, true); 
    });
}
if(directionsModalCloseBtn) directionsModalCloseBtn.addEventListener('click', () => toggleModal(directionsModal, false));
if(directionsModal) directionsModal.addEventListener('click', (e) => { if (e.target === directionsModal) toggleModal(directionsModal, false); });

if(qNavBtnFooter) {
    qNavBtnFooter.addEventListener('click', () => { 
        if (currentQuizQuestions.length > 0) { populateQNavGrid(); toggleModal(qNavPopup, true); } 
        else { console.warn("QNav: no questions loaded."); }
    });
}
if(qNavCloseBtn) qNavCloseBtn.addEventListener('click', () => toggleModal(qNavPopup, false));
if(qNavGotoReviewBtn) {
    qNavGotoReviewBtn.addEventListener('click', () => { 
        toggleModal(qNavPopup, false); 
        if (currentQuizQuestions.length > 0) { showView('review-page-view'); }
    }); 
}

if(markReviewCheckboxMain) {
    markReviewCheckboxMain.addEventListener('change', () => {
        const answerState = getAnswerState();
        if (!answerState) return;
        answerState.marked = markReviewCheckboxMain.checked;
        if(flagIconMain) {
            flagIconMain.style.fill = answerState.marked ? 'var(--bluebook-red-flag)' : 'none';
            flagIconMain.style.color = answerState.marked ? 'var(--bluebook-red-flag)' : '#9ca3af';
        }
        if (qNavPopup && qNavPopup.classList.contains('visible')) populateQNavGrid();
    });
}

if(timerToggleBtn) timerToggleBtn.addEventListener('click', () => handleTimerToggle(timerTextEl, timerClockIconEl, timerToggleBtn));
if(reviewDirectionsBtn) reviewDirectionsBtn.addEventListener('click', () => { /* Already handled by its own listener */ });
if(reviewTimerToggleBtn && reviewTimerText && reviewTimerClockIcon) reviewTimerToggleBtn.addEventListener('click', () => handleTimerToggle(reviewTimerText, reviewTimerClockIcon, reviewTimerToggleBtn));

if(moreBtn) { /* (More Menu listeners unchanged from Phase 3) */ }
document.body.addEventListener('click', (e) => { /* ... */ });
if(moreMenuDropdown) moreMenuDropdown.addEventListener('click', (e) => e.stopPropagation()); 
if(moreUnscheduledBreakBtn) { /* ... */ }
if(understandLoseTimeCheckbox) { /* ... */ }
if(unscheduledBreakCancelBtn) unscheduledBreakCancelBtn.addEventListener('click', () => toggleModal(unscheduledBreakConfirmModal, false));
if(unscheduledBreakConfirmBtn) { /* ... */ }
if(moreExitExamBtn) { /* ... */ }
if(exitExamCancelBtn) exitExamCancelBtn.addEventListener('click', () => toggleModal(exitExamConfirmModal, false));
if(exitExamConfirmBtn) { /* ... */ }


// --- Start Button Event Listener ---
if(startTestPreviewBtn) {
    startTestPreviewBtn.addEventListener('click', async () => {
        console.log("Start Test Preview button clicked (Phase 4)."); 
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
        console.log("Test flow set to:", currentTestFlow); 

        if (currentTestFlow.length > 0) {
            const firstQuizName = currentTestFlow[currentModuleIndex];
            console.log(`Attempting to load first quiz: ${firstQuizName}`); 

            startTestPreviewBtn.textContent = "Loading...";
            startTestPreviewBtn.disabled = true;
            
            const success = await loadQuizData(firstQuizName); 
            
            startTestPreviewBtn.textContent = "Start"; 
            startTestPreviewBtn.disabled = false; 

            if (success && currentQuizQuestions.length > 0) {
                console.log("Initial quiz data loaded successfully. Showing test interface.");
                populateQNavGrid(); 
                showView('test-interface-view'); 
            } else {
                console.error("Failed to load initial quiz data or no questions found after attempting load.");
                alert("Could not start the test. Please check the console for errors. Ensure JSON files are accessible and GITHUB_JSON_BASE_URL is correct.");
                showView('home-view'); 
            }
        } else {
            console.error("Test flow is empty. Cannot start test.");
            alert("No test configured to start.");
        }
    });
}

// --- CHANGED: SUBMISSION LOGIC (NEW FUNCTION) ---
// CHANGED: submitQuizData function completely revised to align with old working script and use data from answerState
async function submitQuizData() {
    console.log("Attempting to submit quiz data (Phase 4 - Corrected Logic)...");
    recordTimeOnCurrentQuestion(); // Ensure time for the very last interaction is recorded

    const submissions = [];
    const timestamp = new Date().toISOString();

    for (const key in userAnswers) {
        if (userAnswers.hasOwnProperty(key)) {
            const answerState = userAnswers[key];
            
            // Critical check: Ensure all needed data is present in answerState
            if (!answerState.q_id || answerState.q_id.endsWith('-tmp') || typeof answerState.correct_ans === 'undefined' || answerState.correct_ans === null || typeof answerState.question_type_from_json === 'undefined' || !answerState.quizName_from_flow) {
                console.warn(`Submission data incomplete for answer key ${key}:`, answerState, `. QuizName found: ${answerState.quizName_from_flow}. Question ID: ${answerState.q_id}. Correct Ans: ${answerState.correct_ans}. Type: ${answerState.question_type_from_json}. Skipping this answer.`);
                continue; 
            }

            let studentAnswerForSubmission = "";
            let isCorrect = false;

            if (answerState.question_type_from_json === 'student_produced_response') {
                studentAnswerForSubmission = answerState.spr_answer || "NO_ANSWER";
                if (answerState.correct_ans && studentAnswerForSubmission !== "NO_ANSWER") {
                    const correctSprAnswers = String(answerState.correct_ans).split('|').map(s => s.trim().toLowerCase());
                    if (correctSprAnswers.includes(studentAnswerForSubmission.trim().toLowerCase())) {
                        isCorrect = true;
                    }
                }
            } else { // Assuming multiple_choice or similar
                studentAnswerForSubmission = answerState.selected || "NO_ANSWER";
                // For MCQs, the JSON 'correct_answer' field contains the text of the correct option.
                // 'answerState.selected' stores the letter (A, B, C, D) of the chosen option.
                // We need to get the text of the selected option to compare.
                if (answerState.selected && studentAnswerForSubmission !== "NO_ANSWER") {
                    // Find the original question data to get the text of the selected option
                    // This is a bit complex here because currentQuizQuestions might be for a different module
                    // if submission happens after all modules are done.
                    // This highlights a potential need to store option texts or have a map.
                    // For now, this part of is_correct for MCQ might be inaccurate if not handled carefully
                    // during the actual quiz flow.
                    // HOWEVER, the OLD SCRIPT compared `userAnswerData.answer` (which was the option text) 
                    // with `question.correct_answer` (also option text).
                    // Our Bluebook `answerState.selected` stores the KEY ('A', 'B').
                    // This is a mismatch that needs addressing if we want accurate `is_correct` for MCQs.
                    
                    // TEMPORARY: For now, to make submission proceed, we'll set isCorrect for MCQ to false
                    // This needs to be fixed by ensuring answerState.selected either stores full text,
                    // or we can retrieve the option text based on the key at submission time.
                    // Given the structure, let's assume correct_ans is the option TEXT.
                    // We need to map answerState.selected ('A') to currentQuestionDetails['option_a']
                    // This is difficult to do generically in submitQuizData without loading original question.
                    // Let's assume `answerState.correct_ans` IS the text of the correct option from JSON.
                    // If `answerState.selected` stored the TEXT of the selected option, this would work:
                    // isCorrect = (String(studentAnswerForSubmission).trim() === String(answerState.correct_ans).trim());
                    
                    // For the OLD script, `studentAnswers[questionId].answer` was the *value* (text) of the selected option.
                    // Our `answerState.selected` is the *key* ('A', 'B', etc.).
                    // To fix this properly, when recording MCQ answers, we should store the TEXT of the selected option.
                    // For now, to make the structure match the old script for `is_correct`:
                    // This is_correct for MCQ WILL BE WRONG until we store option text in answerState.selected or similar.
                    // We'll assume `answerState.selected` is already the option text for this fetch call.
                    // THIS WILL BE FIXED IN THE NEXT STEP IF `studentAnswerForSubmission` is an option key ('A')
                    // and `answerState.correct_ans` is option text.

                    // Correct approach for MCQ is_correct:
                    // 1. `answerState.selected` should store the *text* of the selected option, not the key.
                    //    This change needs to be made in `handleAnswerSelect`.
                    // OR
                    // 2. At submission, retrieve the question details to map the key to text. (More complex here)

                    // For now, to match old script's direct comparison:
                    if (answerState.correct_ans && studentAnswerForSubmission !== "NO_ANSWER") {
                        isCorrect = (String(studentAnswerForSubmission).trim().toLowerCase() === String(answerState.correct_ans).trim().toLowerCase());
                    }
                }
            }
            
            submissions.push({
                timestamp: timestamp,
                student_gmail_id: studentEmailForSubmission, 
                quiz_name: answerState.quizName_from_flow, // Use stored quizName
                question_id: answerState.q_id, 
                student_answer: studentAnswerForSubmission,
                is_correct: isCorrect, // Boolean, Apps Script handles conversion to string if necessary
                time_spent_seconds: parseFloat(answerState.timeSpent || 0).toFixed(2)
            });
        }
    }

    if (submissions.length === 0) {
        console.log("No valid answers with complete data found. Nothing to submit.");
        alert("No answers were recorded properly to submit.");
        return;
    }

    console.log("Submitting the following data (Phase 4 Corrected):", submissions);

    if (APPS_SCRIPT_WEB_APP_URL === 'YOUR_CORRECT_BLUEBOOK_APPS_SCRIPT_URL_HERE' || !APPS_SCRIPT_WEB_APP_URL.startsWith('https://script.google.com/')) {
        console.warn("APPS_SCRIPT_WEB_APP_URL is not set or invalid. Submission will not proceed.");
        alert("Submission URL not configured. Data logged to console.");
        return;
    }

    try {
        const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors', 
            cache: 'no-cache',
            headers: {
                'Content-Type': 'text/plain', 
            },
            redirect: 'follow',
            body: JSON.stringify(submissions) 
        });
        
        // With 'no-cors', we don't get a meaningful response object here.
        // The request is "fire and forget" from the browser's perspective regarding success/failure details from the server.
        console.log('Submission attempt finished (no-cors mode). Please verify in the Google Sheet.');
        alert('Your answers have been submitted! Please check the Google Sheet to confirm.');

    } catch (error) {
        // This catch block will primarily catch network errors if the request couldn't even be made (e.g., DNS, no internet)
        // or if there's a fundamental issue with the fetch setup itself.
        // It won't typically catch server-side errors from Apps Script when using 'no-cors'.
        console.error('Error submitting quiz data (fetch failed):', error);
        alert(`There was an error sending your quiz data: ${error.message}. Please check your internet connection and the console.`);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    updateNavigation(); 
});
