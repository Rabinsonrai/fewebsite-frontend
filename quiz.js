// Change this if your backend runs somewhere other than localhost:5000
const API_BASE_URL = "https://fewebsite-backend.onrender.com";

let questions = [];
let currentIndex = 0;
let selectedChoiceIndex = null;
let hasAnswered = false;
let currentExam = "FE";

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


function setActiveTab(exam) {
    examTabs.forEach(tab => {
        tab.classList.toggle("active", tab.dataset.exam === exam);
    });
}


async function loadQuestions(exam) {

    currentExam = exam;
    currentIndex = 0;

    setActiveTab(exam);

    // Reset UI state
    questionCard.style.display = "none";
    doneState.style.display = "none";
    errorState.style.display = "none";
    loadingState.style.display = "block";
    progressEl.textContent = "Loading questions...";

    try {

        const response = await fetch(`${API_BASE_URL}/api/questions/${exam}?limit=10`);

        if (!response.ok) {
            throw new Error("Bad response from server");
        }

        questions = await response.json();

        if (questions.length === 0) {
            throw new Error("No questions returned");
        }

        loadingState.style.display = "none";
        showQuestion();

    } catch (err) {

        console.error(err);

        document.getElementById("apiUrlDisplay").textContent = API_BASE_URL;

        loadingState.style.display = "none";
        errorState.style.display = "block";
        progressEl.textContent = "";

    }

}


function showQuestion() {

    if (currentIndex >= questions.length) {
        questionCard.style.display = "none";
        doneState.style.display = "block";
        progressEl.textContent = `${currentExam} — finished`;
        return;
    }

    const q = questions[currentIndex];

    selectedChoiceIndex = null;
    hasAnswered = false;

    progressEl.textContent = `${currentExam} — Question ${currentIndex + 1} of ${questions.length}`;
    questionSubjectEl.textContent = q.subject;
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

        choiceDiv.addEventListener("click", () => selectChoice(index));

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

    const chosen = document.querySelector(`.choice[data-index="${index}"]`);
    chosen.classList.add("selected");
    chosen.querySelector("input").checked = true;

    submitBtn.disabled = false;

}


async function submitAnswer() {

    if (selectedChoiceIndex === null || hasAnswered) return;

    hasAnswered = true;
    submitBtn.disabled = true;

    const q = questions[currentIndex];

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/questions/${q.id}/answer`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: "anonymous",
                    selectedAnswer: selectedChoiceIndex
                })
            }
        );

        const result = await response.json();

        const chosenEl = document.querySelector(`.choice[data-index="${selectedChoiceIndex}"]`);
        const correctEl = document.querySelector(`.choice[data-index="${result.correctAnswer}"]`);

        correctEl.classList.add("correct");

        if (!result.correct) {
            chosenEl.classList.add("incorrect");
        }

        feedbackResultEl.textContent = result.correct
            ? "✓ Correct!"
            : "✗ Not quite.";
        feedbackResultEl.className = "feedback-result " + (result.correct ? "correct" : "incorrect");

        feedbackExplanationEl.textContent = result.explanation || "";

        submitBtn.style.display = "none";
        feedbackEl.style.display = "block";

    } catch (err) {
        console.error(err);
        alert("Couldn't submit your answer. Check that the backend server is running.");
        hasAnswered = false;
        submitBtn.disabled = false;
    }

}


function nextQuestion() {
    currentIndex++;
    showQuestion();
}


submitBtn.addEventListener("click", submitAnswer);
nextBtn.addEventListener("click", nextQuestion);

examTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        if (tab.dataset.exam !== currentExam) {
            loadQuestions(tab.dataset.exam);
        }
    });
});

// Support linking directly to an exam, e.g. practice.html?exam=PE
const urlParams = new URLSearchParams(window.location.search);
const startingExam = urlParams.get("exam") || "FE";

loadQuestions(startingExam.toUpperCase());
