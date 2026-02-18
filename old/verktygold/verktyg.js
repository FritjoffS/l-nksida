/**
 * Verktyg länk-app
 * Använder gemensam link-app modul
 */
import { initLinkApp } from '../scripts/link-app.js';

initLinkApp({
  dbPath: 'verktyg',
  title: 'Verktyg',
  emptyIcon: '🔧'
});
