// CHANGED: Phase 3 - Update startTestPreviewBtn listener for robustness
if(startTestPreviewBtn) {
    startTestPreviewBtn.addEventListener('click', async () => {
        console.log("Start Test Preview button clicked (Phase 3)."); // Added more specific log
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

        // Ensure currentTestFlow is correctly initialized for a new test run
        currentTestFlow = ["DT-T0-RW-M1", "DT-T0-MT-M1"]; 
        console.log("Test flow set to:", currentTestFlow); // Log the test flow

        if (currentTestFlow.length > 0) {
            const firstQuizName = currentTestFlow[currentModuleIndex];
            console.log(`Attempting to load first quiz: ${firstQuizName}`); // Log which quiz is being loaded

            startTestPreviewBtn.textContent = "Loading...";
            startTestPreviewBtn.disabled = true;
            
            const success = await loadQuizData(firstQuizName); // Wait for data loading
            
            startTestPreviewBtn.textContent = "Start"; // Reset button text regardless of success/failure for retry
            startTestPreviewBtn.disabled = false; // Re-enable button

            if (success && currentQuizQuestions.length > 0) {
                console.log("Initial quiz data loaded successfully. Showing test interface.");
                populateQNavGrid(); // Populate QNav for the first module
                showView('test-interface-view'); // This calls loadQuestion and updateNavigation
            } else {
                console.error("Failed to load initial quiz data or no questions found after attempting load.");
                alert("Could not start the test. Please check the console for errors. Ensure JSON files are accessible and GITHUB_JSON_BASE_URL is correct.");
                showView('home-view'); // Revert to home view on failure
            }
        } else {
            console.error("Test flow is empty. Cannot start test.");
            alert("No test configured to start.");
        }
    });
}
