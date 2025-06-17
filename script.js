// --- script.js (Phase 3 - Revision 4 - Ultra-Targeted Debugging) ---

// --- Utility Functions (Define these FIRST) ---
function toggleModal(modalElement, show) { /* ... (same) ... */ }

// --- GLOBAL CONFIGURATION & STATE ---
let currentQuizQuestions = []; 
let currentTestFlow = [];      
let currentView = 'home';
let currentModuleIndex = 0; // Should be a number
let currentQuestionNumber = 1; // Should be a number
let userAnswers = {}; // Should be an object
let isTimerHidden = false;
let isCrossOutToolActive = false;
let isHighlightingActive = false;
let questionStartTime = 0; 

const moduleMetadata = { /* ... (same) ... */ };
const GITHUB_JSON_BASE_URL = 'https://raw.githubusercontent.com/ghiassabir/Bluebook-UI-UX-with-json-real-data-/main/data/json/'; 
async function loadQuizData(quizName) { /* ... (same as P3.3, with [loadQuizData] prefix) ... */ }

// --- DOM Elements ---
// ... (all DOM element consts same as P3.2/P3.3) ...
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
function getCurrentModule() { return moduleMetadata[currentTestFlow[currentModuleIndex]] || null; }
function getCurrentQuestionData() { return currentQuizQuestions && currentQuizQuestions.length > 0 && currentQuestionNumber > 0 && currentQuestionNumber <= currentQuizQuestions.length ? currentQuizQuestions[currentQuestionNumber - 1] : null; }

function getAnswerStateKey(moduleIdx = currentModuleIndex, qNum = currentQuestionNumber) {
    if (typeof moduleIdx !== 'number' || typeof qNum !== 'number') {
        console.error(`[getAnswerStateKey] CRITICAL: Invalid types for moduleIdx (${typeof moduleIdx}) or qNum (${typeof qNum}).`);
        return "error-key"; // Return a dummy key to prevent further issues
    }
    return `${moduleIdx}-${qNum}`;
}

function getAnswerState(moduleIdx = currentModuleIndex, qNum = currentQuestionNumber) {
    const key = getAnswerStateKey(moduleIdx, qNum);
    if (key === "error-key") {
         console.error(`[getAnswerState] Received error-key from getAnswerStateKey. Cannot proceed.`);
         return undefined; // Explicitly return undefined if key is bad
    }
    if (typeof userAnswers !== 'object' || userAnswers === null) {
        console.error(`[getAnswerState] CRITICAL: userAnswers is not an object! Value:`, userAnswers);
        userAnswers = {}; // Attempt to recover by resetting
    }
    if (!userAnswers[key]) {
        userAnswers[key] = { selected: null, spr_answer: '', marked: false, crossedOut: [], timeSpent: 0 };
    }
    return userAnswers[key];
}

function populateQNavGrid() { /* ... (same as P3.1) ... */ }
function renderReviewPage() { /* ... (same as P3.1) ... */ }
let confettiAnimationId; const confettiParticles = []; function startConfetti() { /* ... (same) ... */ }
function stopConfetti() { /* ... (same) ... */ }
function handleTimerToggle(textEl, iconEl, btnEl) { /* ... (same) ... */ }
function updateNavigation() { /* ... (same as P3.1) ... */ }
function showView(viewId) { /* ... (same as P3.2) ... */ }

