let questions = [];
let correctAns = [];
let currentIndex = 0;
let timerInterval;
let score = 0;
let consecutiveCorrect = 0;
let consecutiveIncorrect = 0;

let catNum;
const categories=  {
  Sports : 21,
  History : 23,
  Animals:27,
  Computers :18,
}
let currentDifficulty = "easy"; // Starting with easy difficulty
const TIME_LIMIT = 35;
const clickSound = new Audio("./click-1.wav");
const submitSound = new Audio("./click-2.wav");
const countdownSound = new Audio("./tick-tock.wav");

const loader = document.getElementsByClassName("loading");
const quizScreen = document.getElementsByClassName("quiz-cotainer");
quizScreen[0].style.display = "none";

const playSound = (sound) => {
  sound.currentTime = 0;
  sound.play();
};

const stopSound = (sound) => {
  sound.pause();
  sound.currentTime = 0;
};

// Initialize the quiz

document.addEventListener("DOMContentLoaded", () => {
  const difficultyIndicator = document.createElement("div");
  difficultyIndicator.className = "difficulty-indicator";
  difficultyIndicator.innerHTML = `Current Difficulty: <span class="difficulty-level">Easy</span>`;
  document.querySelector(".quiz-cotainer").prepend(difficultyIndicator);

  const params = new URLSearchParams(window.location.search);
  const value = params.get("category"); 

  console.log(value); 
   catNum = categories[value];
  console.log(catNum);
  fetchQuestion(currentDifficulty);

  // deselecting the option if user clicks outside the options
  const quizContainer = document.querySelector(".quiz-cotainer");
  quizContainer.addEventListener("click", (event) => {
    if (!event.target.closest(".option")) {
      const selectedOption = document.querySelector(
        'input[name="option"]:checked'
      );
      if (selectedOption) {
        selectedOption.checked = false;
      }
    }
  });
});

