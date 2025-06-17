// --- script.js (Phase 3 - Revision 2 - Debugging Focus) ---

// --- Utility Functions (Define these FIRST) ---
function toggleModal(modalElement, show) {
    if (!modalElement) {
        console.error("toggleModal called with null/undefined modalElement");
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
        directions: "The questions in this section address a number of important reading and writing skills...",
        spr_directions: null,
        spr_examples_table: null
    },
    "DT-T0-MT-M1": { 
        name: "Math - Module 1",
        type: "Math",
        directions: "The questions in this section address a number of important math skills...",
        passageText: null, 
        spr_directions: `<h3>Student-produced response directions</h3><ul><li>...</li></ul>`,
        spr_examples_table: `<table class="spr-examples-table"><thead>...</thead><tbody>...</tbody></table>`
    }
};

const GITHUB_JSON_BASE_URL = 'https://raw.githubusercontent.com/ghiassabir/Bluebook-UI-UX-with-json-real-data-/main/data/json/'; 

async function loadQuizData(quizName) {
    const url = `${GITHUB_JSON_BASE_URL}${quizName}.json`;
    console.log(`[loadQuizData] Fetching quiz data from: ${url}`);
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
        console.log(`[loadQuizData] Successfully loaded ${currentQuizQuestions.length} questions for quiz: ${quizName}`);
        return true;
    } catch (error) {
        console.error("[loadQuizData] Error loading quiz data:", error);
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
    // console.warn("[getCurrentModule] No current module found or index out of bounds.");
    return null;
}

