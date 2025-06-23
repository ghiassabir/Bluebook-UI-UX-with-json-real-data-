// --- script.js (Consolidated for Parameter-Driven Launch, Email Prompt, and Bypassed Home Buttons) ---

// --- Utility Functions (Define these FIRST) ---
function toggleModal(modalElement, show) {
    if (!modalElement) {
        return;
    }
    modalElement.classList.toggle('visible', show);
}

// --- GLOBAL CONFIGURATION & STATE ---
let studentEmailForSubmission = null; 
let currentQuizQuestions = []; 
let currentTestFlow = [];      
let currentView = 'home'; 
let currentModuleIndex = 0;
let currentQuestionNumber = 1; 
let userAnswers = {}; 
let isTimerHidden = false;
let globalOriginPageId = null; 
let globalQuizSource = null;  
let isCrossOutToolActive = false;
let isHighlightingActive = false;
let questionStartTime = 0;
let moduleTimerInterval;
let currentModuleTimeLeft = 0;
let currentModuleTimeUp = false; 
let currentInteractionMode = 'full_test'; 
let practiceQuizTimerInterval;
let practiceQuizTimeElapsed = 0;

const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwneCF0xq9X-F-9AIxAiHpYFmRTErCzCPXlsWRloLRDWBGqwLEZC4NldCCAuND0jxUL/exec'; 

const fullTestDefinitions = {
    "DT-T0": { flow: ["DT-T0-RW-M1", "DT-T0-RW-M2", "DT-T0-MT-M1", "DT-T0-MT-M2"], name: "Digital SAT Practice Test 0 Preview" },
    "CBT-T4": { flow: ["CBT-T4-RW-M1", "CBT-T4-RW-M2", "CBT-T4-MT-M1", "CBT-T4-MT-M2"], name: "CB Practice Test 4" },
    "CBT-T5": { flow: ["CBT-T5-RW-M1", "CBT-T5-RW-M2", "CBT-T5-MT-M1", "CBT-T5-MT-M2"], name: "CB Practice Test 5" },
    "CBT-T6": { flow: ["CBT-T6-RW-M1", "CBT-T6-RW-M2", "CBT-T6-MT-M1", "CBT-T6-MT-M2"], name: "CB Practice Test 6" },
    "CBT-T7": { flow: ["CBT-T7-RW-M1", "CBT-T7-RW-M2", "CBT-T7-MT-M1", "CBT-T7-MT-M2"], name: "CB Practice Test 7" },
    "CBT-T8": { flow: ["CBT-T8-RW-M1", "CBT-T8-RW-M2", "CBT-T8-MT-M1", "CBT-T8-MT-M2"], name: "CB Practice Test 8" },
    "CBT-T9": { flow: ["CBT-T9-RW-M1", "CBT-T9-RW-M2", "CBT-T9-MT-M1", "CBT-T9-MT-M2"], name: "CB Practice Test 9" },
    "CBT-T10": { flow: ["CBT-T10-RW-M1", "CBT-T10-RW-M2", "CBT-T10-MT-M1", "CBT-T10-MT-M2"], name: "CB Practice Test 10" }
};

