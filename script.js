// --- MINIMAL TEST SCRIPT.JS ---

console.log("Minimal test script.js STARTED.");

const startFullPracticeTestBtn_Minimal = document.getElementById('start-full-practice-test-btn');
const homeViewEl_Minimal = document.getElementById('home-view');
const testInterfaceViewEl_Minimal = document.getElementById('test-interface-view');

console.log("Attempting to find start button. Element found:", startFullPracticeTestBtn_Minimal);

if (startFullPracticeTestBtn_Minimal) {
    console.log("Start button FOUND. Adding event listener.");
    startFullPracticeTestBtn_Minimal.addEventListener('click', () => {
        console.log("MINIMAL TEST: Start Full Practice Test button CLICKED!");
        
        // Extremely simple view switch for testing
        if (homeViewEl_Minimal) homeViewEl_Minimal.classList.remove('active');
        if (testInterfaceViewEl_Minimal) testInterfaceViewEl_Minimal.classList.add('active');
        
        alert("Minimal test: Start button clicked, view should change.");
    });
} else {
    console.error("MINIMAL TEST: Start Full Practice Test button (start-full-practice-test-btn) NOT FOUND!");
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("MINIMAL TEST: DOMContentLoaded event fired.");
    // Make sure home view is active initially by directly manipulating class here for test
    if (homeViewEl_Minimal && testInterfaceViewEl_Minimal) {
        homeViewEl_Minimal.classList.add('active');
        testInterfaceViewEl_Minimal.classList.remove('active');
        console.log("Minimal test: Home view set to active on DOMContentLoaded.");
    } else {
        console.error("Minimal test: Home or Test Interface view elements not found on DOMContentLoaded.");
    }
});

console.log("Minimal test script.js ENDED parsing.");
