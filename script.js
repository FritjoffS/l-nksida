// You can add JavaScript code here if needed
// For example, handling user interactions or making dynamic changes to the page

function openNewWindow(url) {
    window.open(url, '_blank');
}

function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const clockElement = document.getElementById('clock');
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
}

// Update the clock every second
setInterval(updateClock, 1000);

// Initial call to set the clock when the page loads
updateClock();
