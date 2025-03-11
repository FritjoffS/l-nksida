// aviseringar.js

// Funktion för att kopiera texten
function copyTextToClipboard(textToCopy) {
    // Skapa en osynlig textarea för att kopiera texten
    var textarea = document.createElement("textarea");
    textarea.value = textToCopy;
    document.body.appendChild(textarea);

    // Markera och kopiera texten
    textarea.select();
    document.execCommand("copy");

    // Ta bort den temporära textarean
    document.body.removeChild(textarea);

    // Meddela användaren om att texten har kopierats
    /*alert("Texten har kopierats till urklippet:\n" + textToCopy);*/

    // Skapa ett meddelandeelement
    var message = document.createElement("div");
    /*message.textContent = "Texten har kopierats till urklippet:\n" + textToCopy;*/
    message.textContent = "Texten har kopierats till urklippet";
    /*message.style.position = "fixed";*/
    message.style.position = "fixed";
    message.style.bottom = "10px";
    message.style.left = "50%";
    message.style.transform = "translateX(-50%)";
    /*message.style.backgroundColor = "rgba(51, 51, 51, 0.5)";*/
    message.style.color = "#fff";
    message.style.padding = "10px";
    message.style.borderRadius = "5px";
    message.style.zIndex = "1000";
    message.style.fontSize = "48px"; // Ändra storleken på texten
    document.body.appendChild(message);

    // Ta bort meddelandet efter 3 sekunder
    setTimeout(function () {
        document.body.removeChild(message);
    }, 5000);
}

// Lägg till händelselyssnare för varje knapp
document.getElementById("cykelButton").addEventListener("click", function () {
    var textToCopy = `Bästa Kund.
    Er Cykel är nu klar i vår verkstad och finns för avhämtning.
    Välkommen
    Vardagar 08.00-18.00
    Lördagar 09.00-13.00
    Sollebrunns Järnhandel AB
    0322-40330`;
    copyTextToClipboard(textToCopy);
});

document.getElementById("motorgräsklippareButton").addEventListener("click", function () {
    var textToCopy = `Bästa Kund.
    Er Motorgräsklippare är nu klar i vår verkstad och finns för avhämtning.
    Välkommen
    Vardagar 08.00-18.00
    Lördagar 09.00-13.00
    Sollebrunns Järnhandel AB
    0322-40330`;
    copyTextToClipboard(textToCopy);
});

document.getElementById("åkgräsklippareButton").addEventListener("click", function () {
    var textToCopy = `Bästa Kund.
    Er Åkgräsklippare är nu klar i vår verkstad och finns för avhämtning.
    Välkommen
    Vardagar 08.00-18.00
    Lördagar 09.00-13.00
    Sollebrunns Järnhandel AB
    0322-40330`;
    copyTextToClipboard(textToCopy);
});

document.getElementById("robotgräsklippareButton").addEventListener("click", function () {
    var textToCopy = `Bästa Kund.
    Er Robotgräsklippare är nu klar i vår verkstad och finns för avhämtning.
    Välkommen
    Vardagar 08.00-18.00
    Lördagar 09.00-13.00
    Sollebrunns Järnhandel AB
    0322-40330`;
    copyTextToClipboard(textToCopy);
});

document.getElementById("trimmerButton").addEventListener("click", function () {
    var textToCopy = `Bästa Kund.
    Er Grästrimmer är nu klar i vår verkstad och finns för avhämtning.
    Välkommen
    Vardagar 08.00-18.00
    Lördagar 09.00-13.00
    Sollebrunns Järnhandel AB
    0322-40330`;
    copyTextToClipboard(textToCopy);
});

document.getElementById("röjsågButton").addEventListener("click", function () {
    var textToCopy = `Bästa Kund.
    Er Röjsåg är nu klar i vår verkstad och finns för avhämtning.
    Välkommen
    Vardagar 08.00-18.00
    Lördagar 09.00-13.00
    Sollebrunns Järnhandel AB
    0322-40330`;
    copyTextToClipboard(textToCopy);
});

document.getElementById("motorsågButton").addEventListener("click", function () {
    var textToCopy = `Bästa Kund.
    Er Motorsåg är nu klar i vår verkstad och finns för avhämtning.
    Välkommen
    Vardagar 08.00-18.00
    Lördagar 09.00-13.00
    Sollebrunns Järnhandel AB
    0322-40330`;
    copyTextToClipboard(textToCopy);
});

document.getElementById("sågkedjaButton").addEventListener("click", function () {
    var textToCopy = `Bästa Kund.
    Er Sågkedja är nu klar i vår verkstad och finns för avhämtning.
    Välkommen
    Vardagar 08.00-18.00
    Lördagar 09.00-13.00
    Sollebrunns Järnhandel AB
    0322-40330`;
    copyTextToClipboard(textToCopy);
});

document.getElementById("däckButton").addEventListener("click", function () {
    var textToCopy = `Bästa Kund.
    Erat Däck är nu klart i vår verkstad och finns för avhämtning.
    Välkommen
    Vardagar 08.00-18.00
    Lördagar 09.00-13.00
    Sollebrunns Järnhandel AB
    0322-40330`;
    copyTextToClipboard(textToCopy);
});

document.getElementById("skridskorButton").addEventListener("click", function () {
    var textToCopy = `Bästa Kund.
    Era Skridskor är nu klara i vår verkstad och finns för avhämtning.
    Välkommen
    Vardagar 08.00-18.00
    Lördagar 09.00-13.00
    Sollebrunns Järnhandel AB
    0322-40330`;
    copyTextToClipboard(textToCopy);
});

document.getElementById("högtryckstvättButton").addEventListener("click", function () {
    var textToCopy = `Bästa Kund.
    Er Högtryckstvätt är nu klar i vår verkstad och finns för avhämtning.
    Välkommen
    Vardagar 08.00-18.00
    Lördagar 09.00-13.00
    Sollebrunns Järnhandel AB
    0322-40330`;
    copyTextToClipboard(textToCopy);
});

document.getElementById("reservdelarButton").addEventListener("click", function () {
    var textToCopy = `Bästa kund.
    Dina reservdelar som du beställt har nu kommit till vårt lager och finns för avhämtning.
    Vardagar 8.00-18.00
    Lördagar 9.00-13.00
    Välkommen
    Sollebrunns Järnhandel AB
    0322-40330`;
    copyTextToClipboard(textToCopy);
});
