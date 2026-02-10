// ES Module - Firebase imports
import { database, ref, get } from '../scripts/firebase-config.js';

// Funktion för att kopiera texten
function copyTextToClipboard(textToCopy) {
    // Använd Clipboard API för att kopiera texten
    navigator.clipboard.writeText(textToCopy).then(function() {
        // Meddela användaren om att texten har kopierats
        var message = document.createElement("div");
        message.textContent = "Texten har kopierats till urklippet";
        message.style.position = "fixed";
        message.style.bottom = "10px";
        message.style.left = "50%";
        message.style.transform = "translateX(-50%)";
        message.style.color = "#fff";
        message.style.padding = "10px";
        message.style.borderRadius = "5px";
        message.style.zIndex = "1000";
        message.style.fontSize = "48px";
        message.style.transition = "opacity 1s";
        message.style.opacity = "1";
  
        document.body.appendChild(message);
  
        // Ta bort meddelandet efter 3 sekunder
        setTimeout(function () {
            message.style.opacity = "0";
            setTimeout(function () {
                document.body.removeChild(message);
            }, 1000); // Vänta på att övergången ska slutföras
        }, 3000);
    }).catch(function(err) {
        console.error('Kunde inte kopiera texten: ', err);
    });
}

// Function to load buttons dynamically and attach event listeners
function loadButtons() {
    const container = document.querySelector(".container");

    get(ref(database, "arbetsbeskr")).then(snapshot => {
        snapshot.forEach(childSnapshot => {
            const buttonId = childSnapshot.key;
            const textToCopy = childSnapshot.val();

            // Create a button dynamically
            const button = document.createElement("button");
            button.id = buttonId;
            button.className = "copyButton";
            button.innerHTML = buttonId.replace(/Button$/, ""); // Remove "Button" suffix for display

            // Attach event listener to the button
            button.addEventListener("click", function () {
                if (textToCopy) {
                    copyTextToClipboard(textToCopy);
                } else {
                    console.error(`Text not found for button: ${buttonId}`);
                }
            });

            // Append the button to the container
            container.appendChild(button);
        });
    }).catch(error => {
        console.error("Error loading buttons from database:", error);
    });
}

// Export for use from HTML
window.loadButtons = loadButtons;