// --- Core UI Update `loadQuestion()` (WITH ULTRA TARGETED LOGGING & TRY-CATCH) ---
function loadQuestion() {
    console.log(`[loadQuestion] ===== P3.4 START ===== Current View: ${currentView}`);
    if (!testInterfaceViewEl || !testInterfaceViewEl.classList.contains('active')) {
        console.log("[loadQuestion] Not in test-interface-view. Exiting.");
        return;
    }
    console.log("[loadQuestion] Setting questionStartTime.");
    questionStartTime = Date.now(); 

    console.log("[loadQuestion] Calling getCurrentModule().");
    const currentModuleInfo = getCurrentModule(); 
    console.log("[loadQuestion] Calling getCurrentQuestionData().");
    const currentQuestionDetails = getCurrentQuestionData(); 
    
    console.log(`[loadQuestion] ModuleIndex: ${currentModuleIndex} (type: ${typeof currentModuleIndex}), QNumber: ${currentQuestionNumber} (type: ${typeof currentQuestionNumber})`);
    
    if (!currentModuleInfo) {
        console.error("[loadQuestion] CRITICAL: currentModuleInfo is null/undefined. Aborting.");
        if (questionTextMainEl) questionTextMainEl.innerHTML = "<p>Error: Module metadata missing.</p>";
        updateNavigation(); return;
    }
    console.log("[loadQuestion] currentModuleInfo is valid:", currentModuleInfo.name);

    if (!currentQuestionDetails) {
        console.error("[loadQuestion] CRITICAL: currentQuestionDetails is null/undefined. Aborting.");
        if (questionTextMainEl) questionTextMainEl.innerHTML = "<p>Error: Question data missing for current number.</p>";
        updateNavigation(); return;
    }
    console.log("[loadQuestion] currentQuestionDetails type:", typeof currentQuestionDetails);
    console.log("[loadQuestion] currentQuestionDetails (brief):", { question_id: currentQuestionDetails.question_id, question_text_snippet: String(currentQuestionDetails.question_text).substring(0,30) });

    try {
        console.log("[loadQuestion] Attempting to log currentQuestionDetails.question_id");
        console.log("[loadQuestion] currentQuestionDetails.question_id:", currentQuestionDetails.question_id);
    } catch (e) {
        console.error("[loadQuestion] ERROR accessing currentQuestionDetails.question_id:", e);
        console.error("[loadQuestion] Full currentQuestionDetails object:", currentQuestionDetails); // Log the whole object
        if (questionTextMainEl) questionTextMainEl.innerHTML = "<p>Error: Problem accessing question_id.</p>";
        updateNavigation(); return;
    }
    
    let answerState;
    try {
        console.log("[loadQuestion] Calling getAnswerState(). Indices:", currentModuleIndex, currentQuestionNumber);
        answerState = getAnswerState(currentModuleIndex, currentQuestionNumber); 
    } catch (e) {
        console.error("[loadQuestion] ERROR during getAnswerState() call:", e);
        if (questionTextMainEl) questionTextMainEl.innerHTML = "<p>Error: Problem in getAnswerState().</p>";
        updateNavigation(); return;
    }

    if (!answerState) { 
        console.error(`[loadQuestion] CRITICAL: getAnswerState() returned undefined. Aborting.`);
        if (questionTextMainEl) questionTextMainEl.innerHTML = "<p>Error: Could not retrieve answer state.</p>";
        updateNavigation(); return; 
    }
    answerState.timeSpent = parseFloat(answerState.timeSpent) || 0;
    console.log("[loadQuestion] Answer state retrieved successfully.");

    // DOM Element Check
    console.log("[loadQuestion] Checking for critical DOM elements...");
    // ... (same DOM element check as P3.3, if it passes, execution continues)
    if (!sectionTitleHeader || !questionNumberBoxMainEl || !passagePane || !passageContentEl || !sprInstructionsPane || !sprInstructionsContent || !questionTextMainEl || !answerOptionsMainEl || !sprInputContainerMain || !paneDivider || !mainContentAreaDynamic || !markReviewCheckboxMain || !flagIconMain || !crossOutToolBtnMain) {
        console.error("[loadQuestion] CRITICAL: One or more core DOM elements for question display are missing. Aborting.");
        return;
    }
    console.log("[loadQuestion] All critical DOM elements seem present.");


    // --- The rest of loadQuestion from P3.3 (DOM manipulations) ---
    // ... (from "console.log("[loadQuestion] Setting section title and question number box.");" onwards)
    console.log("[loadQuestion] Setting section title and question number box.");
    sectionTitleHeader.textContent = `Section ${currentModuleIndex + 1}: ${currentModuleInfo.name}`;
    questionNumberBoxMainEl.textContent = currentQuestionDetails.question_number || currentQuestionNumber;
    
    console.log("[loadQuestion] Toggling header buttons based on module type.");
    const isMathTypeModule = currentModuleInfo.type === "Math";
    if(highlightsNotesBtn) highlightsNotesBtn.classList.toggle('hidden', isMathTypeModule);
    if(calculatorBtnHeader) calculatorBtnHeader.classList.toggle('hidden', !isMathTypeModule);
    if(referenceBtnHeader) referenceBtnHeader.classList.toggle('hidden', !isMathTypeModule);
    if(crossOutToolBtnMain) crossOutToolBtnMain.classList.toggle('hidden', currentQuestionDetails.question_type === 'student_produced_response');

    console.log("[loadQuestion] Setting mark for review state.");
    markReviewCheckboxMain.checked = answerState.marked;
    flagIconMain.style.fill = answerState.marked ? 'var(--bluebook-red-flag)' : 'none';
    flagIconMain.style.color = answerState.marked ? 'var(--bluebook-red-flag)' : '#9ca3af';

    console.log("[loadQuestion] Setting cross-out tool active state.");
    mainContentAreaDynamic.classList.toggle('cross-out-active', isCrossOutToolActive && currentQuestionDetails.question_type !== 'student_produced_response');
    if(crossOutToolBtnMain) crossOutToolBtnMain.classList.toggle('active', isCrossOutToolActive && currentQuestionDetails.question_type !== 'student_produced_response');

    console.log("[loadQuestion] Resetting pane visibility and content.");
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
    console.log("[loadQuestion] Panes reset complete.");

    if (currentQuestionDetails.question_type === 'student_produced_response') { /* ... */ }
    else if (currentModuleInfo.type === "RW" && currentQuestionDetails.question_type.includes('multiple_choice')) { /* ... */ }
    else { /* ... */ }
    console.log("[loadQuestion] Layout configured.");

    if (currentQuestionDetails.question_type && currentQuestionDetails.question_type.includes('multiple_choice')) {
        console.log("[loadQuestion] Rendering MCQ options.");
        const options = {};
        if (currentQuestionDetails.option_a !== undefined && currentQuestionDetails.option_a !== null) options['A'] = currentQuestionDetails.option_a;
        if (currentQuestionDetails.option_b !== undefined && currentQuestionDetails.option_b !== null) options['B'] = currentQuestionDetails.option_b;
        if (currentQuestionDetails.option_c !== undefined && currentQuestionDetails.option_c !== null) options['C'] = currentQuestionDetails.option_c;
        if (currentQuestionDetails.option_d !== undefined && currentQuestionDetails.option_d !== null) options['D'] = currentQuestionDetails.option_d;
        if (currentQuestionDetails.option_e !== undefined && currentQuestionDetails.option_e !== null && String(currentQuestionDetails.option_e).trim() !== "") options['E'] = currentQuestionDetails.option_e;

        for (const [key, value] of Object.entries(options)) { /* ... (option element creation, same as P3.3) ... */ }
        console.log("[loadQuestion] MCQ options rendered.");
    }
    
    console.log("[loadQuestion] Attempting MathJax typeset.");
    if (typeof MathJax !== "undefined" && MathJax.typesetPromise) { /* ... */ }
    else { console.warn("[loadQuestion] MathJax or MathJax.typesetPromise not available."); }
    
    console.log("[loadQuestion] Calling updateNavigation().");
    updateNavigation();
    console.log("[loadQuestion] ===== FINISHED =====");
}


