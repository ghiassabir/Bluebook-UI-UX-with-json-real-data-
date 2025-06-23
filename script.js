// --- script.js (Consolidated for Parameter-Driven Launch & Email Prompt) ---

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
let currentView = 'home'; // Initial view, will be changed by DOMContentLoaded
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
let currentInteractionMode = 'full_test'; // Default, but will be set by launch logic
let practiceQuizTimerInterval;
let practiceQuizTimeElapsed = 0;

const APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwneCF0xq9X-F-9AIxAiHpYFmRTErCzCPXlsWRloLRDWBGqwLEZC4NldCCAuND0jxUL/exec'; 

const fullTestDefinitions = {
    "DT-T0": { flow: ["DT-T0-RW-M1", "DT-T0-RW-M2", "DT-T0-MT-M1", "DT-T0-MT-M2"], name: "Digital SAT Practice Test 0 Preview" },
    "CBT-T4": { flow: ["CBT-T4-RW-M1", "CBT-T4-RW-M2", "CBT-T4-MT-M1", "CBT-T4-MT-M2"], name: "Digital SAT Practice Test 4 Preview" },
    "CBT-T5": { flow: ["CBT-T5-RW-M1", "CBT-T5-RW-M2", "CBT-T5-MT-M1", "CBT-T5-MT-M2"], name: "Digital SAT Practice Test 5 Preview" },
    "CBT-T6": { flow: ["CBT-T6-RW-M1", "CBT-T6-RW-M2", "CBT-T6-MT-M1", "CBT-T6-MT-M2"], name: "Digital SAT Practice Test 6" },
    "CBT-T7": { flow: ["CBT-T7-RW-M1", "CBT-T7-RW-M2", "CBT-T7-MT-M1", "CBT-T7-MT-M2"], name: "Digital SAT Practice Test 7" },
    "CBT-T8": { flow: ["CBT-T8-RW-M1", "CBT-T8-RW-M2", "CBT-T8-MT-M1", "CBT-T8-MT-M2"], name: "Digital SAT Practice Test 8" },
    "CBT-T9": { flow: ["CBT-T9-RW-M1", "CBT-T9-RW-M2", "CBT-T9-MT-M1", "CBT-T9-MT-M2"], name: "Digital SAT Practice Test 9" },
    "CBT-T10": { flow: ["CBT-T10-RW-M1", "CBT-T10-RW-M2", "CBT-T10-MT-M1", "CBT-T10-MT-M2"], name: "Digital SAT Practice Test 10" }
};

const moduleMetadata = {
    "DT-T0-RW-M1": { name: "Reading & Writing - Module 1", type: "RW", durationSeconds: 180, directions: "...", spr_directions: null, spr_examples_table: null },
    "DT-T0-RW-M2": { name: "Reading & Writing - Module 2", type: "RW", durationSeconds: 180, directions: "...", spr_directions: null, spr_examples_table: null },
    "DT-T0-MT-M1": { name: "Math - Module 1", type: "Math", durationSeconds: 240, directions: "...", passageText: null, spr_directions: `<h3>...</h3><ul>...</ul>`, spr_examples_table: `<table>...</table>` },
    "DT-T0-MT-M2": { name: "Math - Module 2", type: "Math", durationSeconds: 240, directions: "...", passageText: null, spr_directions: `<h3>...</h3><ul>...</ul>`, spr_examples_table: `<table>...</table>` },
    // Add metadata for CBT-T4 to T10 modules as well, e.g.:
    "CBT-T4-RW-M1": { name: "Test 4: R&W Module 1", type: "RW", durationSeconds: 1920, directions: "...", spr_directions: null, spr_examples_table: null }, // 32 mins
    "CBT-T4-RW-M2": { name: "Test 4: R&W Module 2", type: "RW", durationSeconds: 1920, directions: "...", spr_directions: null, spr_examples_table: null },
    "CBT-T4-MT-M1": { name: "Test 4: Math Module 1", type: "Math", durationSeconds: 2100, directions: "...", passageText: null, spr_directions: `<h3>...</h3><ul>...</ul>`, spr_examples_table: `<table>...</table>` }, // 35 mins
    "CBT-T4-MT-M2": { name: "Test 4: Math Module 2", type: "Math", durationSeconds: 2100, directions: "...", passageText: null, spr_directions: `<h3>...</h3><ul>...</ul>`, spr_examples_table: `<table>...</table>` },
    // ... and so on for T5-T10 modules and any single quizzes like "G-C3-EOC"
    "G-C3-EOC": { name: "Grammar: Chapter 3 EOC", type: "RW", directions: "Review questions for Grammar Chapter 3.", durationSeconds: null } // No duration for upward timer
};

