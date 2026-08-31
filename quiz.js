const API_BASE_URL = "https://fewebsite-backend.onrender.com";

let questions = [];
let currentIndex = 0;
let selectedChoiceIndex = null;
let hasAnswered = false;

let currentExam = "FE";
let currentGRESection = "quant";

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const doneState = document.getElementById("doneState");
const questionCard = document.getElementById("questionCard");

const progressEl = document.getElementById("progress");
const questionSubjectEl = document.getElementById("questionSubject");
const questionTextEl = document.getElementById("questionText");
const choicesListEl = document.getElementById("choicesList");
const submitBtn = document.getElementById("submitBtn");
const feedbackEl = document.getElementById("feedback");
const feedbackResultEl = document.getElementById("feedbackResult");
const feedbackExplanationEl = document.getElementById("feedbackExplanation");
const nextBtn = document.getElementById("nextBtn");

const examTabs = document.querySelectorAll(".exam-tab");
const greTabs = document.getElementById("greTabs");
const greSectionTabs = document.querySelectorAll(".gre-tab");

function setActiveExamTab(exam) {
examTabs.forEach(tab => {
tab.classList.toggle(
"active",
tab.dataset.exam === exam
);
});
}

function setActiveGRESection(section) {
greSectionTabs.forEach(tab => {
tab.classList.toggle(
"active",
tab.dataset.section === section
);
});
}

function updateGRETabs() {
if (currentExam === "GRE") {
greTabs.style.display = "flex";
} else {
greTabs.style.display = "none";
}
}

async function loadQuestions(exam, greSection = "quant") {


currentExam = exam;
currentGRESection = greSection;
currentIndex = 0;

setActiveExamTab(exam);
setActiveGRESection(greSection);
updateGRETabs();

questionCard.style.display = "none";
doneState.style.display = "none";
errorState.style.display = "none";
loadingState.style.display = "block";

progressEl.textContent = "Loading questions...";

try {

    const response = await fetch(
        `${API_BASE_URL}/api/questions/${exam}?limit=100`
    );

    if (!response.ok) {
        throw new Error("Bad response from server");
    }

    let allQuestions = await response.json();

    /*
     * GRE filtering
     */
    if (exam === "GRE") {

    if (greSection === "quant") {

        allQuestions = allQuestions.filter(
            q => q.subject === "Quantitative Reasoning"
        );

    } else if (greSection === "verbal") {

        allQuestions = allQuestions.filter(
            q => q.subject === "Verbal Reasoning"
        );

    }

}

    questions = allQuestions;

    if (questions.length === 0) {
        throw new Error("No questions returned");
    }

    loadingState.style.display = "none";

    showQuestion();

} catch (err) {

    console.error(err);

    document.getElementById("apiUrlDisplay").textContent =
        API_BASE_URL;

    loadingState.style.display = "none";
    errorState.style.display = "block";

    progressEl.textContent = "";
}


}

function showQuestion() {


if (currentIndex >= questions.length) {

    questionCard.style.display = "none";
    doneState.style.display = "block";

    if (currentExam === "GRE") {

        progressEl.textContent =
            `GRE — ${currentGRESection === "quant" ? "Quant" : "Verbal"} — finished`;

    } else {

        progressEl.textContent =
            `${currentExam} — finished`;
    }

    return;
}

const q = questions[currentIndex];

selectedChoiceIndex = null;
hasAnswered = false;

if (currentExam === "GRE") {

    const sectionName =
        currentGRESection === "quant"
            ? "Quant"
            : "Verbal";

    progressEl.textContent =
        `GRE — ${sectionName} — Question ${currentIndex + 1} of ${questions.length}`;

} else {

    progressEl.textContent =
        `${currentExam} — Question ${currentIndex + 1} of ${questions.length}`;
}

questionSubjectEl.textContent = q.subject || "";
questionTextEl.textContent = q.question;

choicesListEl.innerHTML = "";

q.choices.forEach((choiceText, index) => {

    const choiceDiv = document.createElement("div");

    choiceDiv.className = "choice";
    choiceDiv.dataset.index = index;

    choiceDiv.innerHTML = `
        <input type="radio" name="choice" id="choice${index}">
        <label for="choice${index}">${choiceText}</label>
    `;

    choiceDiv.addEventListener(
        "click",
        () => selectChoice(index)
    );

    choicesListEl.appendChild(choiceDiv);
});

submitBtn.disabled = true;
submitBtn.style.display = "block";

feedbackEl.style.display = "none";

questionCard.style.display = "block";


}