function recordTimeOnCurrentQuestion() { /* ... (same as P3.1) ... */ }

// --- Event Listeners ---
// ... (Assume all event listeners from P3.3 are here and mostly correct)
// The critical part is ensuring loadQuestion() completes.
if(answerOptionsMainEl) { /* ... (same as P3.1) ... */ }
function handleAnswerSelect(optionKey) { /* ... (same as P3.1) ... */ }
function handleAnswerCrossOut(optionKey) { /* ... (same as P3.1) ... */ }
function handleAnswerUndoCrossOut(optionKey) { /* ... (same as P3.1) ... */ }
if(crossOutToolBtnMain) { /* ... (same as P3.1) ... */ }
if(sprInputFieldMain) { /* ... (same as P3.1) ... */ }
if(nextBtnFooter) { /* ... (same as P3.1) ... */ }
if(backBtnFooter) { /* ... (same as P3.1) ... */ }
if(reviewNextBtnFooter) { /* ... (same as P3.1) ... */ }
if(reviewBackBtnFooter) { /* ... (same as P3.1) ... */ }
if(startTestPreviewBtn) { /* ... (same as P3.1/P3.3) ... */ }
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
// Ensure the startTestPreviewBtn listener is correctly defined as it was in P3.3
if(startTestPreviewBtn) {
    startTestPreviewBtn.addEventListener('click', async () => {
        console.log("[startTestPreviewBtn] Clicked.");
        currentModuleIndex = 0;
        currentQuestionNumber = 1;
        userAnswers = {}; // Ensure userAnswers is an object here
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
