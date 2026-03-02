/**
 * Dynamisk navbar-laddare med dropdown-stöd
 * Försöker först ladda från Firebase, annars från nav-config.js
 */

// Global navbar config
let NAV_CONFIG = null;

document.addEventListener("DOMContentLoaded", async function () {
  const navbarContainer = document.getElementById("navbar");

  // Ladda navbar HTML först
  try {
    const response = await fetch("../navbar/navbar.html");
    const html = await response.text();
    navbarContainer.innerHTML = html;
    
    // Ladda navbar clock script
    const clockScript = document.createElement('script');
    clockScript.src = '../scripts/navbar-clock.js';
    document.head.appendChild(clockScript);
  } catch (error) {
    console.error("Error loading navbar HTML:", error);
    return;
  }

  // Försök ladda config från Firebase
  let configLoaded = await tryLoadFirebaseConfig();
  
  // Om Firebase misslyckades, använd lokal config
  if (!configLoaded) {
    await loadLocalConfig();
  }
  
  // Bygg navbaren
  if (NAV_CONFIG) {
    buildNavbar();
    setupDropdownListeners();
    console.log("Navbar loaded successfully.");
  }
});

/**
 * Försök ladda navbar-config från Firebase
 */
async function tryLoadFirebaseConfig() {
  try {
    // Dynamisk import av Firebase
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js");
    const { getDatabase, ref, get } = await import("https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js");
    const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js");
    
    // Ladda firebase config - använd absolut sökväg relativt till scripts/
    const configModule = await import("../scripts/firebase-config.js");
    const app = initializeApp(configModule.firebaseConfig);
    const db = getDatabase(app);
    const auth = getAuth(app);
    
    // Vänta på auth state
    const user = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
      // Timeout efter 2 sekunder
      setTimeout(() => resolve(null), 2000);
    });
    
    if (!user) {
      console.log("No user logged in, using local nav config");
      return false;
    }
    
    // Hämta config från Firebase
    const configRef = ref(db, 'navbar-config');
    const snapshot = await get(configRef);
    
    if (snapshot.exists()) {
      NAV_CONFIG = snapshot.val();
      console.log("Navbar config loaded from Firebase");
      return true;
    } else {
      console.log("No Firebase navbar config found, using local");
      return false;
    }
  } catch (error) {
    console.log("Could not load Firebase navbar config:", error.message);
    return false;
  }
}

/**
 * Ladda lokal config från nav-config.js
 */
function loadLocalConfig() {
  return new Promise((resolve) => {
    const configScript = document.createElement('script');
    configScript.src = '../scripts/nav-config.js';
    configScript.onload = function() {
      if (typeof window.NAV_CONFIG !== 'undefined') {
        NAV_CONFIG = window.NAV_CONFIG;
      }
      resolve();
    };
    configScript.onerror = function() {
      console.error("Could not load local nav-config.js");
      resolve();
    };
    document.head.appendChild(configScript);
  });
}

/**
 * Bygger navbar-menyn baserat på konfigurationen
 */
function buildNavbar() {
  const menu = document.getElementById('navbar-menu');
  if (!menu || !NAV_CONFIG) {
    console.error('Kunde inte bygga navbar - element eller konfiguration saknas');
    return;
  }

  // Säkerställ att arrays finns
  const mainLinks = NAV_CONFIG.mainLinks || [];
  const categories = NAV_CONFIG.categories || [];

  // Lägg till huvudlänkar
  mainLinks.forEach(link => {
    menu.appendChild(createNavLink(link));
  });

  // Lägg till dropdown-kategorier
  categories.forEach(category => {
    menu.appendChild(createDropdown(category));
  });

  // Lägg till logout-knapp och version container
  const rightContainer = document.createElement('div');
  rightContainer.className = 'navbar-right-container';
  rightContainer.innerHTML = `
    <button class="logout-button" onclick="logout()" role="menuitem" 
      aria-label="Logga ut från applikationen">Logga ut</button>
    <div id="appVersion" class="app-version" role="contentinfo" aria-label="Applikationsversion">Laddar...</div>
  `;
  
  // Lägg till containern i nav-elementet (inte i ul)
  const navElement = menu.closest('nav');
  if (navElement) {
    navElement.appendChild(rightContainer);
  }
  
  // Ladda och visa version
  loadAppVersion();
}

/**
 * Laddar och visar appversionen från manifest.json
 */
async function loadAppVersion() {
  try {
    const response = await fetch('../manifest.json');
    const manifest = await response.json();
    const versionElement = document.getElementById('appVersion');
    if (versionElement && manifest.version) {
      versionElement.textContent = `v${manifest.version}`;
    }
  } catch (error) {
    console.error('Error loading app version:', error);
    const versionElement = document.getElementById('appVersion');
    if (versionElement) {
      versionElement.textContent = '';
    }
  }
}

/**
 * Skapar en enkel navigeringslänk
 */
function createNavLink(link) {
  const li = document.createElement('li');
  li.setAttribute('role', 'none');
  
  const iconHtml = link.icon 
    ? `<img src="${link.icon}" alt="" style="width:16px;height:16px;filter: invert(1);" aria-hidden="true">`
    : '';
  
  li.innerHTML = `
    <a href="${link.href}" role="menuitem" aria-label="Gå till ${link.label}">
      ${iconHtml}
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
  
  const links = category.links || [];
  const linksHtml = links.map(link => `
    <a href="${link.href}" role="menuitem" aria-label="Gå till ${link.label}">
      ${link.icon ? `<img src="${link.icon}" alt="" aria-hidden="true">` : ''}
      ${link.label}
    </a>
  `).join('');

  const iconHtml = category.icon 
    ? `<img src="${category.icon}" alt="" style="width:16px;height:16px;filter: invert(1);" aria-hidden="true">`
    : '';

  li.innerHTML = `
    <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false">
      ${iconHtml}
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

