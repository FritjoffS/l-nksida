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
      button.innerHTML = buttonId.replace(/Button$/, ""); // Remove "Button" suffix for display

      // Set background image for the button (unique per button)
      button.style.backgroundImage = "url('../images/" + buttonId + ".png')";
      button.style.backgroundPosition = "center";
      button.style.color = "#fff"; // Optional: ensure text is visible

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
