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

// Function to fetch text from Firebase and copy it to the clipboard
function fetchAndCopyText(buttonId) {
    var database = firebase.database();
    database.ref('arbetsbeskr/' + buttonId).once('value').then(function(snapshot) {
        var textToCopy = snapshot.val();
        if (textToCopy) {
            copyTextToClipboard(textToCopy);
        } else {
            console.error('Text not found for button:', buttonId);
        }
    }).catch(function(error) {
        console.error('Error fetching text from database:', error);
    });
}

// Update event listeners to use fetchAndCopyText
document.getElementById("autoclipButton").addEventListener("click", function () {
    fetchAndCopyText("autoclipButton");
});
document.getElementById("automowerButton").addEventListener("click", function () {
    fetchAndCopyText("automowerButton");
});
document.getElementById("imowButton").addEventListener("click", function () {
    fetchAndCopyText("imowButton");
});
document.getElementById("motorgräsklippareButton").addEventListener("click", function () {
    fetchAndCopyText("motorgräsklippareButton");
});
document.getElementById("åkgräsklippareButton").addEventListener("click", function () {
    fetchAndCopyText("åkgräsklippareButton");
});
document.getElementById("åkgräsklippareHstButton").addEventListener("click", function () {
    fetchAndCopyText("åkgräsklippareHstButton");
});
document.getElementById("trimmerButton").addEventListener("click", function () {
    fetchAndCopyText("trimmerButton");
});
document.getElementById("häcksaxButton").addEventListener("click", function () {
    fetchAndCopyText("häcksaxButton");
});
document.getElementById("röjsågButton").addEventListener("click", function () {
    fetchAndCopyText("röjsågButton");
});
document.getElementById("motorsågButton").addEventListener("click", function () {
    fetchAndCopyText("motorsågButton");
});
document.getElementById("lövblåsButton").addEventListener("click", function () {
    fetchAndCopyText("lövblåsButton");
});
document.getElementById("cykelButton").addEventListener("click", function () {
    fetchAndCopyText("cykelButton");
});
document.getElementById("snöslungaButton").addEventListener("click", function () {
    fetchAndCopyText("snöslungaButton");
});
document.getElementById("motorsågElBatteriButton").addEventListener("click", function () {
    fetchAndCopyText("motorsågElBatteriButton");
});
document.getElementById("cykelPunkteringButton").addEventListener("click", function () {
    fetchAndCopyText("cykelPunkteringButton");
});
document.getElementById("cykelDäckbyteButton").addEventListener("click", function () {
    fetchAndCopyText("cykelDäckbyteButton");
});
document.getElementById("felMotorsågButton").addEventListener("click", function () {
    fetchAndCopyText("felMotorsågButton");
});