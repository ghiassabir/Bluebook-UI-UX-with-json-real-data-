// --- script.js (Phase 5 - localStorage for Student ID) ---

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

// COMMENTED: Old hardcoded studentEmailForSubmission
// let studentEmailForSubmission = "teststudent@example.com"; 

// CHANGED: studentEmailForSubmission will now be retrieved or default
let studentEmailForSubmission = "anonymous_student@example.com"; // Default if not found in localStorage

const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyOSVXRcH8VlrqgybxxJKTx2YHE-y8DJdBcMgFGREWUJn5Ufv9QT7WzeAFsZ2BbdXkj/exec'; 

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

// CHANGED: Function to initialize student identifier
function initializeStudentIdentifier() {
    const storedEmail = localStorage.getItem('bluebookStudentEmail'); // Using 'bluebookStudentEmail' as the key
    if (storedEmail) {
        studentEmailForSubmission = storedEmail;
        console.log(`Student identifier initialized from localStorage: ${studentEmailForSubmission}`);
    } else {
        // Keep the default "anonymous_student@example.com" if nothing is found
        console.log(`No student identifier found in localStorage. Using default: ${studentEmailForSubmission}`);
    }
}

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

// --- DOM Elements (Assume these are all correctly defined as before) ---
const allAppViews = document.querySelectorAll('.app-view');
const homeViewEl = document.getElementById('home-view');
const testInterfaceViewEl = document.getElementById('test-interface-view');
// ... (all other DOM element const declarations remain the same as in your working Phase 4/5 script)
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
// (getCurrentModule, getCurrentQuestionData, getAnswerState, populateQNavGrid, renderReviewPage, confetti, handleTimerToggle remain the same)
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
        const questionDetails = (moduleIdx === currentModuleIndex && currentQuizQuestions && currentQuizQuestions[qNum - 1]) 
                               ? currentQuizQuestions[qNum - 1] 
                               : null;
        
        userAnswers[key] = { 
            selected: null, 
            spr_answer: '', 
            marked: false, 
            crossedOut: [], 
            timeSpent: 0,
            q_id: questionDetails ? questionDetails.question_id : `M${moduleIdx}-Q${qNum}-tmp`, 
            correct_ans: questionDetails ? questionDetails.correct_answer : null,
            question_type_from_json: questionDetails ? questionDetails.question_type : null,
            quizName_from_flow: currentTestFlow[moduleIdx] || "UNKNOWN_QUIZ_AT_GETSTATE"
        };
    }
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
    // ... (same as your working version)
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
    // ... (same as your working version)
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

let confettiAnimationId; 
const confettiParticles = []; 
function startConfetti() { /* ... */ } // Unchanged
function stopConfetti() { /* ... */ }  // Unchanged
function handleTimerToggle(textEl, iconEl, btnEl) { /* ... */ } // Unchanged


// --- View Management ---
function showView(viewId) {
    // ... (same as your working version, including call to submitQuizData in 'finished-view')
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
    // ... (same as your working version, including robust MathJax call)
    if (!testInterfaceViewEl.classList.contains('active')) return;
    const currentModuleInfo = getCurrentModule(); 
    const currentQuestionDetails = getCurrentQuestionData(); 
    if (!currentModuleInfo || !currentQuestionDetails) {
        console.error("loadQuestion: ModuleInfo or Question data is null/undefined. Aborting question load.");
        if (questionTextMainEl) questionTextMainEl.innerHTML = "<p>Error: Critical data missing for question display.</p>";
        if (answerOptionsMainEl) answerOptionsMainEl.innerHTML = "";
        if(totalQFooterEl && currentQFooterEl) {
            currentQFooterEl.textContent = currentQuestionNumber;
            totalQFooterEl.textContent = currentQuizQuestions ? currentQuizQuestions.length : 0;
        }
        updateNavigation();
        return;
    }
    const answerState = getAnswerState(); 
    if (answerState && (typeof answerState.q_id === 'undefined' || (answerState.q_id && answerState.q_id.startsWith('M')))) {
        answerState.q_id = currentQuestionDetails.question_id;
        answerState.correct_ans = currentQuestionDetails.correct_answer;
        answerState.question_type_from_json = currentQuestionDetails.question_type;
        answerState.quizName_from_flow = currentTestFlow[currentModuleIndex] || "UNKNOWN_QUIZ_AT_LOADQUESTION";
    }
    answerState.timeSpent = parseFloat(answerState.timeSpent) || 0;
    questionStartTime = Date.now();
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
            const isSelected = (answerState.selected === value); 
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
    if (typeof MathJax !== "undefined") {
        if (MathJax.typesetPromise) {
            MathJax.typesetPromise([passageContentEl, questionTextMainEl, answerOptionsMainEl, sprInstructionsContent])
                .catch(function (err) { console.error('MathJax Typesetting Error:', err); });
        } else if (MathJax.startup && MathJax.startup.promise) {
            MathJax.startup.promise.then(() => {
                if (MathJax.typesetPromise) {
                     MathJax.typesetPromise([passageContentEl, questionTextMainEl, answerOptionsMainEl, sprInstructionsContent])
                        .catch(function (err) { console.error('MathJax Typesetting Error (after startup.promise):', err); });
                } else {
                    console.error("MathJax.typesetPromise still not available after startup.promise resolved.");
                }
            }).catch(err => console.error("Error waiting for MathJax startup:", err));
        } else {
            console.warn("MathJax is defined, but neither typesetPromise nor startup.promise is available. Typesetting may fail.");
            setTimeout(() => {
                if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
                    console.log("Attempting MathJax typesetting after a short delay.");
                    MathJax.typesetPromise([passageContentEl, questionTextMainEl, answerOptionsMainEl, sprInstructionsContent])
                        .catch(function (err) { console.error('MathJax Typesetting Error (after delay):', err); });
                } else {
                     console.warn("MathJax still not ready after delay for typesetting.");
                }
            }, 500); 
        }
    } else {
        console.warn("MathJax object itself is not defined. Math content will not be rendered.");
    }
    updateNavigation();
}