const GITHUB_JSON_BASE_URL = 'https://raw.githubusercontent.com/ghiassabir/Bluebook-UI-UX-with-json-real-data-/main/data/json/'; 

async function loadQuizData(quizName) {
    let actualQuizNameToLoad = quizName;
    // Handle potential placeholder mapping if M2 files don't exist by these exact names
    // and you are reusing M1 data for M2 sections in some tests.
    // This assumes your *actual* JSON files might be named differently than the flow keys for M2.
    // If DT-T0-RW-M2.json truly exists, this specific mapping isn't needed for it.
    if (quizName === "DT-T0-RW-M2" && !moduleMetadata[quizName]?.actualFile) actualQuizNameToLoad = "DT-T0-RW-M1";
    else if (quizName === "DT-T0-MT-M2" && !moduleMetadata[quizName]?.actualFile) actualQuizNameToLoad = "DT-T0-MT-M1";
    // Add similar mappings if CBT-T[X]-RW-M2 should load CBT-T[X]-RW-M1 data, etc.

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

// --- DOM Elements ---
const allAppViews = document.querySelectorAll('.app-view');
const homeViewEl = document.getElementById('home-view');
const testInterfaceViewEl = document.getElementById('test-interface-view');
const moduleOverViewEl = document.getElementById('module-over-view');
const finishedViewEl = document.getElementById('finished-view');
const reviewPageViewEl = document.getElementById('review-page-view');
const emailInputViewEl = document.getElementById('email-input-view'); // Must exist in HTML
const studentEmailField = document.getElementById('student-email-field'); // Must exist in HTML
const submitEmailBtn = document.getElementById('submit-email-btn'); // Must exist in HTML
const confettiCanvas = document.getElementById('confetti-canvas');
const returnToHomeBtn = document.getElementById('return-to-home-btn');
const reviewPageSectionName = document.getElementById('review-page-section-name');
const reviewPageQNavGrid = document.getElementById('review-page-qnav-grid');
// ... (all other DOM consts from your working script) ...
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
// const startFullPracticeTestBtn = document.getElementById('start-full-practice-test-btn'); // No longer needed if home-view buttons are removed
// const startSinglePracticeQuizBtn = document.getElementById('start-single-practice-quiz-btn'); // No longer needed
const manualBreakViewEl = document.getElementById('manual-break-view'); // Make sure this exists in HTML
const continueAfterBreakBtn = document.getElementById('continue-after-break-btn'); // Make sure this exists in HTML

// --- Helper Functions ---
// (Ensure initializeStudentIdentifier, getCurrentModule, getCurrentQuestionData, getAnswerStateKey, 
//  updateModuleTimerDisplay, startModuleTimer, getAnswerState, recordTimeOnCurrentQuestion, 
//  populateQNavGrid, renderReviewPage, confetti, handleTimerToggle, updatePracticeQuizTimerDisplay,
//  startPracticeQuizTimer, extractPassageAndStem are all present and correct from your last working script)

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

// ... (paste ALL your other helper functions here, like getCurrentModule, getCurrentQuestionData, getAnswerState, timers, etc. Make sure extractPassageAndStem is included if you were using it for R&W.)
// Helper function to attempt stem extraction (add this with other helper functions) ---
function extractPassageAndStem(fullText) {
    // List of common question-starting phrases (case-insensitive). Prioritize longer, more specific phrases.
    // This list will likely need refinement based on your actual question data.
    const stemStarters = [
        "Which choice most effectively uses data from the chart to complete the example?", // Very specific
        "Which quotation from .* most effectively illustrates that claim?", // Specific with placeholder
        "Which choice best states the main purpose of the text?",
        "Which choice best describes the function of the underlined sentence",
        "Which choice best describes how the underlined sentence functions",
        "Which choice best states the main idea of the text?",
        "Which choice best completes the text with the most logical and precise word or phrase?",
        "Which choice completes the text so that it conforms to the conventions of Standard English?",
        "Which choice completes the text with the most logical transition?",
        "The author of Passage 1 would most likely respond to",
        "The author’s attitude toward .* can best be described as", // Specific with placeholder
        "Washington's primary purpose in the text above is most likely", // From your example
        "According to the text, which characteristic of a comet is most essential", // Example
        "The text most strongly suggests that the encryption used by Julius Caesar was successful", // Example
        "The text suggests that Maxwell was able to make a scientific breakthrough", // Example
        "It is reasonable to conclude from the text that a bacteriostatic medicine", // Example
        "The main idea conveyed in the above monologue can best be summarized as", // Example
        "The student wants to emphasize a similarity", // Example
        "Which of the following completes the text with the most specific expression", // Example
        "Which sentence, if inserted in the underlined portion, would best strengthen", // Example
        "As used in the text, what does the word",
        "What function does the underlined sentence serve",
        "Which choice best describes",
        "Which choice best states",
        "Which choice completes",
        "The main purpose of the text is",
        "The main idea of the passage is",
        "According to the text,",
        "The author implies that",
        "The author's primary purpose in the passage is to",
        "The passage primarily serves to",
        "It can be inferred from the passage that"
        // Add more as needed, from most specific to more general
    ];

    let passage = fullText;
    let stem = "";

    for (const starter of stemStarters) {
        const regex = new RegExp(starter.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace("\\.\\*", ".*?"), "i"); // Handle .* as non-greedy
        const match = passage.match(regex); // Use match to get the actual matched text

        if (match && match.index !== undefined) {
            const matchIndex = match.index;
            // Ensure the found starter isn't a substring of a longer word or within HTML tags if text has HTML
            // Basic check: see if char before match is space, start of string, or > (end of tag)
            // This is a simple heuristic and might need improvement for complex HTML in question_text
            const charBefore = matchIndex > 0 ? passage[matchIndex - 1] : " ";
            if (charBefore.match(/\s|>|^/)) {
                stem = fullText.substring(matchIndex);
                passage = fullText.substring(0, matchIndex);
                // console.log(`DEBUG extract: Found "${match[0]}". Stem starts: "${stem.substring(0,30)}..." Passage ends: "...${passage.slice(-30)}"`);
                break; 
            }
        }
    }

    if (!stem && passage.includes("?")) { 
        const lastQuestionMark = passage.lastIndexOf("?");
        if (lastQuestionMark !== -1 && passage.length - lastQuestionMark < 400) { 
            let sentenceStart = passage.lastIndexOf(". ", lastQuestionMark);
            if (sentenceStart === -1 || lastQuestionMark - sentenceStart > 350) { // If no recent period or sentence is too long
                 sentenceStart = passage.lastIndexOf("\n", lastQuestionMark); // Try newline
                 if (sentenceStart === -1 || lastQuestionMark - sentenceStart > 350) {
                    sentenceStart = Math.max(0, lastQuestionMark - 250); // Fallback to fixed length
                 } else {
                    sentenceStart +=1; // After newline
                 }
            } else {
                sentenceStart += 2; // After ". "
            }
            
            stem = passage.substring(sentenceStart, lastQuestionMark + 1).trim();
            passage = passage.substring(0, sentenceStart).trim();
        }
    }
    
    if (!stem) { 
        const words = fullText.split(/\s+/); // Split by any whitespace
        if (words.length > 20) { 
            const presumedStemWordsCount = Math.min(25, Math.floor(words.length * 0.4)); // Take up to 40% or 25 words
            // Find a good breaking point (e.g., end of a sentence if possible) within that presumed stem
            let tempStem = words.slice(-presumedStemWordsCount).join(' ');
            let breakPoint = tempStem.lastIndexOf(". ");
            if (breakPoint > tempStem.length / 2) { // If period is in latter half of presumed stem
                stem = tempStem.substring(breakPoint + 2);
                passage = fullText.substring(0, fullText.length - stem.length).trim();
            } else {
                 stem = tempStem;
                 passage = words.slice(0, words.length - presumedStemWordsCount).join(' ');
            }
        } else { 
            stem = fullText;
            passage = "";
        }
    }
    // If passage is very short and stem is the bulk, maybe it's all stem
    if (passage.split(/\s+/).length < 10 && stem.split(/\s+/).length > passage.split(/\s+/).length) {
        // This heuristic might need adjustment. If passage is trivial, make stem the whole thing.
        if (passage.length < 50 && fullText.length > passage.length) { // If passage is really short
             // console.log("DEBUG extract: Passage very short, considering full text as stem or re-evaluating split.");
             // Let's keep it as is for now, but this is an area for refinement.
        }
    }
    if (!passage && stem === fullText) { //If after all, passage is empty and stem is everything, it means no split happened.
        // console.log("DEBUG extract: No split occurred, stem is fullText, passage is empty.")
    }


    return { passageText: passage.trim(), questionStem: stem.trim() };
}


function populateQNavGrid() { /* ... IDENTICAL to your .txt file ... */ }
function renderReviewPage() { /* ... IDENTICAL to your .txt file ... */ }
function startConfetti() { /* ... IDENTICAL to your .txt file ... */ }
function stopConfetti() { /* ... IDENTICAL to your .txt file ... */ }
function handleTimerToggle(textEl, iconEl, btnEl) { /* ... IDENTICAL to your .txt file ... */ }
function updatePracticeQuizTimerDisplay(seconds) { /* ... IDENTICAL to your .txt file ... */ }
function startPracticeQuizTimer() { /* ... IDENTICAL to your .txt file ... */ }
function updateModuleTimerDisplay(seconds) { /* ... IDENTICAL to your .txt file ... */ }
function startModuleTimer(durationSeconds) { /* ... IDENTICAL to your .txt file ... */ }


function showView(viewId) { /* ... IDENTICAL to your .txt file ... */ }
function loadQuestion() { /* ... Paste your entire working loadQuestion here, including the extractPassageAndStem call and the robust MathJax logic ... */ }

// --- Event Listeners ---
// (Ensure all your working event listeners from the previous script are here)
// Example structure (fill with your actual listeners):
if(answerOptionsMainEl) { answerOptionsMainEl.addEventListener('click', function(event) {/*...*/}); }
function handleAnswerSelect(optionKey) { /*...*/ }
function handleAnswerCrossOut(optionKey) { /*...*/ }
function handleAnswerUndoCrossOut(optionKey) { /*...*/ }
if(crossOutToolBtnMain) { crossOutToolBtnMain.addEventListener('click', () => {/*...*/}); }
if(sprInputFieldMain) { /* spr listeners */ }

function updateNavigation() { /* ... Paste your working updateNavigation here ... */ }

function nextButtonClickHandler() { /*...*/ }
async function reviewNextButtonClickHandler() { /*... Paste your working one that bypasses break screen ...*/ }
function backButtonClickHandler() { /*...*/ }

if(nextBtnFooter) { /*...*/ }
if(reviewNextBtnFooter) { /*...*/ }
if(backBtnFooter) { /*...*/ }

// All other UI element listeners (returnToHomeBtn, calculator, reference, highlights, directions, qnav, markReview, timerToggle, moreMenu)
// should be pasted here from your working script.
if(returnToHomeBtn) returnToHomeBtn.addEventListener('click', () => showView('home-view')); 
if(calculatorBtnHeader) calculatorBtnHeader.addEventListener('click', () => toggleModal(calculatorOverlay, true));
if(calculatorCloseBtn) calculatorCloseBtn.addEventListener('click', () => toggleModal(calculatorOverlay, false));
if(referenceBtnHeader) referenceBtnHeader.addEventListener('click', () => toggleModal(referenceSheetPanel, true));
if(referenceSheetCloseBtn) referenceSheetCloseBtn.addEventListener('click', () => toggleModal(referenceSheetPanel, false));
let isCalcDragging = false; 
let currentX_calc_drag, currentY_calc_drag, initialX_calc_drag, initialY_calc_drag, xOffset_calc_drag = 0, yOffset_calc_drag = 0;
if(calculatorHeaderDraggable) { /* Calculator dragging logic */ }
if(highlightsNotesBtn && (passageContentEl || questionTextMainEl) ) { /* Highlights listener */ }
function handleTextSelection() { /* Highlights logic */ }
if(directionsBtn) { /* Directions listener */ }
if(directionsModalCloseBtn) directionsModalCloseBtn.addEventListener('click', () => toggleModal(directionsModal, false));
if(directionsModal) directionsModal.addEventListener('click', (e) => { if (e.target === directionsModal) toggleModal(directionsModal, false); });
if(qNavBtnFooter) { /* QNav footer listener */ }
if(qNavCloseBtn) qNavCloseBtn.addEventListener('click', () => toggleModal(qNavPopup, false));
if(qNavGotoReviewBtn) { /* QNav go to review listener */ }
if(markReviewCheckboxMain) { /* Mark for review listener */ }
if(timerToggleBtn) timerToggleBtn.addEventListener('click', () => handleTimerToggle(timerTextEl, timerClockIconEl, timerToggleBtn));
if(reviewDirectionsBtn) { /* Review directions listener */ }
if(reviewTimerToggleBtn && reviewTimerText && reviewTimerClockIcon) reviewTimerToggleBtn.addEventListener('click', () => handleTimerToggle(reviewTimerText, reviewTimerClockIcon, reviewTimerToggleBtn));
if(reviewBackBtnFooter) { /* Review back listener */ }
if(moreBtn) { /* More menu listener */ }
document.body.addEventListener('click', (e) => { /* Body click for more menu close */ });
if(moreMenuDropdown) moreMenuDropdown.addEventListener('click', (e) => e.stopPropagation()); 
if(moreUnscheduledBreakBtn) { /* Unscheduled break listener */ }
if(understandLoseTimeCheckbox) { /* Understand lose time listener */ }
if(unscheduledBreakCancelBtn) unscheduledBreakCancelBtn.addEventListener('click', () => toggleModal(unscheduledBreakConfirmModal, false));
if(unscheduledBreakConfirmBtn) { /* Unscheduled break confirm listener */ }
if(moreExitExamBtn) { /* Exit exam listener */ }
if(exitExamCancelBtn) exitExamCancelBtn.addEventListener('click', () => toggleModal(exitExamConfirmModal, false));
if(exitExamConfirmBtn) { /* Exit exam confirm listener */ }
if (continueAfterBreakBtn) { /* Continue after break listener (the simplified one that doesn't use the named handler) */ }


// --- Start Button Listeners (from your .txt file) ---
// COMMENTED OUT: These buttons are removed from home-view in favor of URL-driven launch
/*
if(startFullPracticeTestBtn) {
    startFullPracticeTestBtn.addEventListener('click', async () => {
        // ... (logic as in your file, but ensure initializeStudentIdentifier() is NOT called here)
    });
}

if(startSinglePracticeQuizBtn) {
    startSinglePracticeQuizBtn.addEventListener('click', async () => {
        // ... (logic as in your file, but ensure initializeStudentIdentifier() is NOT called here)
    });
}
*/

// --- Submission Logic ---
async function submitQuizData() { /* ... IDENTICAL to your .txt file ... */ }

// --- DOMContentLoaded --- (This is the new one from my previous message)
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DEBUG DOMContentLoaded: Initializing application.");
    const emailIsValid = initializeStudentIdentifier(); 
    console.log(`DEBUG DOMContentLoaded: Email valid from localStorage? ${emailIsValid}. Current email: ${studentEmailForSubmission}`);

    const urlParams = new URLSearchParams(window.location.search);
    const quizNameFromUrl = urlParams.get('quiz_name');
    const testIdFromUrl = urlParams.get('test_id'); 
    const sourceFromUrl = urlParams.get('source'); 
    globalOriginPageId = urlParams.get('originPageId'); // Store originPageId

    if (sourceFromUrl) {
        globalQuizSource = sourceFromUrl;
        console.log(`DEBUG DOMContentLoaded: URL 'source' parameter found: ${globalQuizSource}`);
    }
    if (globalOriginPageId) {
        console.log(`DEBUG DOMContentLoaded: URL 'originPageId' parameter found: ${globalOriginPageId}`);
    }


    if (!emailIsValid) {
        console.log(`DEBUG DOMContentLoaded: No valid email. Showing email input screen. URL params (if any): quiz_name=${quizNameFromUrl}, test_id=${testIdFromUrl}`);
        showView('email-input-view');
    } else {
        console.log(`DEBUG DOMContentLoaded: Email is valid (${studentEmailForSubmission}). Checking for direct launch params.`);
        let launched = false;
        if (testIdFromUrl) { // Prioritize test_id
            console.log(`DEBUG DOMContentLoaded: Launching full test from URL: ${testIdFromUrl}`);
            if (fullTestDefinitions[testIdFromUrl]) {
                currentInteractionMode = 'full_test';
                currentTestFlow = fullTestDefinitions[testIdFromUrl].flow;
                // Reset states for full test
                currentModuleIndex = 0; currentQuestionNumber = 1; userAnswers = {};
                isTimerHidden = false; isCrossOutToolActive = false; isHighlightingActive = false;
                if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
                if(calculatorOverlay) calculatorOverlay.classList.remove('visible');
                if(referenceSheetPanel) referenceSheetPanel.classList.remove('visible');
                currentModuleTimeUp = false;

                if (currentTestFlow && currentTestFlow.length > 0) {
                    const firstQuizName = currentTestFlow[currentModuleIndex];
                    const moduleInfo = moduleMetadata[firstQuizName];
                    let jsonToLoad = firstQuizName; 
                    // Adjust jsonToLoad based on your actual file availability for M2 modules
                    if (moduleMetadata[firstQuizName]?.isPlaceholderFor) jsonToLoad = moduleMetadata[firstQuizName].isPlaceholderFor;


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
                if (!launched) { // Fallback if test flow was empty or load failed
                     alert(`Could not properly initialize test: ${testIdFromUrl}.`);
                     showView('home-view'); // Show fallback home (message page)
                }
            } else {
                alert(`Unknown Test ID: ${testIdFromUrl}.`);
                showView('home-view'); // Show fallback home
                launched = true; // Consider this path "handled" to prevent going to generic home
            }
        } else if (quizNameFromUrl) {
            console.log(`DEBUG DOMContentLoaded: Launching single quiz from URL: ${quizNameFromUrl}`);
            currentInteractionMode = 'single_quiz'; 
            currentTestFlow = [quizNameFromUrl];
            // Reset states for single quiz
            currentModuleIndex = 0; currentQuestionNumber = 1; userAnswers = {};
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
            } else {
                alert(`Could not load the specified quiz: ${quizNameFromUrl}.`);
                showView('home-view'); 
                launched = true; 
            }
        }
        
        if (!launched) { // If neither test_id nor quiz_name led to a launch
            console.log("DEBUG DOMContentLoaded: Email valid, no direct launch params processed. Displaying home screen (message page).");
            showView('home-view');
        }
    }
});
