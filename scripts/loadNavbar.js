document.addEventListener("DOMContentLoaded", () => {
  fetch("../navbar/navbar.html")
    .then(response => response.text())
    .then(data => {
      document.getElementById("navbar").innerHTML = data;
      const navbar = document.getElementById("navbar");
      navbar.innerHTML += `
        <button onclick="logout()">Logout</button>
      `;
    })
    .catch(error => console.error("Error loading navbar:", error));
});