const moduleMetadata = {
    "DT-T0-RW-M1": { name: "Reading & Writing - Module 1", type: "RW", durationSeconds: 1920, directions: "R&W Module 1 Directions...", spr_directions: null, spr_examples_table: null },
    "DT-T0-RW-M2": { name: "Reading & Writing - Module 2", type: "RW", durationSeconds: 1920, directions: "R&W Module 2 Directions...", spr_directions: null, spr_examples_table: null },
    "DT-T0-MT-M1": { name: "Math - Module 1", type: "Math", durationSeconds: 2100, directions: "Math Module 1 Directions...", passageText: null, spr_directions: `<h3>SPR Directions...</h3>`, spr_examples_table: `<table>...</table>` },
    "DT-T0-MT-M2": { name: "Math - Module 2", type: "Math", durationSeconds: 2100, directions: "Math Module 2 Directions...", passageText: null, spr_directions: `<h3>SPR Directions...</h3>`, spr_examples_table: `<table>...</table>` },
    // Example for a single quiz that might be loaded by quiz_name
    "G-C3-EOC": { name: "Grammar: Sentences & Fragments EOC", type: "RW", directions: "Answer the following questions about sentences and fragments.", durationSeconds: null /* No duration for upward timer */ }
    // Populate with actual metadata for ALL quiz_names used in fullTestDefinitions flows
    // For CBT-T4 to T10, assuming similar structure, e.g.:
    // "CBT-T4-RW-M1": { name: "Test 4: R&W M1", type: "RW", durationSeconds: 1920, ... },
    // ... and so on for all modules you intend to use.
};

const GITHUB_JSON_BASE_URL = 'https://raw.githubusercontent.com/ghiassabir/Bluebook-UI-UX-with-json-real-data-/main/data/json/'; 

