import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, addDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4LsvBDCDzwy7Y7ofGBK9V62cH-056x8U",
  authDomain: "quizapp-41d23.firebaseapp.com",
  projectId: "quizapp-41d23",
  storageBucket: "quizapp-41d23.firebasestorage.app",
  messagingSenderId: "890678854044",
  appId: "1:890678854044:web:f0d4a409c83ff60a9c8859"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);

const loggedin = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : undefined;

if (loggedin) {
  const loginMenu = document.querySelector(".Login-menu");
  if (loginMenu) loginMenu.style.display = "none";  

  const quizMenu = document.querySelector(".quiz-menu");
  if (quizMenu) quizMenu.style.display = "block";

  const categories = document.getElementsByClassName("category");
  for (let category of categories) {
    category.addEventListener("click", () => {
      const text = category.innerText;
      window.location.href = `./question.html?category=${text}`;
    });
  }

  const logoutBtn = document.querySelector(".Logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        localStorage.removeItem("user");
        window.location.reload(); // Refresh page after logout
      } catch (error) {
        console.error("Logout error:", error);
      }
    });
  }

  // Fetching scores
  fetchUserScores(loggedin.uid);

} else {
  const logoutBtn = document.querySelector(".Logout");
  if (logoutBtn) logoutBtn.style.display = "none";
  
  const loginMenu = document.querySelector(".Login-menu");
  if (loginMenu) loginMenu.style.display = "block";

  const loginbtn = document.querySelector("#login");
  if (loginbtn) {
    loginbtn.addEventListener("click", async () => {
      try {
        const user = await signInWithPopup(auth, provider);
        localStorage.setItem("user", JSON.stringify(user.user));
        window.location.reload();
      } catch (error) {
        console.error("Login error:", error);
      }
    });
  }
}

async function fetchUserScores(userId) {
  const scoresSection = document.querySelector(".quizScores");
  if (!scoresSection) return;

  try {
    const quizScoresRef = collection(db, "quizScores");
    const q = query(quizScoresRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const scoreDiv = document.createElement("div");
        scoreDiv.classList.add("score-item");

        scoreDiv.innerHTML = `
          <p><strong>Score:</strong> ${data.score}</p>
          <p><strong>Accuracy:</strong> ${data.accuracy}%</p>
          <p><strong>Grade:</strong> ${data.grade}</p>
          <p><strong>Timestamp:</strong> ${new Date(data.timestamp.seconds * 1000).toLocaleString()}</p>
        `;

        scoresSection.appendChild(scoreDiv);
      });
    } else {
      scoresSection.innerHTML = "<p>No quiz scores found.</p>";
    }
  } catch (error) {
    console.error("Error fetching quiz scores:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const createQuizBtn = document.querySelector(".create-text");
  const modal = document.getElementById("createQuizModal");
  const closeModalBtn = document.getElementById("closeModal");
  const generateQuizBtn = document.getElementById("generateQuizBtn");
  const difficultyOptions = document.querySelectorAll(".difficulty-option");
  const decreaseQuestionsBtn = document.getElementById("decreaseQuestions");
  const increaseQuestionsBtn = document.getElementById("increaseQuestions");
  const questionCountInput = document.getElementById("questionCount");
  const loadingState = document.getElementById("loadingState");
  const modalBody = document.querySelector(".modal-body");
  const modalFooter = document.querySelector(".modal-footer");

  if (createQuizBtn) {
      createQuizBtn.addEventListener("click", () => {
          modal.classList.add("active");
      });
  }

  if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => {
          modal.classList.remove("active");
      });
  }

  // Close modal when clicking outside
  if (modal) {
      modal.addEventListener("click", (e) => {
          if (e.target === modal) {
              modal.classList.remove("active");
          }
      });
  }

  // Handle difficulty selection
  difficultyOptions.forEach(option => {
      option.addEventListener("click", () => {
          difficultyOptions.forEach(opt => opt.classList.remove("selected"));
          
          option.classList.add("selected");
          
          // Check the radio button
          const radio = option.querySelector('input[type="radio"]');
          radio.checked = true;
      });
  });

  if (decreaseQuestionsBtn && increaseQuestionsBtn && questionCountInput) {
      decreaseQuestionsBtn.addEventListener("click", () => {
          const currentValue = parseInt(questionCountInput.value);
          if (currentValue > 5) {
              questionCountInput.value = currentValue - 1;
              
              // Enable increase button if it was disabled
              increaseQuestionsBtn.disabled = false;
              
              // Disable decrease button if we reached minimum
              if (parseInt(questionCountInput.value) <= 5) {
                  decreaseQuestionsBtn.disabled = true;
              }
          }
      });

      increaseQuestionsBtn.addEventListener("click", () => {
          const currentValue = parseInt(questionCountInput.value);
          if (currentValue < 20) {
              questionCountInput.value = currentValue + 1;
              
              // Enable decrease button if it was disabled
              decreaseQuestionsBtn.disabled = false;
              
              // Disable increase button if we reached maximum
              if (parseInt(questionCountInput.value) >= 20) {
                  increaseQuestionsBtn.disabled = true;
              }
          }
      });
  }

  if (generateQuizBtn) {
      generateQuizBtn.addEventListener("click", () => {
          // Validate inputs first
          const title = document.getElementById("quizTitle").value.trim();
          const topics = document.getElementById("quizTopics").value.trim();
          
          if (!title) {
              alert("Please enter a quiz title");
              return;
          }
          
          if (!topics) {
              alert("Please enter at least one topic");
              return;
          }

          if (modalBody) modalBody.style.display = "none";
          if (modalFooter) modalFooter.style.display = "none";
          
          // If you have a loading state element, you can repurpose it to show the upcoming message
          if (loadingState) {
              loadingState.innerHTML = `
                <div class="upcoming-feature-message">
                  <h3>Coming Soon!</h3>
                  <p>Thanks for your interest in creating a custom quiz on "${title}" about ${topics}.</p>
                  <p>We're working hard to bring this feature to you soon!</p>
                  <button id="closeUpcomingMessage" class="btn">Got it</button>
                </div>
              `;
              loadingState.style.display = "block";
              
              document.getElementById("closeUpcomingMessage").addEventListener("click", () => {
                  modal.classList.remove("active");
                  
                  setTimeout(() => {
                      if (modalBody) modalBody.style.display = "block";
                      if (modalFooter) modalFooter.style.display = "flex";
                      if (loadingState) loadingState.style.display = "none";
                  }, 300);
              });
          } else {
              alert("Custom quiz creation is coming soon! Thanks for your interest.");
              modal.classList.remove("active");
          }
      });
  }

  const easyOption = document.getElementById("difficultyEasy");
  if (easyOption && easyOption.checked) {
      const easyDifficultyOption = document.querySelector('.difficulty-option.easy');
      if (easyDifficultyOption) easyDifficultyOption.classList.add("selected");
  }
});