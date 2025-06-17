<script>
        // --- Utility Functions (Define these FIRST) ---
        function toggleModal(modalElement, show) {
            if (!modalElement) {
                // console.error("toggleModal called with null modalElement for ID:", modalElement ? modalElement.id : 'UNKNOWN');
                return;
            }
            modalElement.classList.toggle('visible', show);
        }

        // --- PHASE 1: NEW DATA STRUCTURES & LOADING ---
        let currentQuizQuestions = []; // Will hold questions for the active module
        let currentTestFlow = [];      // Array of quiz_names for the current test flow

        const moduleMetadata = {
            "DT-T0-RW-M1": {
                name: "Reading & Writing - Module 1",
                type: "RW",
                directions: "The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s). All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.",
                passageText: "<p>This is a placeholder passage for Reading & Writing Module 1. It would appear here if the module requires a general passage not tied to individual questions in the JSON. For example, some say the world will end in fire, Some say in ice. From what I’ve tasted of desire I hold with those who favor fire. But if it had to perish twice, I think I know enough of hate To say that for destruction ice Is also great And would suffice.</p>", // Example placeholder
                spr_directions: null,
                spr_examples_table: null
            },
            "DT-T0-MT-M1": { // Placeholder for the Math module
                name: "Math - Module 1",
                type: "Math",
                directions: "The questions in this section address a number of important math skills. You may use the calculator for any question in this section. For student-produced response questions, additional directions are provided with the question.",
                passageText: null,
                spr_directions: `<h3>Student-produced response directions</h3><ul><li>If you find <strong>more than one correct answer</strong>, enter only one answer.</li><li>You can enter up to 5 characters for a <strong>positive</strong> answer and up to 6 characters (including the negative sign) for a <strong>negative</strong> answer.</li><li>If your answer is a <strong>fraction</strong> that doesn’t fit in the provided space, enter the decimal equivalent.</li><li>If your answer is a <strong>decimal</strong> that doesn’t fit in the provided space, enter it by truncating or rounding at the fourth digit.</li><li>If your answer is a <strong>mixed number</strong> (such as 3 <span style="font-size: 0.7em; vertical-align: super;">1</span>/<span style="font-size: 0.7em; vertical-align: sub;">2</span>), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).</li><li>Don’t enter <strong>symbols</strong> such as a percent sign, comma, or dollar sign.</li></ul>`,
                spr_examples_table: `<table class="spr-examples-table"><thead><tr><th>Answer</th><th>Acceptable ways to enter answer</th><th>Unacceptable: will NOT receive credit</th></tr></thead><tbody><tr><td>3.5</td><td>3.5<br/>7/2</td><td>3 1/2</td></tr><tr><td>2/3</td><td>2/3<br/>.666<br/>.667</td><td>0.66<br/>0.67</td></tr><tr><td>-15</td><td>-15</td><td></td></tr></tbody></table>`
            }
            // Add other quiz_names and their metadata here as needed
        };

        const GITHUB_JSON_BASE_URL = 'https://raw.githubusercontent.com/ghiassabir/New-Approach-Quiz-and-Dashboard-11-june/main/data/json/';

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
                console.log(`currentQuizQuestions populated with ${currentQuizQuestions.length} items. First item:`, currentQuizQuestions.length > 0 ? currentQuizQuestions[0] : 'empty');
                return true;
            } catch (error) {
                console.error("Error loading quiz data:", error);
                alert(`Failed to load quiz data for ${quizName}: ${error.message}. Please check the console and ensure the JSON file is accessible.`);
                currentQuizQuestions = []; // Ensure it's empty on failure
                return false;
            }
        }
        // --- End of PHASE 1 NEW DATA STRUCTURES & LOADING ---


        /* --- Old Test Data (Commented Out) ---
        const testData = {
            modules: [
                {
                    name: "Reading & Writing", totalQuestions: 3,
                    directions: "The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s). All questions in this section are multiple-choice with four answer choices. Each question has a single best answer.",
                    questions: [
                        { number: 1, type: 'mcq-passage', passage: "In recommending Bao Phi’s collection <i>Sông I Sing</i>, a librarian noted that pieces by the spoken-word poet don’t lose their ______ nature when printed: the language has the same pleasant musical quality on the page as it does when performed by Phi.", questionText: "Which choice completes the text with the most logical and precise word or phrase?", options: { A: "scholarly", B: "melodic", C: "jarring", D: "personal" } },
                        { number: 2, type: 'mcq-passage', passage: "The following text is from the 1924 short story <i>The New Sensation</i> by Sherwood Anderson. In this excerpt, the narrator is observing a man named Winterbottom who has recently become wealthy.<br><br>He had been a farmhand, a railroad hand, a tramp. He had been everything that is common and usual in America. Now he was a rich man. It was like a new and strange problemática into which he had suddenly been thrown.", questionText: "Which choice best describes the function of the underlined sentence in the text as a whole?", options: { A: "It provides a contrast to Winterbottom's previous life experiences.", B: "It emphasizes Winterbottom's comfort with his new social status.", C: "It introduces a conflict that Winterbottom faces due to his wealth.", D: "It sets a scene for a flashback to Winterbottom's earlier struggles." } },
                        { number: 3, type: 'mcq-passage', passage: "Some studies have suggested that posture can influence cognition, but we should not overstate this phenomenon. A case in point: In a 2014 study, Megan O’Brien and Alaa Ahmed had subjects stand or sit while making risky simulated economic decisions. Standing is more physically unstable and cognitively demanding than sitting; accordingly, O’Brien and Ahmed hypothesized that standing subjects would display more risk aversion during the decision-making tasks than sitting subjects did, since they would want to avoid further feelings of discomfort and complicated risk evaluations. But O’Brien and Ahmed actually found no difference in the groups’ performance.", questionText: "Which choice best states the main purpose of the text?", options: { A: "To critique the methodology of a study by O'Brien and Ahmed.", B: "To argue that research findings about the effects of posture on cognition are often misunderstood.", C: "To explain a significant problem in the emerging understanding of posture's effects on cognition.", D: "To illustrate why caution is needed when making claims about the effects of posture on cognition." } },
                    ]
                },
                {
                    name: "Math", totalQuestions: 2,
                    directions: "The questions in this section address a number of important math skills. You may use the calculator for any question in this section. For student-produced response questions, additional directions are provided with the question.",
                    questions: [
                        { number: 1, type: 'mcq-single', questionText: "Two nearby trees are perpendicular to the ground, which is flat. One of these trees is 10 feet tall and has a shadow that is 5 feet long. At the same time, the shadow of the other tree is 2 feet long. How tall, in feet, is the other tree?", options: {A: 3, B: 4, C: 8, D: 27}},
                        {
                            number: 2, type: 'spr',
                            spr_directions: `<h3>Student-produced response directions</h3><ul><li>If you find <strong>more than one correct answer</strong>, enter only one answer.</li><li>You can enter up to 5 characters for a <strong>positive</strong> answer and up to 6 characters (including the negative sign) for a <strong>negative</strong> answer.</li><li>If your answer is a <strong>fraction</strong> that doesn’t fit in the provided space, enter the decimal equivalent.</li><li>If your answer is a <strong>decimal</strong> that doesn’t fit in the provided space, enter it by truncating or rounding at the fourth digit.</li><li>If your answer is a <strong>mixed number</strong> (such as 3 <span style="font-size: 0.7em; vertical-align: super;">1</span>/<span style="font-size: 0.7em; vertical-align: sub;">2</span>), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).</li><li>Don’t enter <strong>symbols</strong> such as a percent sign, comma, or dollar sign.</li></ul>`,
                            spr_examples_table: `<table class="spr-examples-table"><thead><tr><th>Answer</th><th>Acceptable ways to enter answer</th><th>Unacceptable: will NOT receive credit</th></tr></thead><tbody><tr><td>3.5</td><td>3.5<br/>7/2</td><td>3 1/2</td></tr><tr><td>2/3</td><td>2/3<br/>.666<br/>.667</td><td>0.66<br/>0.67</td></tr><tr><td>-15</td><td>-15</td><td></td></tr></tbody></table>`,
                            questionText: "The y-intercept of the graph of y = –6x – 32 in the xy-plane is (0, y). What is the value of y?"
                        }
                    ]
                }
            ]
        };
        */

        // --- State ---
        let currentView = 'home';
        let currentModuleIndex = 0;
        let currentQuestionNumber = 1; // 1-indexed for display and user understanding
        let userAnswers = {}; 
        let isTimerHidden = false;
        let isCrossOutToolActive = false;
        let isHighlightingActive = false;

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

        // --- Helper Functions (Defined before other functions that use them) ---
        // getCurrentModule and getCurrentQuestionData will be adapted in Phase 2
        function getCurrentModule_OLD() { return testData.modules[currentModuleIndex]; }
        function getCurrentQuestionData_OLD() {
             const module = getCurrentModule_OLD();
             return module && module.questions && module.questions[currentQuestionNumber - 1] ? module.questions[currentQuestionNumber - 1] : {};
        }

        function getAnswerStateKey(moduleIdx = currentModuleIndex, qNum = currentQuestionNumber) { return `${moduleIdx}-${qNum}`; }
        function getAnswerState(moduleIdx = currentModuleIndex, qNum = currentQuestionNumber) {
            const key = getAnswerStateKey(moduleIdx, qNum);
            // In Phase 2, this will also include timeSpent
            if (!userAnswers[key]) userAnswers[key] = { selected: null, spr_answer: '', marked: false, crossedOut: [] };
            return userAnswers[key];
        }
        
        function populateQNavGrid() {
            // This function will be adapted in Phase 3 to use currentQuizQuestions
            if (!qNavGridMain || !qNavTitle) { console.error("QNav grid or title element not found for populating."); return; }
            qNavGridMain.innerHTML = '';
            // const module = getCurrentModule(); // Will be adapted
            const moduleInfo = moduleMetadata[currentTestFlow[currentModuleIndex]]; // Tentative for Phase 1
            if(!moduleInfo) return;
            qNavTitle.textContent = `Section ${currentModuleIndex + 1}: ${moduleInfo.name} Questions`;

            const totalQuestionsInModule = currentQuizQuestions.length; // Use loaded questions

            for (let i = 1; i <= totalQuestionsInModule; i++) {
                const qState = getAnswerState(currentModuleIndex, i);
                // const questionDataForButton = currentQuizQuestions[i-1]; // Tentative
                const btn = document.createElement('button');
                btn.className = 'qnav-grid-btn';
                if (i === currentQuestionNumber) {
                    btn.classList.add('current');
                    btn.innerHTML = `<span class="q-num-current-dot"></span>`;
                } else {
                    btn.textContent = i;
                }
                let isUnanswered = false;
                // Below logic needs full currentQuizQuestions structure to be final
                // if (questionDataForButton && questionDataForButton.question_type === 'student_produced_response') { 
                //     isUnanswered = !qState.spr_answer;
                // } else {
                //     isUnanswered = !qState.selected;
                // }
                if (isUnanswered && i !== currentQuestionNumber) btn.classList.add('unanswered');
                if (qState.marked) btn.innerHTML += `<span class="review-flag-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg></span>`;
                btn.dataset.question = i;
                btn.addEventListener('click', () => {
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
            // This function will be adapted in Phase 3
            if (!reviewPageViewEl || !reviewPageViewEl.classList.contains('active')) return;
            console.log("Rendering Review Page (stub)...");
            // const module = getCurrentModule(); // Will be adapted
             const moduleInfo = moduleMetadata[currentTestFlow[currentModuleIndex]]; // Tentative
            if(!moduleInfo) return;
            if(reviewPageSectionName) reviewPageSectionName.textContent = `Section ${currentModuleIndex + 1}: ${moduleInfo.name} Questions`;
            
            // ... (rest of the logic will be similar to populateQNavGrid but for review page)
            updateNavigation();
        }

        let confettiAnimationId; 
        const confettiParticles = []; 
        function startConfetti() { 
            const canvas = confettiCanvas;
            if (!canvas) { console.error("Confetti canvas not found"); return; }
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
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
                // loadQuestion() will be fully adapted in Phase 2.
                // For Phase 1, it will try to run but might not display correctly.
                loadQuestion(); 
            } else if (viewId === 'review-page-view') {
                if(qNavBtnFooter) qNavBtnFooter.style.display = 'none';
                renderReviewPage();
            } else if (viewId === 'finished-view') {
                startConfetti();
            } else if (viewId === 'home-view') {
                stopConfetti();
                 // Reset test flow for a new start from home
                currentTestFlow = [];
                currentQuizQuestions = [];
                currentModuleIndex = 0;
                currentQuestionNumber = 1;
                userAnswers = {};
                // Potentially reset other states like timer if needed
            }
            // updateNavigation will be fully adapted later. For now, it uses old logic.
            updateNavigation_OLD(); 
        }
        
        // --- Core UI Update `loadQuestion()` ---
        // THIS FUNCTION WILL BE HEAVILY MODIFIED IN PHASE 2
        function loadQuestion() {
            if (!testInterfaceViewEl.classList.contains('active')) {
                // ... (existing logic for review page header sync)
                return;
            }

            // const module = getCurrentModule_OLD(); // OLD, will change
            // const questionData = getCurrentQuestionData_OLD(); // OLD, will change

            // --- START Tentative Phase 1/2 adaptation attempt ---
            if (currentQuizQuestions.length === 0 || !currentQuizQuestions[currentQuestionNumber-1]) {
                console.warn("loadQuestion: currentQuizQuestions is empty or question not found for currentQuestionNumber:", currentQuestionNumber);
                if (questionTextMainEl) questionTextMainEl.innerHTML = "<p>Error: No question data loaded or question index out of bounds.</p>";
                if (answerOptionsMainEl) answerOptionsMainEl.innerHTML = "";
                if(totalQFooterEl) totalQFooterEl.textContent = '0';
                updateNavigation_OLD(); // Call old nav until it's updated
                return;
            }

            const questionData = currentQuizQuestions[currentQuestionNumber-1];
            const moduleInfo = moduleMetadata[currentTestFlow[currentModuleIndex]];
            
            if (!moduleInfo || !questionData) {
                 console.error("loadQuestion: ModuleInfo or Question data invalid. currentModuleIndex:", currentModuleIndex, "currentQuestionNumber:", currentQuestionNumber);
                 if (questionTextMainEl) questionTextMainEl.innerHTML = "<p>Error: Critical data missing for question display.</p>";
                 if (answerOptionsMainEl) answerOptionsMainEl.innerHTML = "";
                 showView('home-view'); return;
            }
            // --- END Tentative ---


            const answerState = getAnswerState(); // Uses currentModuleIndex, currentQuestionNumber

            // Below is mostly OLD logic based on testData, will be replaced in Phase 2
            const isMathModule = moduleInfo.type === "Math"; // Adapted for moduleInfo
            if(highlightsNotesBtn) highlightsNotesBtn.classList.toggle('hidden', isMathModule);
            if(calculatorBtnHeader) calculatorBtnHeader.classList.toggle('hidden', !isMathModule);
            if(referenceBtnHeader) referenceBtnHeader.classList.toggle('hidden', !isMathModule);
            // Assuming questionData.question_type will exist after JSON loading
            if(crossOutToolBtnMain) crossOutToolBtnMain.classList.toggle('hidden', questionData.question_type === 'student_produced_response'); // Adapted

            if(sectionTitleHeader) sectionTitleHeader.textContent = `Section ${currentModuleIndex + 1}: ${moduleInfo.name}`; // Adapted
            if(questionNumberBoxMainEl) questionNumberBoxMainEl.textContent = currentQuestionNumber; // Adapted (using 1-indexed currentQuestionNumber)
            if(questionTextMainEl) questionTextMainEl.innerHTML = `<p>${questionData.question_text || 'Question text missing.'}</p>`; // Adapted

            if(markReviewCheckboxMain) markReviewCheckboxMain.checked = answerState.marked;
            if(flagIconMain) { /* ... */ }

            if(mainContentAreaDynamic) mainContentAreaDynamic.classList.toggle('cross-out-active', isCrossOutToolActive && questionData.question_type !== 'student_produced_response');
            if(crossOutToolBtnMain) crossOutToolBtnMain.classList.toggle('active', isCrossOutToolActive && questionData.question_type !== 'student_produced_response');

            if(passagePane) passagePane.style.display = 'none'; 
            if(sprInstructionsPane) sprInstructionsPane.style.display = 'none';
            if(paneDivider) paneDivider.style.display = 'none';
            if(mainContentAreaDynamic) mainContentAreaDynamic.classList.remove('single-pane');


            // Example of how question_type from JSON would be used (incomplete for Phase 1)
            if (questionData.question_type === 'multiple_choice' && moduleInfo.passageText) { // Simplified: if R&W and passage in metadata
                if(passagePane) passagePane.style.display = 'flex';
                if(paneDivider) paneDivider.style.display = 'block';
                if(passageContentEl) passageContentEl.innerHTML = moduleInfo.passageText || ''; // Use passage from metadata
                if(answerOptionsMainEl) answerOptionsMainEl.style.display = 'flex';
                if(sprInputContainerMain) sprInputContainerMain.style.display = 'none';
            } else if (questionData.question_type === 'multiple_choice') { // mcq-single (no passage)
                if(mainContentAreaDynamic) mainContentAreaDynamic.classList.add('single-pane');
                if(answerOptionsMainEl) answerOptionsMainEl.style.display = 'flex';
                if(sprInputContainerMain) sprInputContainerMain.style.display = 'none';
            } else if (questionData.question_type === 'student_produced_response') {
                if(sprInstructionsPane) sprInstructionsPane.style.display = 'flex'; 
                if(paneDivider) paneDivider.style.display = 'block';
                if(sprInstructionsContent) sprInstructionsContent.innerHTML = (moduleInfo.spr_directions || '') + (moduleInfo.spr_examples_table || ''); // Use SPR info from metadata
                if(answerOptionsMainEl) answerOptionsMainEl.style.display = 'none';
                if(sprInputContainerMain) sprInputContainerMain.style.display = 'block';
                if(sprInputFieldMain) sprInputFieldMain.value = answerState.spr_answer || '';
                if(sprAnswerPreviewMain) sprAnswerPreviewMain.textContent = `Answer Preview: ${answerState.spr_answer || ''}`;
            }

            // Options rendering will need significant update for JSON structure in Phase 2
            if (questionData.option_a && answerOptionsMainEl) { 
                answerOptionsMainEl.innerHTML = ''; 
                const options = {};
                if (questionData.option_a) options['A'] = questionData.option_a;
                if (questionData.option_b) options['B'] = questionData.option_b;
                if (questionData.option_c) options['C'] = questionData.option_c;
                if (questionData.option_d) options['D'] = questionData.option_d;

                for (const [key, value] of Object.entries(options)) {
                    // ... (existing option rendering logic, largely compatible)
                    const isSelected = answerState.selected === key;
                    const isCrossedOut = answerState.crossedOut.includes(key);
                    const containerDiv = document.createElement('div');
                    containerDiv.className = 'answer-option-container';
                    containerDiv.dataset.optionKey = key; 
                    const optionDiv = document.createElement('div');
                    optionDiv.className = `answer-option ${isSelected && !isCrossedOut ? 'selected' : ''} ${isCrossedOut ? 'crossed-out' : ''}`;
                    const answerLetterDiv = document.createElement('div');
                    answerLetterDiv.className = `answer-letter ${isSelected && !isCrossedOut ? 'selected' : ''} ${isCrossedOut ? 'crossed-out' : ''}`;
                    answerLetterDiv.textContent = key;
                    const answerTextSpan = document.createElement('span');
                    answerTextSpan.className = 'answer-text';
                    if (isCrossedOut) answerTextSpan.classList.add('text-dimmed-for-crossout');
                    answerTextSpan.textContent = value; // MathJax will process this
                    optionDiv.appendChild(answerLetterDiv);
                    optionDiv.appendChild(answerTextSpan);
                    containerDiv.appendChild(optionDiv);
                    // ... (cross-out button logic)
                    answerOptionsMainEl.appendChild(containerDiv);
                }
            } else if (questionData.question_type !== 'student_produced_response' && answerOptionsMainEl) { 
                 answerOptionsMainEl.innerHTML = '';
            }
            
            // MathJax call (Phase 1: ensure it's called, even if content is partial)
            if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
                console.log("Calling MathJax.typesetPromise for main content area");
                MathJax.typesetPromise([passageContentEl, questionTextMainEl, answerOptionsMainEl, sprInstructionsContent]).catch(function (err) {
                    console.error('MathJax Typesetting Error:', err);
                });
            } else {
                console.warn("MathJax or MathJax.typesetPromise not available.");
            }

            updateNavigation_OLD(); // OLD navigation logic for now
        }
        
        // --- Event Listeners (Ensure elements exist before adding listeners) ---
        if(answerOptionsMainEl) answerOptionsMainEl.addEventListener('click', function(event) {
            const target = event.target;
            const answerContainer = target.closest('.answer-option-container');
            if (!answerContainer) return;
            const optionKey = answerContainer.dataset.optionKey;
            const action = target.dataset.action || (target.closest('[data-action]') ? target.closest('[data-action]').dataset.action : null);
            if (action === 'cross-out-individual') handleAnswerCrossOut(optionKey);
            else if (action === 'undo-cross-out') handleAnswerUndoCrossOut(optionKey);
            else if (target.closest('.answer-option')) handleAnswerSelect(optionKey);
        });

        function handleAnswerSelect(optionKey) {
            const answerState = getAnswerState();
            if (answerState.crossedOut.includes(optionKey) || isCrossOutToolActive) return;
            answerState.selected = optionKey;
            loadQuestion(); // Reload to reflect selection
        }
        function handleAnswerCrossOut(optionKey) {
             const answerState = getAnswerState();
             if (!answerState.crossedOut.includes(optionKey)) {
                 answerState.crossedOut.push(optionKey);
                 if (answerState.selected === optionKey) answerState.selected = null; // Unselect if crossed out
                 loadQuestion();
             }
        }
        function handleAnswerUndoCrossOut(optionKey) {
             const answerState = getAnswerState();
             answerState.crossedOut = answerState.crossedOut.filter(opt => opt !== optionKey);
             loadQuestion();
        }
        
        if(crossOutToolBtnMain) crossOutToolBtnMain.addEventListener('click', () => {
            // const currentQData = getCurrentQuestionData_OLD(); // Will be adapted
            if (currentQuizQuestions.length > 0 && currentQuizQuestions[currentQuestionNumber-1]) {
                const currentQData = currentQuizQuestions[currentQuestionNumber-1];
                 if (currentQData && currentQData.question_type === 'student_produced_response') return;
            }
            isCrossOutToolActive = !isCrossOutToolActive;
            loadQuestion(); 
        });
        if(sprInputFieldMain) sprInputFieldMain.addEventListener('input', (event) => { 
            const answerState = getAnswerState();
            answerState.spr_answer = event.target.value;
            if(sprAnswerPreviewMain) sprAnswerPreviewMain.textContent = `Answer Preview: ${event.target.value}`;
        });

        // --- Navigation Update (OLD, will be replaced in Phase 3) ---
        function updateNavigation_OLD() {
            if (!currentTestFlow[currentModuleIndex] || currentQuizQuestions.length === 0 ) { // Check if module data or questions are loaded
                if(backBtnFooter) backBtnFooter.disabled = true;
                if(nextBtnFooter) nextBtnFooter.disabled = true;
                if(currentQFooterEl) currentQFooterEl.textContent = '0';
                if(totalQFooterEl) totalQFooterEl.textContent = '0';
                return;
            }

            const totalQuestionsInModule = currentQuizQuestions.length;

            if(currentQFooterEl) currentQFooterEl.textContent = currentQuestionNumber;
            if(totalQFooterEl) totalQFooterEl.textContent = totalQuestionsInModule;

            if(backBtnFooter) backBtnFooter.disabled = (currentQuestionNumber === 1); // No back to previous module rule implies this is sufficient for now
            
            if(nextBtnFooter) {
                if (currentView === 'test-interface-view') {
                    nextBtnFooter.textContent = (currentQuestionNumber === totalQuestionsInModule) ? "Review Section" : "Next";
                    nextBtnFooter.disabled = false;
                } else if (currentView === 'review-page-view') {
                    // This logic will be fully adapted in Phase 3
                    nextBtnFooter.textContent = (currentModuleIndex === currentTestFlow.length - 1) ? "Finish Test" : "Next Module";
                    nextBtnFooter.disabled = false;
                }
            }
        }

        if(nextBtnFooter) nextBtnFooter.addEventListener('click', () => { 
            // This logic will be heavily adapted in Phase 3
            const totalQuestionsInModule = currentQuizQuestions.length;
            if (currentView === 'review-page-view') {
                // Logic for moving from review to next module or finish
                currentModuleIndex++;
                if (currentModuleIndex < currentTestFlow.length) {
                    showView('module-over-view'); // Placeholder transition
                    setTimeout(async () => {
                        currentQuestionNumber = 1;
                        const success = await loadQuizData(currentTestFlow[currentModuleIndex]);
                        if(success) showView('test-interface-view');
                        else showView('home-view'); // Or error view
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
             if (currentQuestionNumber > 1) {
                currentQuestionNumber--;
                isCrossOutToolActive = false; isHighlightingActive = false; if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
                loadQuestion();
            }
        });
        
        if(reviewDirectionsBtn) reviewDirectionsBtn.addEventListener('click', () => { /* ... */ });
        if(reviewTimerToggleBtn) reviewTimerToggleBtn.addEventListener('click', () => handleTimerToggle(reviewTimerText, reviewTimerClockIcon, reviewTimerToggleBtn));
        if(reviewBackBtnFooter) reviewBackBtnFooter.addEventListener('click', () => showView('test-interface-view') );
        // reviewNextBtnFooter's click is handled by the main nextBtnFooter logic when currentView is 'review-page-view'

        // --- PHASE 1: MODIFIED START BUTTON ---
        if(startTestPreviewBtn) {
            startTestPreviewBtn.addEventListener('click', async () => {
                console.log("Start Test Preview button clicked.");
                currentModuleIndex = 0;
                currentQuestionNumber = 1;
                userAnswers = {};
                isTimerHidden = false;
                isCrossOutToolActive = false;
                isHighlightingActive = false;
                if(highlightsNotesBtn) highlightsNotesBtn.classList.remove('active');
                if(calculatorOverlay) calculatorOverlay.classList.remove('visible');
                if(referenceSheetPanel) referenceSheetPanel.classList.remove('visible');

                currentTestFlow = ["DT-T0-RW-M1", "DT-T0-MT-M1"]; // For testing two modules

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
                        // Optionally, revert to home view or show an error message
                        showView('home-view');
                    }
                } else {
                    console.error("Test flow is empty. Cannot start test.");
                    alert("No test configured to start.");
                }
            });
        }
        // --- END PHASE 1 MODIFIED START BUTTON ---
        if(returnToHomeBtn) returnToHomeBtn.addEventListener('click', () => showView('home-view'));
        
        if(calculatorBtnHeader) calculatorBtnHeader.addEventListener('click', () => toggleModal(calculatorOverlay, true));
        if(calculatorCloseBtn) calculatorCloseBtn.addEventListener('click', () => toggleModal(calculatorOverlay, false));
        if(referenceBtnHeader) referenceBtnHeader.addEventListener('click', () => toggleModal(referenceSheetPanel, true));
        if(referenceSheetCloseBtn) referenceSheetCloseBtn.addEventListener('click', () => toggleModal(referenceSheetPanel, false));
        
        let isCalcDragging = false; let currentX_calc_drag, currentY_calc_drag, initialX_calc_drag, initialY_calc_drag, xOffset_calc_drag = 0, yOffset_calc_drag = 0;
        if(calculatorHeaderDraggable) { /* ... */ }

        if(highlightsNotesBtn && passageContentEl) {
            highlightsNotesBtn.addEventListener('click', () => {
                isHighlightingActive = !isHighlightingActive;
                highlightsNotesBtn.classList.toggle('active', isHighlightingActive);
                if (isHighlightingActive) {
                    passageContentEl.addEventListener('mouseup', handleTextSelection);
                    mainContentAreaDynamic.classList.add('highlight-active'); 
                } else {
                    passageContentEl.removeEventListener('mouseup', handleTextSelection);
                    mainContentAreaDynamic.classList.remove('highlight-active'); 
                }
            });
        }
        function handleTextSelection() {
            if (!isHighlightingActive) return;
            const selection = window.getSelection();
            if (!selection.rangeCount || selection.isCollapsed) return;
            const range = selection.getRangeAt(0);
            if (!passageContentEl.contains(range.commonAncestorContainer)) return;

            const span = document.createElement('span');
            span.className = 'text-highlight';
            try {
                range.surroundContents(span);
            } catch (e) { // Handle cases where selection crosses element boundaries imperfectly
                span.appendChild(range.extractContents());
                range.insertNode(span);
                console.warn("Highlighting across complex nodes, used extract/insert fallback.", e);
            }
            selection.removeAllRanges();
        }
        
        if(directionsBtn) directionsBtn.addEventListener('click', () => { 
            const moduleInfo = moduleMetadata[currentTestFlow[currentModuleIndex]];
            if(moduleInfo && directionsModalTitle) directionsModalTitle.textContent = `Section ${currentModuleIndex + 1}: ${moduleInfo.name} Directions`; 
            if(moduleInfo && directionsModalText) directionsModalText.innerHTML = moduleInfo.directions || "General directions"; 
            toggleModal(directionsModal, true); 
        });
        if(directionsModalCloseBtn) directionsModalCloseBtn.addEventListener('click', () => toggleModal(directionsModal, false));
        if(directionsModal) directionsModal.addEventListener('click', (e) => { if (e.target === directionsModal) toggleModal(directionsModal, false); });
        
        if(qNavBtnFooter) qNavBtnFooter.addEventListener('click', () => { populateQNavGrid(); toggleModal(qNavPopup, true); }); 
        if(qNavCloseBtn) qNavCloseBtn.addEventListener('click', () => toggleModal(qNavPopup, false));
        if(qNavGotoReviewBtn) qNavGotoReviewBtn.addEventListener('click', () => { toggleModal(qNavPopup, false); showView('review-page-view'); }); 
        
        if(markReviewCheckboxMain) markReviewCheckboxMain.addEventListener('change', () => { const answerState = getAnswerState(); answerState.marked = markReviewCheckboxMain.checked; if(flagIconMain) { /* ... */ } });
        
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

        // Initial Load (already set in HTML for home-view to be active)
        // showView('home-view'); // Set in HTML directly
    </script>