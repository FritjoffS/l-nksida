
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
