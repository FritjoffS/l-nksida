

function openNewWindow(url) {
    window.open(url, '_blank');
}

function navigateToUrl(url) {
    window.location.href = url;
}

// Hämta aktuellt datum
const currentDate = new Date();

// Veckodagar som en array
const veckodagar = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];

// Hämta veckodagen (0-6)
const dagIVeckan = currentDate.getDay();

// Hämta dag, månad och år
const dag = currentDate.getDate();
const månad = currentDate.getMonth() + 1; // Månader är nollbaserade
const år = currentDate.getFullYear();

// Formatera datumet som "DD/MM - YYYY" i två rader
const formateratDatum = `${dag}/${månad} \n ${år}`;

// Uppdatera elementet med id "date" med det formaterade datumet och veckodagen
const dateElement = document.getElementById("date");
if (dateElement) {
    dateElement.innerText = `${veckodagar[dagIVeckan]} ${formateratDatum}`;
}

// Uppdatera datumet en gång i timmen (3600000 ms = 1 timme)
setInterval(() => {
    const updatedDate = new Date();
    const updatedDay = updatedDate.getDate();
    const updatedMonth = updatedDate.getMonth() + 1;
    const updatedYear = updatedDate.getFullYear();
    const updatedFormattedDate = `${updatedDay}/${updatedMonth} \n ${updatedYear}`;
    const dateElement = document.getElementById("date");
    if (dateElement) {
        dateElement.innerText = `${veckodagar[updatedDate.getDay()]} ${updatedFormattedDate}`;
    }
}, 3600000); // 3600000 millisekunder = 1 timme



