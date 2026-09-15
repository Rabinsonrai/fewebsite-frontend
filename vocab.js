const API_BASE_URL = "https://fewebsite-backend.onrender.com";

let words = [];
let currentIndex = 0;

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const emptyState = document.getElementById("emptyState");
const flashcardWrap = document.getElementById("flashcardWrap");

const vocabProgress = document.getElementById("vocabProgress");
const flashcard = document.getElementById("flashcard");
const wordText = document.getElementById("wordText");
const meaningText = document.getElementById("meaningText");
const exampleText = document.getElementById("exampleText");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const shuffleBtn = document.getElementById("shuffleBtn");

async function loadVocabulary() {

    loadingState.style.display = "block";
    errorState.style.display = "none";
    emptyState.style.display = "none";
    flashcardWrap.style.display = "none";

    try {

        const response = await fetch(`${API_BASE_URL}/api/vocabulary?limit=200`);

        if (!response.ok) {
            throw new Error("Bad response from server");
        }

        words = await response.json();

        loadingState.style.display = "none";

        if (words.length === 0) {
            emptyState.style.display = "block";
            return;
        }

        currentIndex = 0;
        flashcardWrap.style.display = "block";

        showCard();

    } catch (err) {

        console.error(err);

        loadingState.style.display = "none";
        errorState.style.display = "block";

    }

}

function showCard() {

    const w = words[currentIndex];

    flashcard.classList.remove("flipped");

    wordText.textContent = w.word;
    meaningText.textContent = w.meaning;
    exampleText.textContent = w.example_sentence;

    vocabProgress.textContent = `Card ${currentIndex + 1} of ${words.length}`;

}

function shuffleWords() {

    for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
    }

    currentIndex = 0;
    showCard();

}

flashcard.addEventListener("click", () => {
    flashcard.classList.toggle("flipped");
});

prevBtn.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + words.length) % words.length;
    showCard();
});

nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % words.length;
    showCard();
});

shuffleBtn.addEventListener("click", shuffleWords);

loadVocabulary();
