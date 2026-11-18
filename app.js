/**
 * App Controller (Base Orchestrator)
 * Initializes sample data, dispatches 'expensesUpdated' events,
 * and handles top-level tab navigation.
 */

// Global event notifier for when expense records are added, updated, or removed
window.notifyExpensesUpdated = function() {
  const event = new CustomEvent('expensesUpdated', {
    detail: {
      expenses: window.ExpenseStorage.getExpenses()
    }
  });
  window.dispatchEvent(event);
};

// Update header summary stat
function updateHeaderStats() {
  const headerTotalEl = document.getElementById('header-total');
  if (!headerTotalEl) return;

  const expenses = window.ExpenseStorage.getExpenses();
  const total = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  headerTotalEl.textContent = `$${total.toFixed(2)}`;
}

// Navigation Tabs Setup
function setupNavigation() {
  const tabButtons = document.querySelectorAll('.nav-tabs .tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      // Update button active state
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Show matching panel
      tabPanels.forEach(panel => {
        if (panel.id === targetId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });
}

// Initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] Initializing Expense Tracker foundational skeleton...');

  // 1. Seed initial sample data if empty
  if (window.ExpenseStorage && window.ExpenseStorage.seedSampleData) {
    window.ExpenseStorage.seedSampleData();
  }

  // 2. Setup navigation
  setupNavigation();

  // 3. Initial stats calculation
  updateHeaderStats();

  // 4. Listen for expenses updates across branches/modules
  window.addEventListener('expensesUpdated', () => {
    updateHeaderStats();
    console.log('[App] expensesUpdated event caught.');
  });

  // 5. Fire initial expensesUpdated event so any active module can read initial state
  window.notifyExpensesUpdated();
});
