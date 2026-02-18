/**
 * Hushåll länk-app
 * Använder gemensam link-app modul
 */
import { initLinkApp } from '../scripts/link-app.js';

initLinkApp({
  dbPath: 'hushall',        // Firebase database path (måste vara unikt)
  title: 'Hushåll',         // Visningsnamn
  emptyIcon: '🏠'          // Emoji för empty state
});