async function loadQuizData(quizName) {
    let actualQuizNameToLoad = quizName;
    // This mapping is only if your flow uses a key like "DT-T0-RW-M2" 
    // but the actual JSON file is named "DT-T0-RW-M1.json".
    // If "DT-T0-RW-M2.json" exists and should be loaded, remove this mapping for it.
    if (quizName === "DT-T0-RW-M2" && !moduleMetadata[quizName]?.actualFile) actualQuizNameToLoad = "DT-T0-RW-M1";
    else if (quizName === "DT-T0-MT-M2" && !moduleMetadata[quizName]?.actualFile) actualQuizNameToLoad = "DT-T0-MT-M1";
    // Add mappings for CBT-T4-M2 to CBT-T10-M2 if they also reuse M1 data
    // Example: else if (quizName === "CBT-T4-RW-M2" && !moduleMetadata[quizName]?.actualFile) actualQuizNameToLoad = "CBT-T4-RW-M1";


    const url = `${GITHUB_JSON_BASE_URL}${actualQuizNameToLoad}.json`;
    console.log(`DEBUG loadQuizData: Attempting to fetch: ${url} (for logical quizName: ${quizName})`);
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${actualQuizNameToLoad}.json (logical: ${quizName})`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error(`Data for ${actualQuizNameToLoad}.json not an array.`);
        currentQuizQuestions = data; 
        console.log(`DEBUG loadQuizData: Loaded ${currentQuizQuestions.length}q for ${quizName} (from ${actualQuizNameToLoad}.json).`);
        return true;
    } catch (error) {
        console.error("Error loading quiz data:", error);
        alert(`Failed to load quiz data for ${quizName} (tried ${actualQuizNameToLoad}.json): ${error.message}.`);
        currentQuizQuestions = []; 
        return false;
    }
}

// --- DOM Elements (Assume these are all correct from your working HTML) ---
const allAppViews = document.querySelectorAll('.app-view');
const homeViewEl = document.getElementById('home-view');
const testInterfaceViewEl = document.getElementById('test-interface-view');
const moduleOverViewEl = document.getElementById('module-over-view');
const finishedViewEl = document.getElementById('finished-view');
const reviewPageViewEl = document.getElementById('review-page-view');
const emailInputViewEl = document.getElementById('email-input-view'); 
const studentEmailField = document.getElementById('student-email-field'); 
const submitEmailBtn = document.getElementById('submit-email-btn'); 
const confettiCanvas = document.getElementById('confetti-canvas');
const returnToHomeBtn = document.getElementById('return-to-home-btn');
// ... (all your other const declarations for DOM elements from your working script)
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
// const startFullPracticeTestBtn = document.getElementById('start-full-practice-test-btn'); // No longer primary entry
// const startSinglePracticeQuizBtn = document.getElementById('start-single-practice-quiz-btn'); // No longer primary entry
const manualBreakViewEl = document.getElementById('manual-break-view'); 
const continueAfterBreakBtn = document.getElementById('continue-after-break-btn'); 

// --- Helper Functions ---
function initializeStudentIdentifier() {
    const storedEmail = localStorage.getItem('bluebookStudentEmail');
    if (storedEmail && storedEmail.trim() !== "" && storedEmail.includes('@')) {
        studentEmailForSubmission = storedEmail;
        console.log(`DEBUG initializeStudentIdentifier: Email found in localStorage: ${studentEmailForSubmission}`);
        return true;
    } else {
        studentEmailForSubmission = null; 
        console.log(`DEBUG initializeStudentIdentifier: No valid email in localStorage.`);
        return false;
    }
}

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
        const currentQuizNameForState = (currentTestFlow && currentTestFlow[moduleIdx]) ? currentTestFlow[moduleIdx] : "UNKNOWN_QUIZ_AT_GETSTATE_INIT";
        const questionDetails = (moduleIdx === currentModuleIndex && currentQuizQuestions && currentQuizQuestions[qNum - 1]) 
                               ? currentQuizQuestions[qNum - 1] 
                               : null;
        userAnswers[key] = { 
            selected: null, spr_answer: '', marked: false, crossedOut: [], timeSpent: 0,
            q_id: questionDetails ? questionDetails.question_id : `M${moduleIdx}-Q${qNum}-tmp`, 
            correct_ans: questionDetails ? questionDetails.correct_answer : null,
            question_type_from_json: questionDetails ? questionDetails.question_type : null,
            quizName_from_flow: currentQuizNameForState,
            selectionChanges: 0 
        };
    }
    // Ensure details are populated if they were missed at init (e.g. if getAnswerState was called before loadQuestion for current q)
    if (userAnswers[key] && (userAnswers[key].q_id.endsWith('-tmp') || !userAnswers[key].correct_ans || userAnswers[key].quizName_from_flow.startsWith("UNKNOWN"))) {
         const questionDetails = (moduleIdx === currentModuleIndex && currentQuizQuestions && currentQuizQuestions[qNum - 1]) 
                               ? currentQuizQuestions[qNum - 1] 
                               : null;
        if (questionDetails) {
            userAnswers[key].q_id = questionDetails.question_id;
            userAnswers[key].correct_ans = questionDetails.correct_answer;
            userAnswers[key].question_type_from_json = questionDetails.question_type;
        }
        if(currentTestFlow && currentTestFlow[moduleIdx]) { // Update quizName if it was unknown
             userAnswers[key].quizName_from_flow = currentTestFlow[moduleIdx];
        }
    }
    return userAnswers[key];
}

function recordTimeOnCurrentQuestion() {
    if (questionStartTime > 0 && currentQuizQuestions.length > 0 && currentQuestionNumber > 0 && currentQuestionNumber <= currentQuizQuestions.length) {
        if (currentQuizQuestions[currentQuestionNumber - 1]) { 
            const endTime = Date.now();
            const timeSpentSeconds = (endTime - questionStartTime) / 1000;
            const answerState = getAnswerState(currentModuleIndex, currentQuestionNumber); 
            if (answerState) { 
                answerState.timeSpent = (parseFloat(answerState.timeSpent) || 0) + timeSpentSeconds;
            }
        }
    }
    questionStartTime = 0; 
}

function updateModuleTimerDisplay(seconds) { /* ... (from your script) ... */ }
function startModuleTimer(durationSeconds) { /* ... (from your script) ... */ }
function updatePracticeQuizTimerDisplay(seconds) { /* ... (from your script) ... */ }
function startPracticeQuizTimer() { /* ... (from your script) ... */ }
function populateQNavGrid() { /* ... (from your script) ... */ }
function renderReviewPage() { /* ... (from your script) ... */ }
function startConfetti() { /* ... (from your script) ... */ }
function stopConfetti() { /* ... (from your script) ... */ }
function handleTimerToggle(textEl, iconEl, btnEl) { /* ... (from your script) ... */ }
function extractPassageAndStem(fullText) { /* ... (from your script) ... */ }


// --- View Management ---
function showView(viewId) {
    console.log(`DEBUG showView: Attempting to switch to view: ${viewId}. CMI: ${currentModuleIndex}, CQN: ${currentQuestionNumber}`);
    currentView = viewId; 
    allAppViews.forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    } else {
        console.error(`View not found for ID: ${viewId}`);
        return;
    }

    if (viewId !== 'test-interface-view' && viewId !== 'review-page-view' && 
        viewId !== 'module-over-view' && viewId !== 'manual-break-view') {
        if (moduleTimerInterval) {
            clearInterval(moduleTimerInterval);
            console.log("Module countdown timer stopped due to view change.");
        }
        if (practiceQuizTimerInterval) {
            clearInterval(practiceQuizTimerInterval);
            console.log("Practice quiz (upward) timer stopped due to view change.");
        }
    }

    if (viewId === 'test-interface-view') {
        if(qNavBtnFooter) qNavBtnFooter.style.display = 'flex';
        if(backBtnFooter) backBtnFooter.style.display = 'inline-block';
        if(nextBtnFooter) nextBtnFooter.style.display = 'inline-block';
        console.log(`DEBUG showView for 'test-interface-view': About to call loadQuestion. CMI: ${currentModuleIndex}, CQN: ${currentQuestionNumber}, CQQ.length: ${currentQuizQuestions ? currentQuizQuestions.length : 'N/A'}`);
        loadQuestion();
    } else if (viewId === 'review-page-view') {
        if(qNavBtnFooter) qNavBtnFooter.style.display = 'none';
        renderReviewPage();
    } else if (viewId === 'finished-view') {
        startConfetti();
        if (moduleTimerInterval) clearInterval(moduleTimerInterval); 
        if (practiceQuizTimerInterval) clearInterval(practiceQuizTimerInterval);
        submitQuizData(); 
    } else if (viewId === 'home-view') {
        stopConfetti();
        // Don't reset all state here if coming from email input, 
        // as URL params might still need to be processed by home buttons if they existed.
        // State reset happens when a *new* test/quiz is truly started.
        updateModuleTimerDisplay(0); 
        updatePracticeQuizTimerDisplay(0);
        // Update user name display on home view if email is known
        const homeUserNameEl = document.getElementById('home-user-name');
        if(homeUserNameEl && studentEmailForSubmission) {
            homeUserNameEl.textContent = studentEmailForSubmission.split('@')[0]; // Show part before @
        } else if (homeUserNameEl) {
            homeUserNameEl.textContent = "Guest";
        }
    } else if (viewId === 'manual-break-view') {
        console.log("DEBUG showView: Now in manual break view.");
        if (moduleTimerInterval) clearInterval(moduleTimerInterval); 
        if (practiceQuizTimerInterval) clearInterval(practiceQuizTimerInterval);
        // Start 10-minute break timer here
    }
    updateNavigation();
}

// --- Core UI Update `loadQuestion()` ---
function loadQuestion() { /* ... (Paste your entire working loadQuestion here from your script, including extractPassageAndStem and MathJax logic) ... */ }

// --- Event Listeners ---
// (All existing, working event listeners for answer interactions, tools, modals, navigation buttons should be here)
// Ensure they are IDENTICAL to your working `script js phase 6 quiz and test view.txt`
// This includes:
// answerOptionsMainEl listener
// handleAnswerSelect(optionKey)
// handleAnswerCrossOut(optionKey)
// handleAnswerUndoCrossOut(optionKey)
// crossOutToolBtnMain listener
// sprInputFieldMain listeners
// updateNavigation() // Definition
// nextButtonClickHandler()
// reviewNextButtonClickHandler() // The one that bypasses manual break
// backButtonClickHandler()
// nextBtnFooter listener
// reviewNextBtnFooter listener
// backBtnFooter listener
// returnToHomeBtn listener
// calculatorBtnHeader, calculatorCloseBtn, referenceBtnHeader, referenceSheetCloseBtn listeners
// calculatorHeaderDraggable logic
// highlightsNotesBtn listener, handleTextSelection()
// directionsBtn, directionsModalCloseBtn, directionsModal listeners
// qNavBtnFooter, qNavCloseBtn, qNavGotoReviewBtn listeners
// markReviewCheckboxMain listener
// timerToggleBtn, reviewDirectionsBtn, reviewTimerToggleBtn, reviewBackBtnFooter listeners
// All 'moreMenu' related listeners
// continueAfterBreakBtn listener (the simplified one, as break is bypassed)

// --- Submission Logic ---
async function submitQuizData() { /* ... (IDENTICAL to your working version) ... */ }


// --- Initial Home Screen Button Event Listeners (Now COMMENTED OUT) ---
/*
if(startFullPracticeTestBtn) {
    startFullPracticeTestBtn.addEventListener('click', async () => {
        // This logic is now primarily handled by DOMContentLoaded when no URL params are present
        // or by submitEmailBtn if email was entered first.
        // If you still want these buttons on a home screen that's shown *after* email validation
        // and *without* URL params, then this logic would need to be slightly different
        // (e.g., not call initializeStudentIdentifier() again).
        // For a pure parameter-driven player, these internal start buttons are less critical.
        console.log("DEBUG: Internal 'Start Full Practice Test' button clicked (should ideally be launched by URL params now).");
        // ... (old logic, but ensure it doesn't conflict with DOMContentLoaded flow)
    });
}

if(startSinglePracticeQuizBtn) {
    startSinglePracticeQuizBtn.addEventListener('click', async () => {
        console.log("DEBUG: Internal 'Start Single Practice Quiz' button clicked (should ideally be launched by URL params now).");
        // ... (old logic)
    });
}
*/

// --- Email Input Screen Logic ---
if (submitEmailBtn) {
    submitEmailBtn.addEventListener('click', async () => {
        if (studentEmailField && studentEmailField.value.trim() !== "" && studentEmailField.value.includes('@')) {
            studentEmailForSubmission = studentEmailField.value.trim();
            localStorage.setItem('bluebookStudentEmail', studentEmailForSubmission);
            console.log(`DEBUG submitEmailBtn: Email submitted: ${studentEmailForSubmission}, saved.`);
            
            const urlParams = new URLSearchParams(window.location.search);
            const quizNameFromUrl = urlParams.get('quiz_name');
            const testIdFromUrl = urlParams.get('test_id');

            console.log(`DEBUG submitEmailBtn: After email. URL Params - quiz_name: '${quizNameFromUrl}', test_id: '${testIdFromUrl}'`);

            let launched = false;
            if (testIdFromUrl) {
                console.log(`DEBUG submitEmailBtn: Launching full test '${testIdFromUrl}' after email.`);
                if (fullTestDefinitions[testIdFromUrl]) {
                    currentInteractionMode = 'full_test';
                    currentTestFlow = fullTestDefinitions[testIdFromUrl].flow;
                    currentModuleIndex = 0; currentQuestionNumber = 1; userAnswers = {};
                    /* reset other states */
                    isTimerHidden = false; isCrossOutToolActive = false; isHighlightingActive = false;
                    if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
                    if(calculatorOverlay) calculatorOverlay.classList.remove('visible');
                    if(referenceSheetPanel) referenceSheetPanel.classList.remove('visible');
                    currentModuleTimeUp = false;

                    if (currentTestFlow && currentTestFlow.length > 0) {
                        const firstQuizName = currentTestFlow[currentModuleIndex];
                        const moduleInfo = moduleMetadata[firstQuizName];
                        let jsonToLoad = firstQuizName;
                        if (moduleMetadata[firstQuizName]?.isPlaceholderFor) jsonToLoad = moduleMetadata[firstQuizName].isPlaceholderFor;
                        else if (firstQuizName === "DT-T0-RW-M2" && !moduleMetadata[firstQuizName]?.actualFile) jsonToLoad = "DT-T0-RW-M1"; // Fallback if you remove actualFile/isPlaceholderFor
                        else if (firstQuizName === "DT-T0-MT-M2" && !moduleMetadata[firstQuizName]?.actualFile) jsonToLoad = "DT-T0-MT-M1";


                        const success = await loadQuizData(jsonToLoad);
                        if (success && currentQuizQuestions.length > 0) {
                            if (moduleInfo && typeof moduleInfo.durationSeconds === 'number') {
                                startModuleTimer(moduleInfo.durationSeconds);
                            } else { updateModuleTimerDisplay(0); }
                            populateQNavGrid();
                            showView('test-interface-view');
                            launched = true;
                        }
                    }
                } else { alert(`Unknown Test ID: ${testIdFromUrl}.`); }
                if (!launched) { showView('home-view'); } // Fallback

            } else if (quizNameFromUrl) {
                console.log(`DEBUG submitEmailBtn: Launching single quiz '${quizNameFromUrl}' after email.`);
                currentInteractionMode = 'single_quiz';
                currentTestFlow = [quizNameFromUrl];
                currentModuleIndex = 0; currentQuestionNumber = 1; userAnswers = {};
                /* reset other states */
                 isTimerHidden = false; isCrossOutToolActive = false; isHighlightingActive = false;
                if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
                if(calculatorOverlay) calculatorOverlay.classList.remove('visible');
                if(referenceSheetPanel) referenceSheetPanel.classList.remove('visible');
                currentModuleTimeUp = false; 

                const success = await loadQuizData(quizNameFromUrl);
                if (success && currentQuizQuestions.length > 0) {
                    startPracticeQuizTimer();
                    populateQNavGrid();
                    showView('test-interface-view');
                    launched = true;
                }
                if (!launched) { 
                    alert(`Could not load quiz: ${quizNameFromUrl}.`);
                    showView('home-view'); 
                }
            } 
            
            if (!launched) { // If neither test_id nor quiz_name was valid or present in URL
                console.log("DEBUG submitEmailBtn: No quiz/test in URL params after email. Showing home view (message page).");
                showView('home-view');
            }
        } else {
            alert("Please enter a valid email address.");
        }
    });
}


// --- DOMContentLoaded (This is the primary entry point) --- 
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DEBUG DOMContentLoaded: Initializing application.");
    const emailIsValid = initializeStudentIdentifier(); 
    console.log(`DEBUG DOMContentLoaded: Email valid from localStorage? ${emailIsValid}. Current email: ${studentEmailForSubmission}`);

    const urlParams = new URLSearchParams(window.location.search);
    const quizNameFromUrl = urlParams.get('quiz_name');
    const testIdFromUrl = urlParams.get('test_id'); 
    const sourceFromUrl = urlParams.get('source'); 
    globalOriginPageId = urlParams.get('originPageId'); 

    if (sourceFromUrl) {
        globalQuizSource = sourceFromUrl;
        console.log(`DEBUG DOMContentLoaded: URL 'source' parameter found: ${globalQuizSource}`);
    }
    if (globalOriginPageId) {
        console.log(`DEBUG DOMContentLoaded: URL 'originPageId' parameter found: ${globalOriginPageId}`);
    }

    if (!emailIsValid) {
        console.log(`DEBUG DOMContentLoaded: No valid email. Showing email input screen. URL params (if any): quiz_name=${quizNameFromUrl}, test_id=${testIdFromUrl}`);
        showView('email-input-view'); // Email is required first. submitEmailBtn will handle URL params.
    } else {
        // Email is valid. Proceed to check URL params for direct launch.
        console.log(`DEBUG DOMContentLoaded: Email is valid (${studentEmailForSubmission}). Checking for direct launch params.`);
        let launchedDirectly = false;

        if (testIdFromUrl) { // Prioritize test_id
            console.log(`DEBUG DOMContentLoaded: Launching full test from URL: ${testIdFromUrl}`);
            if (fullTestDefinitions[testIdFromUrl]) {
                currentInteractionMode = 'full_test';
                currentTestFlow = fullTestDefinitions[testIdFromUrl].flow;
                currentModuleIndex = 0; currentQuestionNumber = 1; userAnswers = {};
                /* reset other states */
                isTimerHidden = false; isCrossOutToolActive = false; isHighlightingActive = false;
                if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
                if(calculatorOverlay) calculatorOverlay.classList.remove('visible');
                if(referenceSheetPanel) referenceSheetPanel.classList.remove('visible');
                currentModuleTimeUp = false;

                if (currentTestFlow && currentTestFlow.length > 0) {
                    const firstQuizName = currentTestFlow[currentModuleIndex];
                    const moduleInfo = moduleMetadata[firstQuizName];
                    let jsonToLoad = firstQuizName; 
                    // Handle M2 placeholders like in loadQuizData if needed
                    if (moduleMetadata[firstQuizName]?.isPlaceholderFor) jsonToLoad = moduleMetadata[firstQuizName].isPlaceholderFor;
                    else if (firstQuizName === "DT-T0-RW-M2" && !moduleMetadata[firstQuizName]?.actualFile) jsonToLoad = "DT-T0-RW-M1"; 
                    else if (firstQuizName === "DT-T0-MT-M2" && !moduleMetadata[firstQuizName]?.actualFile) jsonToLoad = "DT-T0-MT-M1";

                    const success = await loadQuizData(jsonToLoad);
                    if (success && currentQuizQuestions.length > 0) {
                        if (moduleInfo && typeof moduleInfo.durationSeconds === 'number') {
                            startModuleTimer(moduleInfo.durationSeconds);
                        } else { updateModuleTimerDisplay(0); }
                        populateQNavGrid();
                        showView('test-interface-view');
                        launchedDirectly = true;
                    }
                }
                if (!launchedDirectly) {
                     alert(`Could not properly initialize test: ${testIdFromUrl}.`);
                     showView('home-view'); // Fallback to message home
                }
            } else {
                alert(`Unknown Test ID: ${testIdFromUrl}.`);
                showView('home-view'); // Fallback to message home
            }
        } else if (quizNameFromUrl) {
            console.log(`DEBUG DOMContentLoaded: Launching single quiz from URL: ${quizNameFromUrl}`);
            currentInteractionMode = 'single_quiz'; 
            currentTestFlow = [quizNameFromUrl];
            currentModuleIndex = 0; currentQuestionNumber = 1; userAnswers = {};
            /* reset other states */
            isTimerHidden = false; isCrossOutToolActive = false; isHighlightingActive = false;
            if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
            if(calculatorOverlay) calculatorOverlay.classList.remove('visible');
            if(referenceSheetPanel) referenceSheetPanel.classList.remove('visible');
            currentModuleTimeUp = false; 

            const success = await loadQuizData(quizNameFromUrl);
            if (success && currentQuizQuestions.length > 0) {
                startPracticeQuizTimer(); 
                populateQNavGrid();
                showView('test-interface-view'); 
                launchedDirectly = true;
            }
            if (!launchedDirectly) { 
                alert(`Could not load the specified quiz: ${quizNameFromUrl}.`);
                showView('home-view'); 
            }
        } else {
            // No direct launch parameters, email is valid, show the informational home screen.
            console.log("DEBUG DOMContentLoaded: Email valid, no direct launch params. Displaying informational home screen.");
            showView('home-view');
        }
    }
});
