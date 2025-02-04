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
  document.getElementById("copyButton1").addEventListener("click", function () {
    var textToCopy1 =
      "Bästa Kund.\nEr Cykel är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy1);
  });
  
  document.getElementById("copyButton2").addEventListener("click", function () {
    var textToCopy2 =
      "Bästa Kund.\nEr Motorgräsklippare är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy2);
  });
  
  document.getElementById("copyButton3").addEventListener("click", function () {
    var textToCopy3 =
      "Bästa Kund.\nEr Åkgräsklippare är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy3);
  });
  
  document.getElementById("copyButton4").addEventListener("click", function () {
    var textToCopy4 =
      "Bästa Kund.\nEr Robotgräsklippare är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy4);
  });
  
  document.getElementById("copyButton5").addEventListener("click", function () {
    var textToCopy5 =
      "Bästa Kund.\nEr Grästrimmer är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy5);
  });
  
  document.getElementById("copyButton6").addEventListener("click", function () {
    var textToCopy6 =
      "Bästa Kund.\nEr Röjsåg är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy6);
  });
  
  document.getElementById("copyButton7").addEventListener("click", function () {
    var textToCopy7 =
      "Bästa Kund.\nEr Motorsåg är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy7);
  });
  
  document.getElementById("copyButton8").addEventListener("click", function () {
    var textToCopy8 =
      "Bästa Kund.\nEr Sågkedja är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy8);
  });
  
  document.getElementById("copyButton9").addEventListener("click", function () {
    var textToCopy9 =
      "Bästa Kund.\nErat Däck är nu klart i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy9);
  });
  
  document.getElementById("copyButton10").addEventListener("click", function () {
    var textToCopy10 =
      "Bästa Kund.\nEra Skridskor är nu klara i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy10);
  });
  
  document.getElementById("copyButton11").addEventListener("click", function () {
    var textToCopy11 =
      "Bästa Kund.\nEr Högtryckstvätt är nu klar i vår verkstad och finns för avhämtning. \nVälkommen \nVardagar 08.00-18.00 \nLördagar 09.00-13.00 \nSollebrunns Järnhandel AB \n0322-40330";
    copyTextToClipboard(textToCopy11);
  });

  document.getElementById("copyButton12").addEventListener("click", function () {
    var textToCopy12 =
      "Bästa kund.\nDina reservdelar som du beställt har nu kommit till vårt lager och finns för avhämtning. \nVardagar 8.00-18.00 Lördagar 9.00-13.00 \nVälkommen \nSollenrunns Järhnhandel \n0322-40330";
    copyTextToClipboard(textToCopy12);
  });
  