function getCurrentQuestionData() {
    if (currentQuizQuestions && currentQuizQuestions.length > 0 && currentQuestionNumber > 0 && currentQuestionNumber <= currentQuizQuestions.length) {
        return currentQuizQuestions[currentQuestionNumber - 1];
    }
    // console.warn(`[getCurrentQuestionData] No question data for index ${currentQuestionNumber -1}`);
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

function populateQNavGrid() { /* ... (same as P3.1) ... */ }
function renderReviewPage() { /* ... (same as P3.1) ... */ }
let confettiAnimationId; 
const confettiParticles = []; 
function startConfetti() { /* ... (same as P3.1) ... */ }
function stopConfetti() { /* ... (same as P3.1) ... */ }
function handleTimerToggle(textEl, iconEl, btnEl) { /* ... (same as P3.1) ... */ }

// --- Navigation Update ---
function updateNavigation() { /* ... (same as P3.1) ... */ }

// --- View Management ---
function showView(viewId) {
    console.log(`[showView] Switching to view: ${viewId}`);
    currentView = viewId;
    allAppViews.forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    } else {
        console.error(`[showView] View not found: ${viewId}`);
        return;
    }

    if (viewId === 'test-interface-view') {
        if(qNavBtnFooter) qNavBtnFooter.style.display = 'flex';
        if(backBtnFooter) backBtnFooter.style.display = 'inline-block';
        if(nextBtnFooter) nextBtnFooter.style.display = 'inline-block';
        if(reviewBackBtnFooter) reviewBackBtnFooter.style.display = 'none'; 
        if(reviewNextBtnFooter) reviewNextBtnFooter.style.display = 'none';
        loadQuestion(); // This is where the problem might be if no questions appear
    } else if (viewId === 'review-page-view') {
        if(qNavBtnFooter) qNavBtnFooter.style.display = 'none';
        if(backBtnFooter) backBtnFooter.style.display = 'none';
        if(nextBtnFooter) nextBtnFooter.style.display = 'none';
        if(reviewBackBtnFooter) reviewBackBtnFooter.style.display = 'inline-block';
        if(reviewNextBtnFooter) reviewNextBtnFooter.style.display = 'inline-block';
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
    updateNavigation(); 
}

// --- Core UI Update `loadQuestion()` (WITH ADDED LOGGING) ---
function loadQuestion() {
    console.log(`[loadQuestion] Attempting to load question. Current View: ${currentView}`);
    if (!testInterfaceViewEl || !testInterfaceViewEl.classList.contains('active')) {
        console.log("[loadQuestion] Not in test-interface-view or element not found. Exiting.");
        return;
    }
    questionStartTime = Date.now(); 

    const currentModuleInfo = getCurrentModule(); 
    const currentQuestionDetails = getCurrentQuestionData(); 
    
    console.log(`[loadQuestion] ModuleIndex: ${currentModuleIndex}, QNumber: ${currentQuestionNumber}`);
    // console.log("[loadQuestion] currentModuleInfo:", currentModuleInfo ? JSON.parse(JSON.stringify(currentModuleInfo)) : "null/undefined");
    // console.log("[loadQuestion] currentQuestionDetails:", currentQuestionDetails ? JSON.parse(JSON.stringify(currentQuestionDetails)) : "null/undefined");
    
    if (!currentModuleInfo || !currentQuestionDetails) {
        console.error("[loadQuestion] CRITICAL: ModuleInfo or QuestionDetails is null/undefined. Aborting question load.");
        if (questionTextMainEl) questionTextMainEl.innerHTML = "<p>Error: Critical data missing for question display (module/question details).</p>";
        if (answerOptionsMainEl) answerOptionsMainEl.innerHTML = "";
        if(totalQFooterEl && currentQFooterEl) {
            currentQFooterEl.textContent = currentQuestionNumber;
            totalQFooterEl.textContent = currentQuizQuestions ? currentQuizQuestions.length : 0;
        }
        updateNavigation();
        return;
    }
    console.log("[loadQuestion] ModuleInfo and QuestionDetails are valid.");
    
    const answerState = getAnswerState(); 
    if (!answerState) { 
        console.error(`[loadQuestion] CRITICAL: getAnswerState() returned undefined. Aborting.`);
        if (questionTextMainEl) questionTextMainEl.innerHTML = "<p>Error: Could not retrieve answer state.</p>";
        return; 
    }
    answerState.timeSpent = parseFloat(answerState.timeSpent) || 0;
    // console.log("[loadQuestion] Answer state retrieved:", answerState);

    // Ensure all critical DOM elements for display are present
    if (!sectionTitleHeader || !questionNumberBoxMainEl || !passagePane || !passageContentEl || !sprInstructionsPane || !sprInstructionsContent || !questionTextMainEl || !answerOptionsMainEl || !sprInputContainerMain || !paneDivider || !mainContentAreaDynamic) {
        console.error("[loadQuestion] CRITICAL: One or more core DOM elements for question display are missing. Aborting.");
        return;
    }
    // console.log("[loadQuestion] All core display DOM elements seem present.");

    sectionTitleHeader.textContent = `Section ${currentModuleIndex + 1}: ${currentModuleInfo.name}`;
    questionNumberBoxMainEl.textContent = currentQuestionDetails.question_number || currentQuestionNumber;
    
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

    mainContentAreaDynamic.classList.toggle('cross-out-active', isCrossOutToolActive && currentQuestionDetails.question_type !== 'student_produced_response');
    if(crossOutToolBtnMain) crossOutToolBtnMain.classList.toggle('active', isCrossOutToolActive && currentQuestionDetails.question_type !== 'student_produced_response');

    passagePane.style.display = 'none';
    passageContentEl.innerHTML = ''; 
    sprInstructionsPane.style.display = 'none';
    sprInstructionsContent.innerHTML = ''; 
    questionTextMainEl.innerHTML = ''; 
    answerOptionsMainEl.innerHTML = ''; 
    paneDivider.style.display = 'none';
    mainContentAreaDynamic.classList.remove('single-pane');
    answerOptionsMainEl.style.display = 'none'; 
    sprInputContainerMain.style.display = 'none'; 
    // console.log("[loadQuestion] Panes reset.");

    if (currentQuestionDetails.question_type === 'student_produced_response') {
        // console.log("[loadQuestion] Setting up SPR layout.");
        mainContentAreaDynamic.classList.remove('single-pane');
        sprInstructionsPane.style.display = 'flex';
        paneDivider.style.display = 'block';
        sprInstructionsContent.innerHTML = (currentModuleInfo.spr_directions || 'SPR Directions Missing') + (currentModuleInfo.spr_examples_table || '');
        questionTextMainEl.innerHTML = currentQuestionDetails.question_text || '<p>Question text missing.</p>';
        sprInputContainerMain.style.display = 'block';
        if(sprInputFieldMain) sprInputFieldMain.value = answerState.spr_answer || '';
        if(sprAnswerPreviewMain) sprAnswerPreviewMain.textContent = `Answer Preview: ${answerState.spr_answer || ''}`;
    } else if (currentModuleInfo.type === "RW" && currentQuestionDetails.question_type.includes('multiple_choice')) {
        // console.log("[loadQuestion] Setting up R&W MCQ layout.");
        mainContentAreaDynamic.classList.remove('single-pane');
        passagePane.style.display = 'flex'; 
        paneDivider.style.display = 'block'; 
        passageContentEl.innerHTML = currentQuestionDetails.question_text || '<p>Question/Passage text missing.</p>'; // R&W question_text goes to left pane
        // questionTextMainEl should remain empty for this layout, options go into answerOptionsMainEl
        answerOptionsMainEl.style.display = 'flex'; 
    } else { // Math MCQs or other types that default to single-pane
        // console.log("[loadQuestion] Setting up single-pane MCQ layout (e.g., Math).");
        mainContentAreaDynamic.classList.add('single-pane');
        questionTextMainEl.innerHTML = currentQuestionDetails.question_text || '<p>Question text missing.</p>';
        answerOptionsMainEl.style.display = 'flex'; 
    }
    // console.log("[loadQuestion] Layout configured based on question type.");

    if (currentQuestionDetails.question_type && currentQuestionDetails.question_type.includes('multiple_choice')) {
        // console.log("[loadQuestion] Rendering MCQ options.");
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
            // Add individual cross-out/undo buttons
            if (isCrossOutToolActive && currentQuestionDetails.question_type !== 'student_produced_response' && !isCrossedOut) {
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
            answerOptionsMainEl.appendChild(containerDiv);
        }
    }
    
    // console.log("[loadQuestion] Attempting MathJax typeset.");
    if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
        MathJax.typesetPromise([passageContentEl, questionTextMainEl, answerOptionsMainEl, sprInstructionsContent])
            .then(() => { /* console.log("[loadQuestion] MathJax typesetting complete."); */ })
            .catch(function (err) { console.error('[loadQuestion] MathJax Typesetting Error:', err); });
    } else {
        console.warn("[loadQuestion] MathJax or MathJax.typesetPromise not available.");
    }
    updateNavigation();
    // console.log("[loadQuestion] Finished.");
}

