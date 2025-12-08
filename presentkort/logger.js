import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

/**
 * Centralized logging function for all gift card operations
 * @param {Object} db - Firebase database instance
 * @param {string} action - Action type: 'create', 'redeem', 'edit', 'delete', 'import'
 * @param {string} cardNumber - Gift card serial number
 * @param {Object} details - Additional details about the action
 * @param {Object} changes - Before/after values for edit actions (optional)
 */
export async function logAction(db, action, cardNumber, details = {}, changes = null) {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            cardNumber: cardNumber,
            userEmail: user?.email || 'unknown',
            userName: details.userName || user?.email?.split('@')[0] || 'System',
            details: details,
            userAgent: navigator.userAgent
        };
        
        // Add changes object for edit actions
        if (changes) {
            logEntry.changes = changes;
        }
        
        // Save to logs node
        const logsRef = ref(db, 'logs');
        await push(logsRef, logEntry);
        
        console.log(`Log saved: ${action} - ${cardNumber}`);
    } catch (error) {
        console.error('Error saving log:', error);
        // Don't throw error - logging should not break the main functionality
    }
}