function recordTimeOnCurrentQuestion() { /* ... */ } // Unchanged

// --- Event Listeners ---
// (handleAnswerSelect, handleAnswerCrossOut, handleAnswerUndoCrossOut, crossOutToolBtnMain, sprInputFieldMain listeners remain the same)
if(answerOptionsMainEl) {
    answerOptionsMainEl.addEventListener('click', function(event) {
        const target = event.target;
        const answerContainer = target.closest('.answer-option-container');
        if (!answerContainer) return;
        const optionKey = answerContainer.dataset.optionKey;
        const action = target.dataset.action || (target.closest('[data-action]') ? target.closest('[data-action]').dataset.action : null);
        if (!action && target.closest('.answer-option')) { 
            recordTimeOnCurrentQuestion(); 
        }
        if (action === 'cross-out-individual') handleAnswerCrossOut(optionKey);
        else if (action === 'undo-cross-out') handleAnswerUndoCrossOut(optionKey);
        else if (target.closest('.answer-option')) handleAnswerSelect(optionKey);
    });
}
function handleAnswerSelect(optionKey) {
    const answerState = getAnswerState();
    if (!answerState) return;
    if (isCrossOutToolActive) {
        console.log("handleAnswerSelect: Cross-out tool is currently ACTIVE. Proceeding with selection (will also remove cross-out).");
    } else {
        console.log("handleAnswerSelect: Cross-out tool is INACTIVE. Proceeding with selection.");
    }
    const currentQDetails = getCurrentQuestionData();
    let selectedOptionText = optionKey; 
    const jsonOptionKey = `option_${optionKey.toLowerCase()}`;
    if (currentQDetails && currentQDetails.hasOwnProperty(jsonOptionKey) && currentQDetails[jsonOptionKey] !== null) {
        selectedOptionText = currentQDetails[jsonOptionKey];
    } else {
        console.warn(`handleAnswerSelect: Could not find option text for key ${optionKey} (tried ${jsonOptionKey}). Storing key itself ('${optionKey}') as selected value.`);
    }
    console.log(`handleAnswerSelect: Setting selected answer to: "${selectedOptionText}" (original key: ${optionKey})`);
    answerState.selected = selectedOptionText; 
    if (answerState.crossedOut.includes(optionKey)) {
        console.log(`handleAnswerSelect: Option ${optionKey} was selected, removing it from crossedOut list.`);
        answerState.crossedOut = answerState.crossedOut.filter(opt => opt !== optionKey);
    }
    loadQuestion(); 
}
function handleAnswerCrossOut(optionKey) { 
     const answerState = getAnswerState();
     if (!answerState) return;
     if (!answerState.crossedOut.includes(optionKey)) {
         answerState.crossedOut.push(optionKey);
     } 
     loadQuestion(); 
}
function handleAnswerUndoCrossOut(optionKey) { 
     const answerState = getAnswerState();
     if (!answerState) return;
     answerState.crossedOut = answerState.crossedOut.filter(opt => opt !== optionKey);
     loadQuestion(); 
}