function recordTimeOnCurrentQuestion() { /* ... (same as P3.1) ... */ }

// --- Event Listeners ---
// This section needs to be carefully re-checked to ensure all listeners are present and correct.
// The main structure of event listeners from P3.1 is largely correct, 
// the problem seems to be what happens *before* they can effectively work (i.e., in loadQuestion).

if(answerOptionsMainEl) { /* ... (same as P3.1) ... */ }
function handleAnswerSelect(optionKey) { /* ... (same as P3.1 - including Bluebook cross-out correction) ... */ }
function handleAnswerCrossOut(optionKey) { /* ... (same as P3.1) ... */ }
function handleAnswerUndoCrossOut(optionKey) { /* ... (same as P3.1) ... */ }
if(crossOutToolBtnMain) { /* ... (same as P3.1) ... */ }
if(sprInputFieldMain) { /* ... (same as P3.1) ... */ }

// --- Navigation Button Event Listeners ---
if(nextBtnFooter) { /* ... (same as P3.1) ... */ }
if(backBtnFooter) { /* ... (same as P3.1) ... */ }
if(reviewNextBtnFooter) { /* ... (same as P3.1) ... */ }
if(reviewBackBtnFooter) { /* ... (same as P3.1) ... */ }

// --- Other Button Event Listeners (Restored from Phase 4 logic) ---
if(startTestPreviewBtn) { /* ... (same as P3.1) ... */ }
if(returnToHomeBtn) returnToHomeBtn.addEventListener('click', () => showView('home-view'));
if(calculatorBtnHeader) calculatorBtnHeader.addEventListener('click', () => toggleModal(calculatorOverlay, true));
if(calculatorCloseBtn) calculatorCloseBtn.addEventListener('click', () => toggleModal(calculatorOverlay, false));
if(referenceBtnHeader) referenceBtnHeader.addEventListener('click', () => toggleModal(referenceSheetPanel, true));
if(referenceSheetCloseBtn) referenceSheetCloseBtn.addEventListener('click', () => toggleModal(referenceSheetPanel, false));
let isCalcDragging = false; let currentX_calc_drag, currentY_calc_drag, initialX_calc_drag, initialY_calc_drag, xOffset_calc_drag = 0, yOffset_calc_drag = 0;
if(calculatorHeaderDraggable) { /* ... (same draggable logic as P3.1) ... */ }
if(highlightsNotesBtn && (passageContentEl || questionTextMainEl) ) { /* ... (same highlight logic as P3.1) ... */ }
function handleTextSelection() { /* ... (same highlight logic as P3.1) ... */ }
if(directionsBtn) { /* ... (same as P3.1) ... */ }
if(directionsModalCloseBtn) directionsModalCloseBtn.addEventListener('click', () => toggleModal(directionsModal, false));
if(directionsModal) directionsModal.addEventListener('click', (e) => { if (e.target === directionsModal) toggleModal(directionsModal, false); });
if(qNavBtnFooter) qNavBtnFooter.addEventListener('click', () => { populateQNavGrid(); toggleModal(qNavPopup, true); }); 
if(qNavCloseBtn) qNavCloseBtn.addEventListener('click', () => toggleModal(qNavPopup, false));
if(qNavGotoReviewBtn) { /* ... (same as P3.1) ... */ }
if(markReviewCheckboxMain) { /* ... (same as P3.1) ... */ }
if(timerToggleBtn) timerToggleBtn.addEventListener('click', () => handleTimerToggle(timerTextEl, timerClockIconEl, timerToggleBtn));
if(reviewTimerToggleBtn && reviewTimerText && reviewTimerClockIcon) reviewTimerToggleBtn.addEventListener('click', () => handleTimerToggle(reviewTimerText, reviewTimerClockIcon, reviewTimerToggleBtn));
if(moreBtn) moreBtn.addEventListener('click', (e) => { /* ... (same as P3.1) ... */ });
document.body.addEventListener('click', (e) => { /* ... (same as P3.1) ... */ });
if(moreMenuDropdown) moreMenuDropdown.addEventListener('click', (e) => e.stopPropagation()); 
if(moreUnscheduledBreakBtn) moreUnscheduledBreakBtn.addEventListener('click', () => { /* ... (same as P3.1) ... */ });
if(understandLoseTimeCheckbox) understandLoseTimeCheckbox.addEventListener('change', () => { /* ... (same as P3.1) ... */ });
if(unscheduledBreakCancelBtn) unscheduledBreakCancelBtn.addEventListener('click', () => toggleModal(unscheduledBreakConfirmModal, false));
if(unscheduledBreakConfirmBtn) unscheduledBreakConfirmBtn.addEventListener('click', () => { /* ... (same as P3.1) ... */ });
if(moreExitExamBtn) moreExitExamBtn.addEventListener('click', () => { /* ... (same as P3.1) ... */ });
if(exitExamCancelBtn) exitExamCancelBtn.addEventListener('click', () => toggleModal(exitExamConfirmModal, false));
if(exitExamConfirmBtn) exitExamConfirmBtn.addEventListener('click', () => { /* ... (same as P3.1) ... */ });

// Ensure the startTestPreviewBtn listener is correctly defined
if(startTestPreviewBtn) {
    startTestPreviewBtn.addEventListener('click', async () => {
        console.log("[startTestPreviewBtn] Clicked.");
        currentModuleIndex = 0;
        currentQuestionNumber = 1;
        userAnswers = {};
        isTimerHidden = false;
        isCrossOutToolActive = false;
        isHighlightingActive = false;
        questionStartTime = 0; 
        if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
        if(calculatorOverlay && calculatorOverlay.classList.contains('visible')) calculatorOverlay.classList.remove('visible');
        if(referenceSheetPanel && referenceSheetPanel.classList.contains('visible')) referenceSheetPanel.classList.remove('visible');

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
                console.error("[startTestPreviewBtn] Failed to load initial quiz data or no questions found.");
                alert("Could not start the test. Please check the console for errors.");
                showView('home-view');
            }
        } else {
            console.error("[startTestPreviewBtn] Test flow is empty. Cannot start test.");
            alert("No test configured to start.");
        }
    });
}
