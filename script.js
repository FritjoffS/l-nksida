// You can add JavaScript code here if needed
// For example, handling user interactions or making dynamic changes to the page

function openNewWindow(url) {
    window.open(url, '_blank');
}

function navigateToUrl(url) {
    window.location.href = url;
}

// Get the current date
const currentDate = new Date();

// Array of weekdays
const weekdays = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];

// Get the day of the week (0-6)
const dayOfWeek = currentDate.getDay();

// Get the day, month, and year
const day = currentDate.getDate();
const month = currentDate.getMonth() + 1; // Months are zero-based
const year = currentDate.getFullYear();

// Format the date as "DD/MM - YYYY" in two lines
const formattedDate = `${day}/${month} \n ${year}`;

// Update the #date element with the formatted date and day of the week
document.getElementById("date").innerText = `${weekdays[dayOfWeek]} ${formattedDate}`;


