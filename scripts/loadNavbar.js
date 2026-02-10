/**
 * Dynamisk navbar-laddare med dropdown-stöd
 * Använder konfiguration från nav-config.js
 */

document.addEventListener("DOMContentLoaded", function () {
  const navbarContainer = document.getElementById("navbar");

  // Ladda först konfigurationen
  const configScript = document.createElement('script');
  configScript.src = '../scripts/nav-config.js';
  configScript.onload = function() {
    // Ladda sedan navbar HTML
    fetch("../navbar/navbar.html")
      .then(response => response.text())
      .then(html => {
        navbarContainer.innerHTML = html;
        buildNavbar();
        setupDropdownListeners();
        console.log("Navbar loaded successfully.");
      })
      .catch(error => {
        console.error("Error loading navbar:", error);
      });
  };
  document.head.appendChild(configScript);
});

/**
 * Bygger navbar-menyn baserat på konfigurationen
 */
function buildNavbar() {
  const menu = document.getElementById('navbar-menu');
  if (!menu || typeof NAV_CONFIG === 'undefined') {
    console.error('Kunde inte bygga navbar - element eller konfiguration saknas');
    return;
  }

  // Lägg till huvudlänkar
  NAV_CONFIG.mainLinks.forEach(link => {
    menu.appendChild(createNavLink(link));
  });

  // Lägg till dropdown-kategorier
  NAV_CONFIG.categories.forEach(category => {
    menu.appendChild(createDropdown(category));
  });

  // Lägg till logout-knapp
  const logoutLi = document.createElement('li');
  logoutLi.setAttribute('role', 'none');
  logoutLi.innerHTML = `
    <button class="logout-button" onclick="logout()" role="menuitem" 
      aria-label="Logga ut från applikationen">Logga ut</button>
  `;
  menu.appendChild(logoutLi);
}

/**
 * Skapar en enkel navigeringslänk
 */
function createNavLink(link) {
  const li = document.createElement('li');
  li.setAttribute('role', 'none');
  li.innerHTML = `
    <a href="${link.href}" role="menuitem" aria-label="Gå till ${link.label}">
      <img src="${link.icon}" alt="" style="width:16px;height:16px;filter: invert(1);" aria-hidden="true">
      <br>${link.label}
    </a>
  `;
  return li;
}

/**
 * Skapar en dropdown-meny med underlänkar
 */
function createDropdown(category) {
  const li = document.createElement('li');
  li.setAttribute('role', 'none');
  li.className = 'nav-dropdown';
  
  const linksHtml = category.links.map(link => `
    <a href="${link.href}" role="menuitem" aria-label="Gå till ${link.label}">
      <img src="${link.icon}" alt="" aria-hidden="true">
      ${link.label}
    </a>
  `).join('');

  li.innerHTML = `
    <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">
      <img src="${category.icon}" alt="" style="width:16px;height:16px;filter: invert(1);" aria-hidden="true">
      <br>${category.label}
      <span class="dropdown-arrow">▼</span>
    </button>
    <div class="dropdown-content" role="menu">
      ${linksHtml}
    </div>
  `;
  
  return li;
}

/**
 * Lägger till klick-hantering för dropdowns (mobil/touch)
 */
function setupDropdownListeners() {
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Stäng andra dropdowns
      dropdowns.forEach(d => {
        if (d !== dropdown) {
          d.classList.remove('active');
          const btn = d.querySelector('.dropdown-toggle');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Toggle denna dropdown
      dropdown.classList.toggle('active');
      const isExpanded = dropdown.classList.contains('active');
      toggle.setAttribute('aria-expanded', isExpanded.toString());
    });
  });

  // Stäng dropdowns vid klick utanför
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-dropdown')) {
      dropdowns.forEach(d => {
        d.classList.remove('active');
        const btn = d.querySelector('.dropdown-toggle');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

