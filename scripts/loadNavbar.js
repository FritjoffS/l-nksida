document.addEventListener("DOMContentLoaded", function () {
  const navbarContainer = document.getElementById("navbar");

  // Load the navbar HTML
  fetch("../navbar/navbar.html")
    .then(response => response.text())
    .then(html => {
      navbarContainer.innerHTML = html;

      console.log("Navbar loaded successfully."); // Debug log

      // Dynamically check if admin.html exists and add a link
      const currentPath = window.location.pathname;
      const adminPath = currentPath.substring(0, currentPath.lastIndexOf('/')) + '/admin.html';

      console.log('Current path:', currentPath);
      console.log('Admin path being checked:', adminPath);

      fetch(adminPath, { method: 'HEAD' })
        .then(response => {
          console.log('Fetch response status:', response.status);
          if (response.ok) {
            console.log('Admin page found. Adding link to navbar.');
            const adminLink = document.createElement('li');
            adminLink.innerHTML = `
              <a href="${adminPath}">
                <img src="../icons/admin.png" alt="Admin Icon" style="width:16px;height:16px;filter: invert(1);">
                <br>Admin
              </a>
            `;
            const placeholder = document.getElementById('admin-link-placeholder');
            if (placeholder) {
              placeholder.replaceWith(adminLink);
            } else {
              console.error('Admin link placeholder not found in the navbar.');
            }
          } else {
            console.log('Admin page not found. Response status:', response.status);
          }
        })
        .catch(error => {
          console.error('Error checking for admin.html:', error);
        });
    })
    .catch(error => {
      console.error("Error loading navbar:", error);
    });
});
