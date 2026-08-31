const API_BASE_URL = "https://fewebsite-backend.onrender.com";

let questions = [];
let currentIndex = 0;
let selectedChoiceIndex = null;
let hasAnswered = false;

let currentExam = "FE";
let currentGRECategory = "quant";      // "quant" | "verbal"
let currentGRESubsection = "all";      // depends on category, see maps below

// GRE Quantitative subsections. "all" is a combined view across every
// quant subject, including the legacy "Quantitative Reasoning" tag so
// older, not-yet-recategorized rows still show up somewhere.
const QUANT_SUBSECTIONS = {
    all: ["Quantitative Reasoning", "Arithmetic", "Algebra", "Geometry", "Data Analysis"],
    arithmetic: "Arithmetic",
    algebra: "Algebra",
    geometry: "Geometry",
    "data-analysis": "Data Analysis"
};

const QUANT_SUBSECTION_LABELS = {
    all: "All",
    arithmetic: "Arithmetic",
    algebra: "Algebra",
    geometry: "Geometry",
    "data-analysis": "Data Analysis"
};

// GRE Verbal subsections. "all" is a combined view across all three types.
const VERBAL_SUBSECTIONS = {
    all: ["Text Completion", "Sentence Equivalence", "Reading Comprehension"],
    "text-completion": "Text Completion",
    "sentence-equivalence": "Sentence Equivalence",
    "reading-comprehension": "Reading Comprehension"
};

const VERBAL_SUBSECTION_LABELS = {
    all: "All",
    "text-completion": "Text Completion",
    "sentence-equivalence": "Sentence Equivalence",
    "reading-comprehension": "Reading Comprehension"
};

const GRE_CATEGORY_SUBSECTIONS = {
    quant: QUANT_SUBSECTIONS,
    verbal: VERBAL_SUBSECTIONS
};

const GRE_CATEGORY_SUBSECTION_LABELS = {
    quant: QUANT_SUBSECTION_LABELS,
    verbal: VERBAL_SUBSECTION_LABELS
};

const GRE_CATEGORY_LABELS = {
    quant: "Quantitative",
    verbal: "Verbal"
};

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
const greCategoryTabs = document.querySelectorAll(".gre-category-tab");

const quantSubTabs = document.getElementById("quantSubTabs");
const verbalSubTabs = document.getElementById("verbalSubTabs");
const greSubTabs = document.querySelectorAll(".gre-subtab");

function setActiveExamTab(exam) {
    examTabs.forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.exam === exam
        );
    });
}

function setActiveGRECategory(category) {
    greCategoryTabs.forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.category === category
        );
    });
}

function setActiveGRESubsection(category, subsection) {
    greSubTabs.forEach(tab => {
        // Only toggle "active" within the sub-tab bar belonging to
        // the currently selected category.
        const belongsToCategory = tab.closest(
            category === "quant" ? "#quantSubTabs" : "#verbalSubTabs"
        );

        if (belongsToCategory) {
            tab.classList.toggle(
                "active",
                tab.dataset.subsection === subsection
            );
        }
    });
}

function updateGRETabs() {
    if (currentExam === "GRE") {
        greTabs.style.display = "flex";
        updateGRESubTabs();
    } else {
        greTabs.style.display = "none";
        quantSubTabs.style.display = "none";
        verbalSubTabs.style.display = "none";
    }
}

function updateGRESubTabs() {
    if (currentGRECategory === "quant") {
        quantSubTabs.style.display = "flex";
        verbalSubTabs.style.display = "none";
    } else {
        quantSubTabs.style.display = "none";
        verbalSubTabs.style.display = "flex";
    }
}

async function loadQuestions(exam, greCategory = "quant", greSubsection = "all") {

    currentExam = exam;
    currentGRECategory = greCategory;
    currentGRESubsection = greSubsection;
    currentIndex = 0;

    setActiveExamTab(exam);
    setActiveGRECategory(greCategory);
    setActiveGRESubsection(greCategory, greSubsection);
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
         * GRE filtering — narrow down to whichever category
         * (Quantitative / Verbal) and subsection within it is
         * currently selected. Each subsection maps to either a
         * single subject string, or (for "all") an array of subjects
         * combined into one view.
         */
        if (exam === "GRE") {

            const target = GRE_CATEGORY_SUBSECTIONS[greCategory][greSubsection];

            allQuestions = allQuestions.filter(q =>
                Array.isArray(target)
                    ? target.includes(q.subject)
                    : q.subject === target
            );

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

function greProgressLabel() {

    const categoryLabel = GRE_CATEGORY_LABELS[currentGRECategory];

    if (currentGRESubsection === "all") {
        return categoryLabel;
    }

    const subsectionLabel =
        GRE_CATEGORY_SUBSECTION_LABELS[currentGRECategory][currentGRESubsection];

    return `${categoryLabel} — ${subsectionLabel}`;
}

function showQuestion() {

    if (currentIndex >= questions.length) {

        questionCard.style.display = "none";
        doneState.style.display = "block";

        if (currentExam === "GRE") {

            progressEl.textContent =
                `GRE — ${greProgressLabel()} — finished`;

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

        progressEl.textContent =
            `GRE — ${greProgressLabel()} — Question ${currentIndex + 1} of ${questions.length}`;

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
                currentGRECategory,
                currentGRESubsection
            );

        } else {

            loadQuestions(exam);
        }
    });

});

// GRE top-level category tabs: Quantitative / Verbal
// Switching category resets the subsection back to "all".
greCategoryTabs.forEach(tab => {

    tab.addEventListener("click", () => {

        const category = tab.dataset.category;

        if (
            currentExam === "GRE" &&
            category !== currentGRECategory
        ) {

            loadQuestions(
                "GRE",
                category,
                "all"
            );
        }
    });

});

// GRE subsection tabs (contents differ depending on the active category:
// Arithmetic/Algebra/Geometry/Data Analysis for Quant, or
// Text Completion/Sentence Equivalence/Reading Comprehension for Verbal)
greSubTabs.forEach(tab => {

    tab.addEventListener("click", () => {

        const subsection = tab.dataset.subsection;

        if (
            currentExam === "GRE" &&
            subsection !== currentGRESubsection
        ) {

            loadQuestions(
                "GRE",
                currentGRECategory,
                subsection
            );
        }
    });

});

// Support direct links
//
// practice.html?exam=FE
// practice.html?exam=PE
// practice.html?exam=GRE
// practice.html?exam=GRE&category=quant
// practice.html?exam=GRE&category=quant&subsection=algebra
// practice.html?exam=GRE&category=verbal&subsection=reading-comprehension

const urlParams =
    new URLSearchParams(window.location.search);

const startingExam =
    (urlParams.get("exam") || "FE").toUpperCase();

const requestedCategory =
    (urlParams.get("category") || "quant").toLowerCase();

// Fall back to "quant" if an unrecognized category is passed in the URL.
const startingCategory = GRE_CATEGORY_SUBSECTIONS[requestedCategory]
    ? requestedCategory
    : "quant";

const requestedSubsection =
    (urlParams.get("subsection") || "all").toLowerCase();

// Fall back to "all" if the subsection doesn't exist under the chosen category.
const startingSubsection = GRE_CATEGORY_SUBSECTIONS[startingCategory][requestedSubsection]
    ? requestedSubsection
    : "all";

if (startingExam === "GRE") {

    loadQuestions(
        "GRE",
        startingCategory,
        startingSubsection
    );

} else {

    loadQuestions(startingExam);

}