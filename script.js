
"use strict";

/* GUESSR - NUMBER GUESSING GAME */

const guessForm = document.getElementById("guessForm");
const guessInput = document.getElementById("guessInput");
const guessButton = document.getElementById("guessButton");
const difficultySelect = document.getElementById("difficulty");
const numberDisplay = document.getElementById("numberDisplay");
const numberHint = document.getElementById("numberHint");
const attemptsLeftDisplay = document.getElementById("attemptsLeft");
const progressFill = document.getElementById("progressFill");
const feedbackBox = document.getElementById("feedbackBox");
const feedbackIcon = document.getElementById("feedbackIcon");
const feedbackTitle = document.getElementById("feedbackTitle");
const feedbackMessage = document.getElementById("feedbackMessage");
const inputError = document.getElementById("inputError");
const hintButton = document.getElementById("hintButton");
const hintCountDisplay = document.getElementById("hintCount");
const resetButton = document.getElementById("resetButton");
const roundNumberDisplay = document.getElementById("roundNumber");
const totalWinsDisplay = document.getElementById("totalWins");
const bestScoreDisplay = document.getElementById("bestScore");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const soundButton = document.getElementById("soundButton");
const confettiLayer = document.getElementById("confettiLayer");

/* GAME SETTINGS */

const difficultySettings = {
    easy: {
        max: 50,
        attempts: 10
    },
    medium: {
        max: 100,
        attempts: 10
    },
    hard: {
        max: 500,
        attempts: 10
    }
};

let secretNumber = 0;
let maxNumber = 100;
let maxAttempts = 10;
let attemptsLeft = 10;
let hintsLeft = 3;
let roundNumber = 1;
let gameOver = false;
let soundEnabled = false;
let guessedNumbers = [];
let previousGuesses = [];
let bestScore = null;
let totalWins = 0;
let gameHistory = [];

/* SAFE LOCAL STORAGE */

function loadSavedData() {
    try {
        const savedWins = Number(localStorage.getItem("guessrWins"));
        const savedBest = Number(localStorage.getItem("guessrBest"));
        const savedHistory = JSON.parse(
            localStorage.getItem("guessrHistory") || "[]"
        );

        totalWins = Number.isFinite(savedWins) && savedWins >= 0
            ? savedWins
            : 0;

        bestScore = Number.isFinite(savedBest) && savedBest > 0
            ? savedBest
            : null;

        gameHistory = Array.isArray(savedHistory)
            ? savedHistory.slice(0, 10)
            : [];
    } catch (error) {
        totalWins = 0;
        bestScore = null;
        gameHistory = [];
    }
}

function saveData() {
    try {
        localStorage.setItem("guessrWins", String(totalWins));

        if (bestScore !== null) {
            localStorage.setItem("guessrBest", String(bestScore));
        } else {
            localStorage.removeItem("guessrBest");
        }

        localStorage.setItem(
            "guessrHistory",
            JSON.stringify(gameHistory.slice(0, 10))
        );
    } catch (error) {
        // The game still works if browser storage is unavailable.
    }
}

/* START A NEW ROUND */

function startGame(incrementRound = false) {
    if (incrementRound) {
        roundNumber++;
    }

    const selectedDifficulty = difficultySelect.value;
    const settings = difficultySettings[selectedDifficulty];

    maxNumber = settings.max;
    maxAttempts = settings.attempts;
    attemptsLeft = maxAttempts;
    hintsLeft = 3;

    secretNumber = Math.floor(Math.random() * maxNumber) + 1;

    gameOver = false;
    guessedNumbers = [];
    previousGuesses = [];

    numberDisplay.innerHTML = "<span>?</span>";
    numberDisplay.classList.remove("revealed", "pop");

    numberHint.textContent =
        `Somewhere between 1 and ${maxNumber}. Find it!`;

    guessInput.value = "";
    guessInput.min = "1";
    guessInput.max = String(maxNumber);
    guessInput.disabled = false;

    guessButton.disabled = false;

    attemptsLeftDisplay.textContent = attemptsLeft;
    roundNumberDisplay.textContent = String(roundNumber).padStart(2, "0");

    progressFill.style.width = "100%";

    hintCountDisplay.textContent = "3 hints available";
    hintButton.disabled = false;

    inputError.textContent = "";

    setFeedback(
        "✦",
        "YOUR ADVENTURE STARTS HERE",
        "Enter your first guess and see where it takes you.",
        ""
    );

    updateStatistics();

    guessInput.focus();
}

/* FEEDBACK MESSAGE */

function setFeedback(icon, title, message, type) {
    feedbackIcon.textContent = icon;
    feedbackTitle.textContent = title;
    feedbackMessage.textContent = message;

    feedbackBox.classList.remove("success", "error");

    if (type) {
        feedbackBox.classList.add(type);
    }
}

/* HANDLE A GUESS */

