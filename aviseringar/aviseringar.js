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
    alert("Texten har kopierats till urklippet:\n" + textToCopy);
  }
  
  // Lägg till händelselyssnare för varje knapp
  document.getElementById("cykelButton").addEventListener("click", function () {
    var textToCopy =
      "Bästa Kund.\nEr Cykel är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy);
  });
  
  document.getElementById("motorgräsklippareButton").addEventListener("click", function () {
    var textToCopy =
      "Bästa Kund.\nEr Motorgräsklippare är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy);
  });
  
  document.getElementById("åkgräsklippareButton").addEventListener("click", function () {
    var textToCopy =
      "Bästa Kund.\nEr Åkgräsklippare är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy);
  });
  
  document.getElementById("robotgräsklippareButton").addEventListener("click", function () {
    var textToCopy =
      "Bästa Kund.\nEr Robotgräsklippare är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy);
  });
  
  document.getElementById("trimmerButton").addEventListener("click", function () {
    var textToCopy =
      "Bästa Kund.\nEr Grästrimmer är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy);
  });
  
  document.getElementById("röjsågButton").addEventListener("click", function () {
    var textToCopy =
      "Bästa Kund.\nEr Röjsåg är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy);
  });
  
  document.getElementById("motorsågButton").addEventListener("click", function () {
    var textToCopy =
      "Bästa Kund.\nEr Motorsåg är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy);
  });
  
  document.getElementById("sågkedjaButton").addEventListener("click", function () {
    var textToCopy =
      "Bästa Kund.\nEr Sågkedja är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy);
  });
  
  document.getElementById("däckButton").addEventListener("click", function () {
    var textToCopy =
      "Bästa Kund.\nErat Däck är nu klart i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy);
  });
  
  document.getElementById("skridskorButton").addEventListener("click", function () {
    var textToCopy =
      "Bästa Kund.\nEra Skridskor är nu klara i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy);
  });
  
  document.getElementById("högtryckstvättButton").addEventListener("click", function () {
    var textToCopy =
      "Bästa Kund.\nEr Högtryckstvätt är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy);
  });

  document.getElementById("reservdelarButton").addEventListener("click", function () {
    var textToCopy =
      "Bästa kund.\nDina reservdelar som du beställt har nu kommit till vårt lager och finns för avhämtning. \nVardagar 8.00-18.00 Lördagar 9.00-13.00 \nVälkommen \nSollenrunns Järhnhandel \n0322-40330";
    copyTextToClipboard(textToCopy);
  });
  