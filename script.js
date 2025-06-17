// --- script.js (Phase 3 - Revision 1 - Full Code) ---

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
function getCurrentModule() { /* ... (same as P3) ... */ }
function getCurrentQuestionData() { /* ... (same as P3) ... */ }
function getAnswerStateKey(moduleIdx = currentModuleIndex, qNum = currentQuestionNumber) { /* ... (same as P3) ... */ }
function getAnswerState(moduleIdx = currentModuleIndex, qNum = currentQuestionNumber) { /* ... (same as P3) ... */ }
function populateQNavGrid() { /* ... (same as P3) ... */ }
function renderReviewPage() { /* ... (same as P3) ... */ }
let confettiAnimationId; 
const confettiParticles = []; 
function startConfetti() { /* ... (same as P3) ... */ }
function stopConfetti() { /* ... (same as P3) ... */ }
function handleTimerToggle(textEl, iconEl, btnEl) { /* ... (same as P3) ... */ }

// --- Navigation Update (NEW for Phase 3) ---
function updateNavigation() {
    const moduleInfo = getCurrentModule();
    const questionsAvailable = currentQuizQuestions && currentQuizQuestions.length > 0;

    // Determine which next/back buttons to use based on currentView
    const currentNextBtn = currentView === 'review-page-view' ? reviewNextBtnFooter : nextBtnFooter;
    const currentBackBtn = currentView === 'review-page-view' ? reviewBackBtnFooter : backBtnFooter;

    if (!moduleInfo || !questionsAvailable) {
        if(currentBackBtn) currentBackBtn.disabled = true;
        if(currentNextBtn) currentNextBtn.disabled = true;
        if(currentQFooterEl && currentView === 'test-interface-view') currentQFooterEl.textContent = '0'; // Only update test-interface footer
        if(totalQFooterEl && currentView === 'test-interface-view') totalQFooterEl.textContent = '0'; // Only update test-interface footer
        return;
    }

    const totalQuestionsInModule = currentQuizQuestions.length;

    if (currentView === 'test-interface-view') {
        if(currentQFooterEl) currentQFooterEl.textContent = currentQuestionNumber;
        if(totalQFooterEl) totalQFooterEl.textContent = totalQuestionsInModule;
        if(currentBackBtn) currentBackBtn.disabled = (currentQuestionNumber === 1);
        if(currentNextBtn) {
            currentNextBtn.textContent = (currentQuestionNumber === totalQuestionsInModule) ? "Review Section" : "Next";
            currentNextBtn.disabled = false;
        }
    } else if (currentView === 'review-page-view') {
        if(currentBackBtn) currentBackBtn.disabled = false; 
        if(currentNextBtn) {
            currentNextBtn.textContent = (currentModuleIndex >= currentTestFlow.length - 1) ? "Finish Test" : "Next Module";
            currentNextBtn.disabled = false;
        }
    }
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
         // Ensure review page buttons are hidden if test interface is shown
        if(reviewBackBtnFooter && reviewNextBtnFooter){
            reviewBackBtnFooter.style.display = 'none'; 
            reviewNextBtnFooter.style.display = 'none';
        }
        loadQuestion();
    } else if (viewId === 'review-page-view') {
        if(qNavBtnFooter) qNavBtnFooter.style.display = 'none';
        // Hide test-interface nav buttons, show review-page nav buttons
        if(backBtnFooter) backBtnFooter.style.display = 'none';
        if(nextBtnFooter) nextBtnFooter.style.display = 'none';
        if(reviewBackBtnFooter && reviewNextBtnFooter){
            reviewBackBtnFooter.style.display = 'inline-block';
            reviewNextBtnFooter.style.display = 'inline-block';
        }
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

// --- Core UI Update `loadQuestion()` (Mostly same as P2.2) ---
function loadQuestion() { /* ... (same as P3) ... */ }
function recordTimeOnCurrentQuestion() { /* ... (same as P3) ... */ }

// --- Event Listeners ---
// Ensure all these are correctly placed and element references are valid.

// Answer Selection and Cross-out
if(answerOptionsMainEl) {
    answerOptionsMainEl.addEventListener('click', function(event) {
        const target = event.target;
        const answerContainer = target.closest('.answer-option-container');
        if (!answerContainer) return;

        const optionKey = answerContainer.dataset.optionKey;
        if (!optionKey) return;

        const action = target.dataset.action || (target.closest('[data-action]') ? target.closest('[data-action]').dataset.action : null);
        
        // Record time if it's a direct answer selection
        if (action !== 'cross-out-individual' && action !== 'undo-cross-out' && target.closest('.answer-option')) {
            recordTimeOnCurrentQuestion(); 
        }

        if (action === 'cross-out-individual') {
            handleAnswerCrossOut(optionKey);
        } else if (action === 'undo-cross-out') {
            handleAnswerUndoCrossOut(optionKey);
        } else if (target.closest('.answer-option')) {
            // Per Bluebook correction: allow selection even if cross-out tool is active
            handleAnswerSelect(optionKey);
        }
    });
}

function handleAnswerSelect(optionKey) {
    const answerState = getAnswerState();
    if (!answerState) return;

    // Corrected Bluebook behavior: selecting an option always makes it selected
    // and removes any cross-out from THAT option.
    answerState.selected = optionKey;
    // Remove this option from crossedOut array if it exists
    answerState.crossedOut = answerState.crossedOut.filter(opt => opt !== optionKey);
    
    loadQuestion(); 
}

function handleAnswerCrossOut(optionKey) { // This is for the individual 'x' buttons
     const answerState = getAnswerState();
     if (!answerState) return;
     if (!answerState.crossedOut.includes(optionKey)) {
         answerState.crossedOut.push(optionKey);
         // Do NOT unselect if the current selection is crossed out via this individual button
         // The main "ABC" tool being active + clicking the option itself would do that.
         // Or, if Bluebook rules say crossing out always unselects, then:
         // if (answerState.selected === optionKey) answerState.selected = null; 
     }
     loadQuestion();
}
function handleAnswerUndoCrossOut(optionKey) { // This is for the individual 'Undo' buttons
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
    sprInputFieldMain.addEventListener('blur', recordTimeOnCurrentQuestion); // Record time when focus leaves
    sprInputFieldMain.addEventListener('input', (event) => { 
        const answerState = getAnswerState();
        if (!answerState) return;
        answerState.spr_answer = event.target.value;
        if(sprAnswerPreviewMain) sprAnswerPreviewMain.textContent = `Answer Preview: ${event.target.value}`;
        // Time recording on input can be too frequent; consider on blur or nav.
    });
}


// --- Navigation Button Event Listeners ---
if(nextBtnFooter) { 
    nextBtnFooter.addEventListener('click', async () => { 
        recordTimeOnCurrentQuestion(); 
        // This button is for test-interface-view
        if (currentView === 'test-interface-view') {
            const totalQuestionsInModule = currentQuizQuestions.length;
            if (currentQuestionNumber < totalQuestionsInModule) {
                currentQuestionNumber++;
                isCrossOutToolActive = false; isHighlightingActive = false; if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
                loadQuestion();
            } else if (currentQuestionNumber === totalQuestionsInModule) {
                showView('review-page-view');
            }
        }
        // The review-page-view next button has its own ID: reviewNextBtnFooter
    });
}

if(backBtnFooter) { 
    backBtnFooter.addEventListener('click', () => {
        recordTimeOnCurrentQuestion();
        if (currentView === 'test-interface-view' && currentQuestionNumber > 1) {
            currentQuestionNumber--;
            isCrossOutToolActive = false; isHighlightingActive = false; if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
            loadQuestion();
        }
    });
}

if(reviewNextBtnFooter) {
    reviewNextBtnFooter.addEventListener('click', async () => {
        // This button is specifically for the review page
        recordTimeOnCurrentQuestion(); // Time spent on review page itself is not usually tracked per question
        currentModuleIndex++;
        if (currentModuleIndex < currentTestFlow.length) {
            if(moduleOverViewEl) showView('module-over-view');
            else { // Fallback if module-over-view is removed
                currentQuestionNumber = 1;
                isCrossOutToolActive = false; isHighlightingActive = false;
                const success = await loadQuizData(currentTestFlow[currentModuleIndex]);
                if(success && currentQuizQuestions.length > 0) showView('test-interface-view');
                else { console.error("No questions in next module or load failed."); showView('home-view'); }
                return; 
            }
            setTimeout(async () => {
                currentQuestionNumber = 1;
                isCrossOutToolActive = false; isHighlightingActive = false;
                const success = await loadQuizData(currentTestFlow[currentModuleIndex]);
                if(success && currentQuizQuestions.length > 0) showView('test-interface-view');
                else {
                    console.error("Failed to load next module or no questions. Returning home.");
                    alert("Error loading the next module. Please try again.");
                    showView('home-view');
                }
            }, 1500);
        } else {
            showView('finished-view'); // Will trigger submitQuizData in Phase 4
        }
    });
}

if(reviewBackBtnFooter) { 
    reviewBackBtnFooter.addEventListener('click', () => {
        showView('test-interface-view'); // Goes back to the current question in test view
    });
}


// --- Other Button Event Listeners (Restored from Phase 4 logic) ---
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

if(highlightsNotesBtn && (passageContentEl || questionTextMainEl) ) { 
    highlightsNotesBtn.addEventListener('click', () => {
        isHighlightingActive = !isHighlightingActive;
        highlightsNotesBtn.classList.toggle('active', isHighlightingActive);
        // Adjust event listener target based on active panes
        const highlightTarget = document; // Listen on document to capture from either pane

        if (isHighlightingActive) {
            highlightTarget.addEventListener('mouseup', handleTextSelection); 
            if(mainContentAreaDynamic) mainContentAreaDynamic.classList.add('highlight-active'); 
        } else {
            highlightTarget.removeEventListener('mouseup', handleTextSelection);
            if(mainContentAreaDynamic) mainContentAreaDynamic.classList.remove('highlight-active'); 
        }
    });
}
function handleTextSelection() {
    if (!isHighlightingActive) return;
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Check if selection is within an allowed area (passage or question text in question pane)
    const isWithinPassagePane = passagePane && passagePane.style.display !== 'none' && passagePane.contains(container);
    const isWithinQuestionPaneText = questionPane && questionPane.contains(container) && (questionTextMainEl.contains(container) || passageContentEl.contains(container)); // Check if selection is in right pane's text area or left pane if visible.

    if (!isWithinPassagePane && !isWithinQuestionPaneText) {
      // If selection is not in passage or main question text of question pane, do not highlight
      if (!(passagePane.style.display !== 'none' && passageContentEl.contains(container)) && 
          !(questionPane.style.display !== 'none' && questionTextMainEl.contains(container))) {
           // console.log("Selection not in allowed highlight area.");
           return;
      }
    }


    const span = document.createElement('span');
    span.className = 'text-highlight';
    try {
        range.surroundContents(span);
    } catch (e) { 
        try { // Fallback for complex selections
            span.appendChild(range.extractContents());
            range.insertNode(span);
        } catch (e2) {
            console.error("Highlighting failed:", e2);
            return; // Don't proceed if highlighting fails completely
        }
        console.warn("Highlighting across complex nodes, used extract/insert fallback.", e);
    }
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

if(qNavBtnFooter) qNavBtnFooter.addEventListener('click', () => { populateQNavGrid(); toggleModal(qNavPopup, true); }); 
if(qNavCloseBtn) qNavCloseBtn.addEventListener('click', () => toggleModal(qNavPopup, false));
if(qNavGotoReviewBtn) {
    qNavGotoReviewBtn.addEventListener('click', () => { 
        recordTimeOnCurrentQuestion(); 
        toggleModal(qNavPopup, false); 
        showView('review-page-view'); 
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
    });
}

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

// Initial Load - ensure home view is active by default
// showView('home-view'); // Set in HTML or ensure it's called once