guessForm.addEventListener("submit", function (event) {
    event.preventDefault();

    if (gameOver) {
        return;
    }

    const guess = Number(guessInput.value);

    inputError.textContent = "";

    if (
        guessInput.value.trim() === "" ||
        !Number.isInteger(guess) ||
        guess < 1 ||
        guess > maxNumber
    ) {
        inputError.textContent =
            `Enter a whole number between 1 and ${maxNumber}.`;
        guessInput.focus();
        return;
    }

    if (guessedNumbers.includes(guess)) {
        inputError.textContent =
            "You already tried that number. Try another one!";
        guessInput.select();
        return;
    }

    guessedNumbers.push(guess);
    previousGuesses.push(guess);

    attemptsLeft--;

    attemptsLeftDisplay.textContent = attemptsLeft;

    progressFill.style.width =
        `${(attemptsLeft / maxAttempts) * 100}%`;

    numberDisplay.classList.remove("pop");
    void numberDisplay.offsetWidth;
    numberDisplay.classList.add("pop");

    if (guess === secretNumber) {
        finishGame(true);
        return;
    }

    if (attemptsLeft === 0) {
        finishGame(false);
        return;
    }

    const difference = Math.abs(secretNumber - guess);

    if (guess < secretNumber) {
        if (difference <= 5) {
            setFeedback(
                "🔥",
                "SO CLOSE!",
                "Go a little higher. You're almost there!",
                ""
            );
        } else if (difference <= 15) {
            setFeedback(
                "↗",
                "GETTING WARMER",
                "The secret number is higher than your guess.",
                ""
            );
        } else {
            setFeedback(
                "⬆",
                "A LITTLE TOO LOW",
                "Aim higher! The hidden number is bigger.",
                ""
            );
        }
    } else {
        if (difference <= 5) {
            setFeedback(
                "🔥",
                "SO CLOSE!",
                "Go a little lower. You're almost there!",
                ""
            );
        } else if (difference <= 15) {
            setFeedback(
                "↘",
                "GETTING WARMER",
                "The secret number is lower than your guess.",
                ""
            );
        } else {
            setFeedback(
                "⬇",
                "A LITTLE TOO HIGH",
                "Aim lower! The hidden number is smaller.",
                ""
            );
        }
    }

    numberHint.textContent =
        `Your guesses: ${previousGuesses.join(", ")}`;

    guessInput.value = "";
    guessInput.focus();

    playSound("guess");
});

/* FINISH A ROUND */

function finishGame(won) {
    gameOver = true;

    guessInput.disabled = true;
    guessButton.disabled = true;
    hintButton.disabled = true;

    numberDisplay.innerHTML = `<span>${secretNumber}</span>`;
    numberDisplay.classList.add("revealed");

    numberHint.textContent = won
        ? "Treasure discovered. What a brilliant guess!"
        : "The secret has been revealed. Ready for another hunt?";

    progressFill.style.width = won
        ? `${(attemptsLeft / maxAttempts) * 100}%`
        : "0%";

    const guessesUsed = guessedNumbers.length;

    if (won) {
        totalWins++;

        if (bestScore === null || guessesUsed < bestScore) {
            bestScore = guessesUsed;
        }

        setFeedback(
            "🏆",
            "TREASURE FOUND!",
            `You cracked the code in ${guessesUsed} ${
                guessesUsed === 1 ? "guess" : "guesses"
            }! You're a true number hunter.`,
            "success"
        );

        createConfetti();
        playSound("win");
    } else {
        setFeedback(
            "☠",
            "HUNT OVER!",
            `The secret number was ${secretNumber}. Every attempt makes you sharper!`,
            "error"
        );

        playSound("lose");
    }

    addHistory(won, guessesUsed);
    updateStatistics();
    saveData();
}

/* HINT SYSTEM */

hintButton.addEventListener("click", function () {
    if (gameOver || hintsLeft <= 0) {
        return;
    }

    hintsLeft--;

    hintCountDisplay.textContent =
        `${hintsLeft} ${hintsLeft === 1 ? "hint" : "hints"} available`;

    if (hintsLeft === 0) {
        hintButton.disabled = true;
    }

    const hints = [];

    hints.push(
        secretNumber % 2 === 0
            ? "The secret number is EVEN."
            : "The secret number is ODD."
    );

    if (secretNumber <= Math.floor(maxNumber / 2)) {
        hints.push("The secret number is in the LOWER half of the range.");
    } else {
        hints.push("The secret number is in the UPPER half of the range.");
    }

    const lastGuess = previousGuesses[previousGuesses.length - 1];

    if (lastGuess !== undefined) {
        const difference = Math.abs(secretNumber - lastGuess);

        if (difference <= 5) {
            hints.push("You're within 5 of the secret number!");
        } else if (difference <= 10) {
            hints.push("You're within 10 of the secret number!");
        } else {
            hints.push("You're more than 10 away from your last guess.");
        }
    } else {
        const lastDigit = secretNumber % 10;
        hints.push(`The last digit is ${lastDigit}.`);
    }

    const hint = hints[Math.floor(Math.random() * hints.length)];

    setFeedback(
        "☼",
        "A CLUE FROM THE TREASURE MAP",
        hint,
        ""
    );

    playSound("hint");
});