function selectChoice(index) {


if (hasAnswered) return;

selectedChoiceIndex = index;

document.querySelectorAll(".choice").forEach(el => {

    el.classList.remove("selected");

    el.querySelector("input").checked = false;
});

const chosen = document.querySelector(
    `.choice[data-index="${index}"]`
);

chosen.classList.add("selected");

chosen.querySelector("input").checked = true;

submitBtn.disabled = false;


}

async function submitAnswer() {


if (
    selectedChoiceIndex === null ||
    hasAnswered
) {
    return;
}

hasAnswered = true;
submitBtn.disabled = true;

const q = questions[currentIndex];

try {

    const response = await fetch(
        `${API_BASE_URL}/api/questions/${q.id}/answer`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                userId: "anonymous",
                selectedAnswer: selectedChoiceIndex
            })
        }
    );

    const result = await response.json();

    const chosenEl = document.querySelector(
        `.choice[data-index="${selectedChoiceIndex}"]`
    );

    const correctEl = document.querySelector(
        `.choice[data-index="${result.correctAnswer}"]`
    );

    if (correctEl) {
        correctEl.classList.add("correct");
    }

    if (!result.correct && chosenEl) {
        chosenEl.classList.add("incorrect");
    }

    feedbackResultEl.textContent =
        result.correct
            ? "✓ Correct!"
            : "✗ Not quite.";

    feedbackResultEl.className =
        "feedback-result " +
        (result.correct ? "correct" : "incorrect");

    feedbackExplanationEl.textContent =
        result.explanation || "";

    submitBtn.style.display = "none";

    feedbackEl.style.display = "block";

} catch (err) {

    console.error(err);

    alert(
        "Couldn't submit your answer. Check that the backend server is running."
    );

    hasAnswered = false;

    submitBtn.disabled = false;
}


}

function nextQuestion() {
currentIndex++;
showQuestion();
}

submitBtn.addEventListener(
"click",
submitAnswer
);

nextBtn.addEventListener(
"click",
nextQuestion
);

// Main FE / PE / GRE tabs
examTabs.forEach(tab => {


tab.addEventListener("click", () => {

    const exam = tab.dataset.exam;

    if (exam === "GRE") {

        loadQuestions(
            "GRE",
            currentGRESection
        );

    } else {

        loadQuestions(exam);
    }
});


});

// GRE Quant / Verbal tabs
greSectionTabs.forEach(tab => {


tab.addEventListener("click", () => {

    const section = tab.dataset.section;

    if (
        currentExam === "GRE" &&
        section !== currentGRESection
    ) {

        loadQuestions(
            "GRE",
            section
        );
    }
});


});

// Support direct links
//
// practice.html?exam=FE
// practice.html?exam=PE
// practice.html?exam=GRE
// practice.html?exam=GRE&section=verbal

const urlParams =
new URLSearchParams(window.location.search);

const startingExam =
(urlParams.get("exam") || "FE").toUpperCase();

const startingSection =
(urlParams.get("section") || "quant").toLowerCase();

if (startingExam === "GRE") {

loadQuestions(
    "GRE",
    startingSection === "verbal"
        ? "verbal"
        : "quant"
);


} else {


loadQuestions(startingExam);


}
