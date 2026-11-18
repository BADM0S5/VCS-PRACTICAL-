/**
 * Storage Layer for Personal Expense Tracker
 * Key: vcs_expenses
 * Manages localStorage persistence and sample seed data.
 */

const STORAGE_KEY = 'vcs_expenses';

/**
 * Retrieves all expenses from localStorage
 * @returns {Array<Object>} List of expense objects
 */
function getExpenses() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : [];
  } catch (error) {
    console.error('Error reading expenses from localStorage:', error);
    return [];
  }
}

/**
 * Saves a new expense or updates an existing one
 * @param {Object} expense - { id?, title, amount, category, date }
 * @returns {Object} Saved expense object
 */
function saveExpense(expense) {
  const expenses = getExpenses();
  const newExpense = {
    id: expense.id || 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    title: expense.title.trim(),
    amount: parseFloat(expense.amount),
    category: expense.category,
    date: expense.date || new Date().toISOString().split('T')[0],
    createdAt: expense.createdAt || new Date().toISOString()
  };

  const existingIndex = expenses.findIndex(item => item.id === newExpense.id);
  if (existingIndex !== -1) {
    expenses[existingIndex] = newExpense;
  } else {
    expenses.unshift(newExpense);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));

  if (window.notifyExpensesUpdated) {
    window.notifyExpensesUpdated();
  }

  return newExpense;
}

/**
 * Deletes an expense by ID
 * @param {string} id - Expense ID
 * @returns {boolean} True if deleted, false otherwise
 */
function deleteExpense(id) {
  const expenses = getExpenses();
  const filtered = expenses.filter(item => item.id !== id);

  if (filtered.length !== expenses.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (window.notifyExpensesUpdated) {
      window.notifyExpensesUpdated();
    }
    return true;
  }
  return false;
}

/**
 * Helper to generate an ISO date string (YYYY-MM-DD) shifted by N days
 * @param {number} daysAgo
 * @returns {string}
 */
function getOffsetDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

/**
 * Pre-loads 8-10 realistic expenses across categories like Food, Transport,
 * Academics, Utilities, and Entertainment spanning the last 2 months if storage is empty.
 */
function seedSampleData() {
  const existing = getExpenses();
  if (existing && existing.length > 0) {
    return; // Already populated
  }

  const sampleExpenses = [
    {
      id: 'seed_01',
      title: 'Course Textbook: Algorithms & Data Structures',
      amount: 85.50,
      category: 'Academics',
      date: getOffsetDate(4),
      createdAt: new Date().toISOString()
    },
    {
      id: 'seed_02',
      title: 'Weekly Grocery Haul',
      amount: 64.20,
      category: 'Food',
      date: getOffsetDate(8),
      createdAt: new Date().toISOString()
    },
    {
      id: 'seed_03',
      title: 'Monthly Metro Transit Pass',
      amount: 45.00,
      category: 'Transport',
      date: getOffsetDate(14),
      createdAt: new Date().toISOString()
    },
    {
      id: 'seed_04',
      title: 'Campus High-Speed Internet Bill',
      amount: 39.99,
      category: 'Utilities',
      date: getOffsetDate(20),
      createdAt: new Date().toISOString()
    },
    {
      id: 'seed_05',
      title: 'Weekend Movie & Popcorn',
      amount: 22.00,
      category: 'Entertainment',
      date: getOffsetDate(25),
      createdAt: new Date().toISOString()
    },
    {
      id: 'seed_06',
      title: 'Lab Notebook & Stationery Supplies',
      amount: 18.75,
      category: 'Academics',
      date: getOffsetDate(32),
      createdAt: new Date().toISOString()
    },
    {
      id: 'seed_07',
      title: 'Electric & Heating Utility Share',
      amount: 52.40,
      category: 'Utilities',
      date: getOffsetDate(38),
      createdAt: new Date().toISOString()
    },
    {
      id: 'seed_08',
      title: 'Dinner at Italian Bistro with Study Group',
      amount: 36.80,
      category: 'Food',
      date: getOffsetDate(45),
      createdAt: new Date().toISOString()
    },
    {
      id: 'seed_09',
      title: 'Concert Ticket',
      amount: 55.00,
      category: 'Entertainment',
      date: getOffsetDate(52),
      createdAt: new Date().toISOString()
    },
    {
      id: 'seed_10',
      title: 'Rideshare to Airport for Break',
      amount: 29.50,
      category: 'Transport',
      date: getOffsetDate(58),
      createdAt: new Date().toISOString()
    }
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleExpenses));
  console.log(`[Storage] Seeded ${sampleExpenses.length} sample expenses into localStorage (${STORAGE_KEY}).`);
}

// Attach functions to global scope for module access
window.ExpenseStorage = {
  getExpenses,
  saveExpense,
  deleteExpense,
  seedSampleData
};