if(crossOutToolBtnMain) { /* ... */ } // Unchanged
if(sprInputFieldMain) { /* ... */ }   // Unchanged

function updateNavigation() { /* ... */ } // Unchanged
if(nextBtnFooter) { /* ... */ }           // Unchanged
function nextButtonClickHandler() { /* ... */ } // Unchanged
if(reviewNextBtnFooter) { /* ... */ }    // Unchanged
if(backBtnFooter) { /* ... */ }           // Unchanged
function backButtonClickHandler() { /* ... */ } // Unchanged

// Other UI element listeners (directions, qnav, modals, etc.) remain the same
if(returnToHomeBtn) returnToHomeBtn.addEventListener('click', () => showView('home-view')); 
// ... (all other event listeners for calculator, reference, highlights, modals, etc. are unchanged)
if(calculatorBtnHeader) calculatorBtnHeader.addEventListener('click', () => toggleModal(calculatorOverlay, true));
if(calculatorCloseBtn) calculatorCloseBtn.addEventListener('click', () => toggleModal(calculatorOverlay, false));
if(referenceBtnHeader) referenceBtnHeader.addEventListener('click', () => toggleModal(referenceSheetPanel, true));
if(referenceSheetCloseBtn) referenceSheetCloseBtn.addEventListener('click', () => toggleModal(referenceSheetPanel, false));
let isCalcDraggingPhase3 = false; let currentX_calc_drag_p3, currentY_calc_drag_p3, initialX_calc_drag_p3, initialY_calc_drag_p3, xOffset_calc_drag_p3 = 0, yOffset_calc_drag_p3 = 0;
if(calculatorHeaderDraggable) { /* ... */ }
if(highlightsNotesBtn && (passageContentEl || questionTextMainEl) ) { /* ... */ }
function handleTextSelection() { /* ... */ }
if(directionsBtn) { /* ... */ }
if(directionsModalCloseBtn) directionsModalCloseBtn.addEventListener('click', () => toggleModal(directionsModal, false));
if(directionsModal) directionsModal.addEventListener('click', (e) => { if (e.target === directionsModal) toggleModal(directionsModal, false); });
if(qNavBtnFooter) { /* ... */ }
if(qNavCloseBtn) qNavCloseBtn.addEventListener('click', () => toggleModal(qNavPopup, false));
if(qNavGotoReviewBtn) { /* ... */ }
if(markReviewCheckboxMain) { /* ... */ }
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
        // CHANGED: Call initializeStudentIdentifier
        initializeStudentIdentifier(); 

        console.log("Start Test Preview button clicked (Using localStorage for student ID)."); 
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

// --- Submission Logic ---
async function submitQuizData() {
    // ... (This function remains the same as the one that successfully submitted data)
    console.log("Attempting to submit quiz data (Phase 4 - Corrected Logic)...");
    recordTimeOnCurrentQuestion(); 
    const submissions = [];
    const timestamp = new Date().toISOString();
    for (const key in userAnswers) {
        if (userAnswers.hasOwnProperty(key)) {
            const answerState = userAnswers[key];
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
            } else { 
                studentAnswerForSubmission = answerState.selected || "NO_ANSWER";
                if (answerState.correct_ans && studentAnswerForSubmission !== "NO_ANSWER") {
                    isCorrect = (String(studentAnswerForSubmission).trim().toLowerCase() === String(answerState.correct_ans).trim().toLowerCase());
                }
            }
            submissions.push({
                timestamp: timestamp,
                student_gmail_id: studentEmailForSubmission, 
                quiz_name: answerState.quizName_from_flow, 
                question_id: answerState.q_id, 
                student_answer: studentAnswerForSubmission,
                is_correct: isCorrect, 
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
        console.log('Submission attempt finished (no-cors mode). Please verify in the Google Sheet.');
        alert('Your answers have been submitted! Please check the Google Sheet to confirm.');
    } catch (error) {
        console.error('Error submitting quiz data (fetch failed):', error);
        alert(`There was an error sending your quiz data: ${error.message}. Please check your internet connection and the console.`);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // CHANGED: Call initializeStudentIdentifier on initial page load as well,
    // in case the app is reloaded or started not via the main start button
    // but by directly landing on a quiz URL (future feature).
    initializeStudentIdentifier();
    updateNavigation(); 
});
