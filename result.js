import {
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

import {db} from "./script.js"

const user = JSON.parse(localStorage.getItem("user"));

document.addEventListener("DOMContentLoaded", () => {
  const finalScoreDisplay = document.getElementById("final-score");
  const questionsContainer = document.querySelector(".questions-container");
  const correctCountEl = document.getElementById("correct-count");
  const incorrectCountEl = document.getElementById("incorrect-count");
  const accuracyEl = document.getElementById("accuracy");
  const gradeEl = document.getElementById("grade");

  function decodeHTML(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  const score = parseInt(localStorage.getItem("quizScore") || 0);
  const questions = JSON.parse(localStorage.getItem("quizQuestions") || "[]");
  const correctAnswers = JSON.parse(
    localStorage.getItem("correctAnswers") || "[]"
  );
  const userAnswers = JSON.parse(localStorage.getItem("userAnswers") || "[]");

  const totalQuestions = questions.length || 10;
  const correctCount = score;
  const incorrectCount = totalQuestions - correctCount;
  const accuracy = Math.round((correctCount / totalQuestions) * 100);

  finalScoreDisplay.textContent = `Your Score: ${score} / ${totalQuestions}`;
  correctCountEl.textContent = correctCount;
  incorrectCountEl.textContent = incorrectCount;
  accuracyEl.textContent = `${accuracy}%`;

  let grade = "F";
  if (accuracy >= 90) grade = "A+";
  else if (accuracy >= 80) grade = "A";
  else if (accuracy >= 70) grade = "B";
  else if (accuracy >= 60) grade = "C";
  else if (accuracy >= 50) grade = "D";
  gradeEl.textContent = grade;

  async function saveQuizScore(score, accuracy, grade) {
    if (!user) return; 

    const quizData = {
      userId: user.uid,
      score: score,
      accuracy: accuracy,
      grade: grade,
      timestamp: new Date(),
    };

    try {
      await addDoc(collection(db, "quizScores"), quizData);
      console.log("Score saved!");
    } catch (error) {
      console.error("Error saving score:", error);
    }
  }

  saveQuizScore(score, accuracy, grade);

  questions.forEach((question, index) => {
    const questionBox = document.createElement("div");
    questionBox.classList.add("question-box");

    const questionText = document.createElement("div");
    questionText.classList.add("question-text");
    questionText.innerHTML = `Q${index + 1}: ${decodeHTML(question.question)}`;
    questionBox.appendChild(questionText);

    const optionsContainer = document.createElement("div");
    optionsContainer.classList.add("options-container");

    const options = [...question.incorrect_answers, question.correct_answer];

    options.forEach((option) => {
      const optionDiv = document.createElement("div");
      optionDiv.textContent = decodeHTML(option);
      optionDiv.classList.add("option");

      const decodedOption = decodeHTML(option.trim());
      const decodedCorrect = decodeHTML(correctAnswers[index]?.trim());
      const decodedUser = decodeHTML(userAnswers[index]?.trim() || "");

      //correct answers
      if (decodedOption === decodedCorrect) {
        optionDiv.classList.add("correct");
      }

      // wrong answers 
      if (decodedOption === decodedUser && decodedOption !== decodedCorrect) {
        optionDiv.classList.add("wrong");
      }

      optionsContainer.appendChild(optionDiv);
    });

    questionBox.appendChild(optionsContainer);
    questionsContainer.appendChild(questionBox);
  });
});

function retakeQuiz() {
  window.location.href = "question.html";
}

function shareResults() {
  const score = localStorage.getItem("quizScore") || 0;

  const shareText = `I scored ${score}/10 on the quiz!`;
  alert("Copied to clipboard: " + shareText);
  copyToClipboard(shareText);
}

function copyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}
