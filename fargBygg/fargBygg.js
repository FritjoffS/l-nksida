/**
 * Färg & Bygg länk-app
 * Använder gemensam link-app modul
 */
import { initLinkApp } from '../scripts/link-app.js';

initLinkApp({
  dbPath: 'fargBygg',        // Firebase database path (måste vara unikt)
  title: 'Färg & Bygg',         // Visningsnamn
  emptyIcon: '🎨'          // Emoji för empty state
});