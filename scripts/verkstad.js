// Function to load buttons dynamically and attach event listeners
function loadButtons() {
  const database = firebase.database();
  const container = document.querySelector(".container");

  database.ref("verkstad").once("value").then(snapshot => {
    snapshot.forEach(childSnapshot => {
      const buttonId = childSnapshot.key;
      const linkToFollow = childSnapshot.val();

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
        button.style.backgroundImage = "";
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

// Call loadButtons on page load
window.onload = function () {
  loadButtons();
};