// Dynamic api call according to difficulty level
function fetchQuestion(difficulty) {
  loader[0].style.display = "block";
  quizScreen[0].style.display = "none";

  // Updating difficulty indicator as fetch question will only be called if there is new difficulty value
  updateDifficultyDisplay(difficulty);

  fetch(
    `https://opentdb.com/api.php?amount=10&category=${catNum}&difficulty=${difficulty}&type=multiple`
  )
    .then((res) => res.json())
    .then((data) => {
      if (data.response_code === 0 && data.results.length > 0) {
        loader[0].style.display = "none";
        quizScreen[0].style.display = "block";

        questions = data.results; //10 cheeje hai
        correctAns = questions.map((q) => q.correct_answer); // 10 cheeje hai
        console.log(correctAns);
        localStorage.setItem("quizQuestions", JSON.stringify(questions));
        localStorage.setItem("correctAnswers", JSON.stringify(correctAns));
        localStorage.setItem("currentDifficulty", difficulty);

        currentIndex = 0;

        // const submitButton = document.getElementById("submit");

        showQuestions(currentIndex);

        document
          .getElementById("submit")
          .addEventListener("click", handleSubmit);
      } else {
        console.error("Error fetching questions:", data);
        alert("Failed to load questions. Please try again.");
        loader[0].style.display = "none";
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      alert("Network error. Please check your connection and try again.");
      loader[0].style.display = "none";
    });
}

function updateDifficultyDisplay(difficulty) {
  const difficultyLevel = document.querySelector(".difficulty-level");
  if (difficultyLevel) {
    difficultyLevel.textContent =
      difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

    // Changing colours based on the difficulty level
    if (difficulty === "easy") {
      difficultyLevel.style.color = "#4CAF50"; // Green
    } else if (difficulty === "medium") {
      difficultyLevel.style.color = "#FF9800"; // Orange
    } else {
      difficultyLevel.style.color = "#F44336"; // Red
    }
  }
}

function handleSubmit() {
  playSound(clickSound);
  const selectedOption = document.querySelector('input[name="option"]:checked');
  const questionContainer = document.getElementsByClassName("question")[0];

  const answers = document.querySelectorAll(".answers")[0];
  const optionContainers = document.querySelectorAll(".option");

  if (selectedOption) {
    const userAnswer = selectedOption.value;
    const correctAnswer = correctAns[currentIndex];

    // Storing user answer to show correct/incorrect ans on result page 

    let userAnswers = JSON.parse(localStorage.getItem("userAnswers")) || [];
    userAnswers[currentIndex] = userAnswer;
    localStorage.setItem("userAnswers", JSON.stringify(userAnswers));

    // Check if answer is correct and update score
    // upon 3 consecutive correct - increase difficulty 
    // upon 2 consecutive wrong  - decrease difficulty 

    const isCorrect = userAnswer === correctAnswer;
    if (isCorrect) {
      score++;
      consecutiveCorrect++;
      consecutiveIncorrect = 0;
    } else {
      consecutiveCorrect = 0;
      consecutiveIncorrect++;
    }

    // storing the difficulty as checkdifficulty method will perform changes in "currentDifficulty variable"

    const oldDifficulty = currentDifficulty;
    checkDifficultyChange();

    // show notification only if difficulty actually changed

    if (oldDifficulty !== currentDifficulty) {
      showDifficultyChangeNotification(
        currentDifficulty === "medium"
          ? "Difficulty increased to Medium!"
          : currentDifficulty === "hard"
          ? "Difficulty increased to Hard!"
          : "Difficulty decreased to " +
            currentDifficulty.charAt(0).toUpperCase() +
            currentDifficulty.slice(1) +
            "."
      );
      // Updating display on difficulty change 

      updateDifficultyDisplay(currentDifficulty);
    }

    // Animating question changes
    // Sliding-out current question

    questionContainer.classList.add("slide-out");
    answers.classList.add("slide-out");

    questionContainer.addEventListener(
      "animationend",
      function handleSlideOut() {
        questionContainer.classList.remove("slide-out");
        answers.classList.remove("slide-out");

        currentIndex++;
        showQuestions(currentIndex);

        // Slide-in animation after new question is rendered

        questionContainer.classList.add("slide-in");
        answers.classList.add("slide-in");

        questionContainer.addEventListener(
          "animationend",
          function handleSlideIn() {
            questionContainer.classList.remove("slide-in");
            answers.classList.remove("slide-in");
          },
          { once: true }
        );

        questionContainer.removeEventListener("animationend", handleSlideOut);
      },
      { once: true }
    );
  } else {

    // Shake effect onboth question and option containers when no option is selected

    questionContainer.classList.add("shake");
    optionContainers.forEach((option) => option.classList.add("shake"));

    setTimeout(() => {
      questionContainer.classList.remove("shake");
      optionContainers.forEach((option) => option.classList.remove("shake"));
    }, 300);
  }
}

function checkDifficultyChange() {
  if (currentDifficulty === "easy" && consecutiveCorrect >= 3) {
    currentDifficulty = "medium";
  } else if (currentDifficulty === "medium") {
    if (consecutiveCorrect >= 3) {
      currentDifficulty = "hard";
    } else if (consecutiveIncorrect >= 2) {
      currentDifficulty = "easy";
    }
  } else if (currentDifficulty === "hard" && consecutiveIncorrect >= 2) {
    currentDifficulty = "medium";
  }
}

function showDifficultyChangeNotification(message) {
  const existingNotifications = document.querySelectorAll(
    ".difficulty-notification"
  );
  existingNotifications.forEach((notification) => notification.remove());

  const notification = document.createElement("div");
  notification.className = "difficulty-notification";
  notification.textContent = message;

  if (message.includes("increased")) {
    notification.style.backgroundColor = "#FF9800";
  } else {
    notification.style.backgroundColor = "#2196F3";
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateY(0)";
  }, 100);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(-20px)";
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

function showQuestions(currentIndex) {
  if (currentIndex >= questions.length) {
    localStorage.setItem("quizScore", score);
    window.location.href = "./result.html";
    return;
  }

  const dots = document.querySelectorAll(".pagination .dot");
  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentIndex);
  });

  const questiondata = questions[currentIndex];
  const questionContainer = document.getElementsByClassName("question")[0];

  questionContainer.innerHTML = "";

  const p = document.createElement("span");
  p.innerHTML = `${currentIndex + 1}) ${questiondata.question}`;
  questionContainer.appendChild(p);

  const options = shuffleArray([
    ...questiondata.incorrect_answers,
    questiondata.correct_answer,
  ]);

  const optionContainers = document.getElementsByClassName("option");

  for (let optionContainer of optionContainers) {
    optionContainer.innerHTML = "";
  }

  for (let i = 0; i < optionContainers.length; i++) {
    const optionContainer = optionContainers[i];

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "option";
    input.id = `option-${i}`;
    input.value = options[i];

    const label = document.createElement("label");
    label.setAttribute("for", `option-${i}`);
    label.innerHTML = `${String.fromCharCode(97 + i)}) ${options[i]}`;

    input.addEventListener("click", () => playSound(submitSound));

    optionContainer.appendChild(input);
    optionContainer.appendChild(label);
  }
  startTimer(TIME_LIMIT);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function startTimer(time) {
  clearInterval(timerInterval);
  stopSound(countdownSound);
  const timerDisplay = document.getElementById("timer");
  timerDisplay.textContent = `Time left: ${time}s`;

  timerInterval = setInterval(() => {
    time--;
    timerDisplay.textContent = `Time left: ${time}s`;
    if (time <= 5 && time > 0) playSound(countdownSound);
    if (time <= 0) {
      clearInterval(timerInterval);

      // marking answer as incorrect if no option is selected within time-limit . 

      consecutiveCorrect = 0;
      consecutiveIncorrect++;

      const oldDifficulty = currentDifficulty;
      checkDifficultyChange();

      if (oldDifficulty !== currentDifficulty) {
        showDifficultyChangeNotification(
          currentDifficulty === "medium"
            ? "Difficulty increased to Medium!"
            : currentDifficulty === "hard"
            ? "Difficulty increased to Hard!"
            : "Difficulty decreased to " +
              currentDifficulty.charAt(0).toUpperCase() +
              currentDifficulty.slice(1) +
              "."
        );
        updateDifficultyDisplay(currentDifficulty);
      }

      currentIndex++;
      showQuestions(currentIndex);
    }
  }, 1000);
}

const vibrate = (pattern = [50]) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};
