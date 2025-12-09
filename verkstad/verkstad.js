import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js";
import { firebaseConfig } from "../scripts/firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Function to check if a user is logged in or not
function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      // User is not signed in, redirect to the login page
      window.location.href = "../index/login.html";
    }
    console.log("User is logged in:", user);
  });
}

// Function to log out the user
function logout() {
  signOut(auth).then(() => {
    // Sign-out successful, redirect to login page
    window.location.href = "../index/login.html";
  }).catch((error) => {
    // Handle errors here
    console.error("Logout error:", error);
  });
}

// Attach logout to the global window object for navbar
window.logout = logout;

// Function to load buttons dynamically and attach event listeners
async function loadButtons() {
  const container = document.querySelector(".container");

  try {
    const verkstadRef = ref(db, "verkstad");
    const snapshot = await get(verkstadRef);
    
    if (snapshot.exists()) {
      // Collect all children into an array
      const buttonsData = [];
      snapshot.forEach((childSnapshot) => {
        buttonsData.push({
          buttonId: childSnapshot.key,
          linkToFollow: childSnapshot.val()
        });
      });

      // Sort alphabetically by buttonId
      buttonsData.sort((a, b) => a.buttonId.localeCompare(b.buttonId));

      // Create buttons in sorted order
      buttonsData.forEach(({ buttonId, linkToFollow }) => {
        // Create a button dynamically
        const button = document.createElement("button");
        button.id = buttonId;
        button.className = "linkButton";

        // Set background image for the button (unique per button)
        const imgUrl = "../images/" + buttonId + ".png";
        button.style.backgroundImage = "url('" + imgUrl + "')";
        button.style.backgroundPosition = "center";
        button.style.color = "#fff"; // Optional: ensure text is visible

        // Try to load the image, if it fails, display the key as text
        const img = new Image();
        img.onload = function () {
          // Image loaded successfully, do nothing
        };
        img.onerror = function () {
          button.style.backgroundImage = "none";
          button.textContent = buttonId.replace(/Button$/, "");
          button.style.color = "#000"; // Make text visible if no background
        };
        img.src = imgUrl;

        // Attach event listener to the button
        button.addEventListener("click", function () {
          if (linkToFollow) {
            window.open(linkToFollow, "_blank");
          } else {
            console.error(`URL not found for button: ${buttonId}`);
          }
        });

        // Append the button to the container
        container.appendChild(button);
      });
    } else {
      console.log("No data available");
    }
  } catch (error) {
    console.error("Error loading buttons from database:", error);
  }
}

// Call functions on page load
checkAuthState();
loadButtons();
