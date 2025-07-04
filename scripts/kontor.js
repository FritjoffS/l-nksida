// Function to load buttons dynamically and attach event listeners
function loadButtons() {
  const database = firebase.database();
  const container = document.querySelector(".container");

  database.ref("kontor").once("value").then(snapshot => {
    // Collect all children into an array
    const buttonsData = [];
    snapshot.forEach(childSnapshot => {
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
      img.onload = function() {
        // Image loaded successfully, do nothing
      };
      img.onerror = function() {
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
  }).catch(error => {
    console.error("Error loading buttons from database:", error);
  });
}

// Function to load guide shortcuts dynamically
function loadGuideShortcuts() {
  const database = firebase.database();
  const container = document.querySelector(".container");

  // Guide display names
  const guideDisplayNames = {
    'hamtKundorderGuide': 'Hämta Kundorder',
    'prisuppdateringGuide': 'Prisuppdatering',
    'skapaKundorderGuide': 'Skapa Kundorder'
  };

  console.log("Loading guide shortcuts...");
  
  database.ref("guider").once("value").then(snapshot => {
    console.log("Firebase guides response received:", snapshot.exists());
    if (snapshot.exists()) {
      console.log("Guides found in database");
      snapshot.forEach(childSnapshot => {
        const guideId = childSnapshot.key;
        const guideData = childSnapshot.val();
        
        console.log("Processing guide:", guideId, guideData);
        
        // Only create button if guide has steps
        if (guideData && guideData.steps) {
          console.log("Creating button for guide:", guideId);
          const button = document.createElement("button");
          button.className = "linkButton guide-button";
          button.innerHTML = guideDisplayNames[guideId] || guideId;
          button.title = `Öppna guide: ${guideDisplayNames[guideId] || guideId}`;
          button.onclick = () => navigateToUrl(`../guider/guide.html?guide=${guideId}`);
          container.appendChild(button);
        } else {
          console.log("Guide has no steps:", guideId);
        }
      });
    } else {
      console.log("No guides found in database");
    }
  }).catch(error => {
    console.error("Error loading guides:", error);
  });
}

// Call loadButtons on page load
window.onload = function () {
  loadButtons();
  loadGuideShortcuts();
};
