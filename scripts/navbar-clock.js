/**
 * Navbar Clock and Date updater
 * Updates the clock and date in the navbar
 */

function updateNavbarClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const clockElement = document.getElementById('navbar-clock');
    if (clockElement) {
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

function updateNavbarDate() {
    const currentDate = new Date();
    const veckodagar = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
    const dagIVeckan = currentDate.getDay();
    const dag = currentDate.getDate();
    const månad = currentDate.getMonth() + 1;
    const år = currentDate.getFullYear();
    const formateratDatum = `${dag}/${månad}\n${år}`;

    const dateElement = document.getElementById('navbar-date');
    if (dateElement) {
        dateElement.innerText = `${veckodagar[dagIVeckan]}\n${formateratDatum}`;
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        updateNavbarClock();
        updateNavbarDate();
        // Update clock every second
        setInterval(updateNavbarClock, 1000);
        // Update date every hour
        setInterval(updateNavbarDate, 3600000);
    });
} else {
    // DOM is already ready
    updateNavbarClock();
    updateNavbarDate();
    setInterval(updateNavbarClock, 1000);
    setInterval(updateNavbarDate, 3600000);
}