/* RESTART BUTTON */

resetButton.addEventListener("click", function () {
    startGame(true);
});

/* CHANGE DIFFICULTY */

difficultySelect.addEventListener("change", function () {
    startGame(true);
});

/* STATISTICS */

function updateStatistics() {
    totalWinsDisplay.textContent = totalWins;

    bestScoreDisplay.textContent =
        bestScore === null ? "—" : bestScore;
}

/* GAME HISTORY */

function addHistory(won, guessesUsed) {
    const selectedDifficulty =
        difficultySettings[difficultySelect.value];

    const entry = {
        won: won,
        guesses: guessesUsed,
        number: secretNumber,
        difficulty: difficultySelect.value,
        max: selectedDifficulty.max,
        date: new Date().toLocaleDateString()
    };

    gameHistory.unshift(entry);
    gameHistory = gameHistory.slice(0, 10);

    renderHistory();
}

function renderHistory() {
    historyList.replaceChildren();

    if (gameHistory.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-history";

        const symbol = document.createElement("span");
        symbol.textContent = "☻";

        const message = document.createTextNode(
            "Your adventures will appear here."
        );

        empty.append(symbol, message);
        historyList.appendChild(empty);
        return;
    }

    gameHistory.forEach(function (entry) {
        const item = document.createElement("div");
        item.className = "history-item";

        const details = document.createElement("div");

        const title = document.createElement("h3");
        title.textContent = entry.won
            ? "Treasure discovered!"
            : "Hunt completed";

        const description = document.createElement("p");
        description.textContent =
            `${entry.difficulty.toUpperCase()} · Number ${entry.number} · ` +
            `${entry.guesses} ${entry.guesses === 1 ? "guess" : "guesses"}`;

        details.append(title, description);

        const result = document.createElement("span");
        result.className = "history-result " +
            (entry.won ? "won" : "lost");
        result.textContent = entry.won ? "WON ✓" : "MISSED ✕";

        const date = document.createElement("span");
        date.className = "history-date";
        date.textContent = entry.date;

        item.append(details, result, date);
        historyList.appendChild(item);
    });
}

/* CLEAR HISTORY */

clearHistoryButton.addEventListener("click", function () {
    gameHistory = [];

    renderHistory();
    saveData();
});

/* CONFETTI ANIMATION */

function createConfetti() {
    const colors = [
        "#f8d84e",
        "#ed5b40",
        "#447b50",
        "#25241f",
        "#ffffff"
    ];

    confettiLayer.replaceChildren();

    for (let i = 0; i < 75; i++) {
        const piece = document.createElement("span");

        piece.className = "confetti";

        piece.style.left = `${Math.random() * 100}%`;
        piece.style.backgroundColor =
            colors[Math.floor(Math.random() * colors.length)];

        piece.style.animationDelay = `${Math.random() * 1.2}s`;
        piece.style.animationDuration = `${2 + Math.random() * 1.5}s`;
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;

        confettiLayer.appendChild(piece);
    }

    window.setTimeout(function () {
        confettiLayer.replaceChildren();
    }, 5000);
}

/* OPTIONAL SOUND EFFECTS */

function playSound(type) {
    if (!soundEnabled) {
        return;
    }

    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return;
        }

        const audio = new AudioContextClass();
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();

        const frequencies = {
            guess: 440,
            hint: 660,
            win: 880,
            lose: 180
        };

        oscillator.type = "sine";
        oscillator.frequency.value = frequencies[type] || 440;

        gain.gain.setValueAtTime(0.08, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + 0.2
        );

        oscillator.connect(gain);
        gain.connect(audio.destination);

        oscillator.start();
        oscillator.stop(audio.currentTime + 0.2);

        oscillator.onended = function () {
            audio.close();
        };
    } catch (error) {
        // Sound is optional; gameplay does not depend on it.
    }
}

soundButton.style.display = "inline-grid";
soundButton.style.placeItems = "center";

soundButton.addEventListener("click", function () {
    soundEnabled = !soundEnabled;

    soundButton.textContent = soundEnabled ? "♫" : "♪";
    soundButton.setAttribute(
        "aria-label",
        soundEnabled ? "Disable sound" : "Enable sound"
    );

    soundButton.title = soundEnabled ? "Sound on" : "Sound off";

    if (soundEnabled) {
        playSound("guess");
    }
});

/* INITIALIZE */

loadSavedData();
updateStatistics();
renderHistory();
startGame();
