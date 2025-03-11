
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
document
    .getElementById("autoclipButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Autoclip ===

      # Allmän kontroll av mekaniska delar och skruvarnas åtdragning
      # Kontroll av felstatistik
      # Kontroll och ev uppdatering av programvara
      # Kontroll av batteri
      # Kontroll av framhjulets lager
      # Kontroll av skärblad och verifiering av eventuella skador
      # Allmän kontroll och grundläggande rengöring
      # Kontroll av slitage på fram och bakhjul, eventuellt byte.
      # Kontroll av regnsensorn
      # Verifiera motorreducerventilens buller, smörjning och byt eventuellt ut den.
      # Verifiera skärbladsmotorns buller (med avmonterad kniv)
      # Byte av kniv`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("automowerButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Automower ===

      # Allmänt maskintest
      # Grundläggande Rengöring
      # Framhjulens lager-kontroll/smörjning
      # Knivenhet-kontroll/rengöring
      # Laddbleck-Kontroll/rengöring
      # Uderrede/drivhjul-Kotroll/rengöring
      # Klipphöjdsinställning - Kontroll/rengöring
      # Kåpa/Strömbrytare - Kontroll/Rengöring
      # Kåpa/Tätningslister - kontroll
      # Kåpa/Kondensfilter - kontroll
      # Batteri uppladdning
      # Mjukvara Diagnos/uppdatering
      # Funktionstest
      # Byte av kniv`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("imowButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service I Mow ===

      # Allmänt maskintest
      # Grundläggande Rengöring
      # Framhjulens lager-kontroll/smörjning
      # Knivenhet-kontroll/rengöring
      # Laddbleck-Kontroll/rengöring
      # Uderrede/drivhjul-Kotroll/rengöring
      # Klipphöjdsinställning - Kontroll/rengöring
      # Kåpa/Strömbrytare - Kontroll/Rengöring
      # Batteri uppladdning
      # Mjukvara Diagnos/uppdatering
      # Funktionstest
      # Byte av kniv`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("motorgräsklippareButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Motorgräsklippare ===

      # Byte Tändstift
      # Byte Luftfilter
      # Byte Motorolja
      # Rengöring Kylsystem
      # Kontroll kompression
      # Kontroll / Justering Varvtal
      # Kontroll Elsystem
      # Kontroll Drivsystem
      # Kontroll Skärsystem
      # Kontroll Startsystem
      # Slipning av kniv
      # Säkerhetskontroll

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("åkgräsklippareButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Åkgräsklippare ===

      # Rengöring
      # Kontroll/Justering av däckstryck
      # Kontroll/Justering av reglage och pedaler
      # Kontroll/Justering av styrinrättning
      # Kontroll av transmission
      # Kontroll av kraftuttag
      # Kontroll/Justering av remmar och remstyrningar
      # Smörjning
      # Kontroll /Justering av klippaggregat
      # Kontroll/Slipning av knivar
      # Byte av tändstift
      # Byte av motorolja
      # Kontroll/Byte av luftfilter
      # Byte av ev bränslefilter
      # Kontroll av batteri och elsystem
      # Kontroll/Rengöring av motorns kylsystem
      # Kontroll av avgassystem
      # Kontroll/Justering av varvtal
      # Säkerhetskontroll

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("åkgräsklippareHstButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Åkgräsklippare HST ===

      # Grundläggande rengöring
      # Kontroll/Justering av däckstryck
      # Kontroll/Justering av reglage och pedaler
      # Kontroll/Justering av styrinrättning
      # Kontroll av transmission
      # Kontroll av kraftuttag
      # Kontroll/Justering av remmar och remstyrningar
      # Smörjning
      # Kontroll /Justering av klippaggregat
      # Kontroll/Slipning av knivar
      # Byte av tändstift
      # Byte av motorolja
      # Kontroll/Byte av luftfilter
      # Byte av bränslefilter
      # Kontroll av olja i hydrostat
      # Kontroll av batteri och elsystem
      # Kontroll/Rengöring av motorns kylsystem
      # Kontroll av avgassystem
      # Kontroll/Justering av varvtal
      # Säkerhetskontroll

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("trimmerButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Trimmer ===

      # Tändstift Byte
      # Bränslefilter Byte
      # Luftfilter Kontroll/Rengöring
      # Drivlina Kontroll
      # Skärutrustning Kontroll
      # Varvtal Kontroll/Justering
      # Kompression Kontroll
      # Kylsystem Rengöring
      # Startsystem Kontroll
      # Säkerhetskontroll
      # Funktionskontroll

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("häcksaxButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Häcksax ===

      # Tändstift Byte
      # Bränslefilter Byte
      # Luftfilter Kontroll/Rengöring
      # Drivlina Kontroll
      # Skärutrustning Kontroll
      # Varvtal Kontroll/Justering
      # Kompression Kontroll
      # Kylsystem Rengöring
      # Startsystem Kontroll
      # Säkerhetskontroll
      # Funktionskontroll

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("röjsågButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Röjsåg ===

      # Tändstift Byte
      # Bränslefilter Byte
      # Luftfilter Kontroll/Rengöring
      # Vinkelväxel Kontroll/Smörjning
      # Skärutrustning Kontroll
      # Varvtal Kontroll/Justering
      # Kompression Kontroll
      # Kylsystem Rengöring
      # Startsystem Kontroll
      # Säkerhetskontroll
      # Funktionskontroll

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("motorsågButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Motorsåg ===

      # Grundläggande rengöring
      # Tändstift Byte
      # Bränslefilter Byte
      # Luftfilter Kontroll/Rengöring
      # Drivhjul Kontroll
      # Skärutrustning Kontroll
      # Varvtal Kontroll/Justering
      # Kompression Kontroll
      # Kylsystem Rengöring
      # Startsystem Kontroll
      # Säkerhetskontroll
      # Funktionskontroll

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("lövblåsButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Lövblås ===

      # Tändstift Byte
      # Bränslefilter Byte
      # Luftfilter Kontroll/Rengöring
      # Blåsenhet kontroll
      # Varvtal Kontroll/Justering
      # Kompression Kontroll
      # Kylsystem Rengöring
      # Startsystem Kontroll
      # Säkerhetskontroll
      # Funktionskontroll

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("cykelButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Cykel ===

      # Översyn
      # Kedja Kontroll / Smörjning
      # Däcktryck kontroll / Justering
      # Broms Kontroll / Justering
      # Växel Kontroll / Justering
      # Belysning och Reflexer Kontroll
      # Däck Kontroll
      # Smörjning

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("snöslungaButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Snöslunga ===

      # Byte Tändstift
      # Byte Motorolja
      # Rengöring Kylsystem
      # Kontroll kompression
      # Kontroll / Justering Varvtal
      # Kontroll Elsystem
      # Kontroll Drivsystem
      # Kontroll Inmatning/Utkast
      # Kontroll Startsystem
      # Smörjning
      # Säkerhetskontroll
      # Provkörning
      # Rengöring

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("motorsågElBatteriButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Service Motorsåg El/Batteri ===

      # Grundläggande rengöring
      # Luftfilter Kontroll/Rengöring
      # Drivhjul Kontroll
      # Skärutrustning Kontroll
      # Elsystem Kontroll
      # Kylsystem Rengöring
      # Säkerhetskontroll
      # Funktionskontroll

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("cykelPunkteringButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Punktering ===

      # Byte slang
      # Däcktryck - kontroll / justering

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("cykelDäckbyteButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Däckbyte ===

      # Byte däck - fram
      # Byte däck - bak
      # Däcktryck - kontroll / justering

      ***** Provkörning *****`;
        copyTextToClipboard(textToCopy);
    });
document
    .getElementById("felMotorsågButton")
    .addEventListener("click", function () {
        var textToCopy = `=== Felsökning ===

      # Kompression kontroll - 
      # Tändning kontroll - 
      # Förgasare kontroll - 
      # Cylinder kontroll - 
      # Kolv kontroll - 
      --------------------------------`;
        copyTextToClipboard(textToCopy);
    });