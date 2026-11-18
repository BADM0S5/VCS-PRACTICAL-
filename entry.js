/**
 * Module: Expense Entry
 * Handles expense input form, category selection, strict validation,
 * and the recent transactions list with delete capability.
 * Developed on branch: feature/expense-entry
 */

(function () {
  'use strict';

  // Allowed expense categories
  const VALID_CATEGORIES = [
    'Food',
    'Transport',
    'Academics',
    'Utilities',
    'Entertainment',
    'Miscellaneous'
  ];

  /**
   * Sets default date input to today in YYYY-MM-DD
   */
  function setDefaultDate() {
    const dateInput = document.getElementById('expense-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Displays an inline validation or status alert
   * @param {string} message
   * @param {'error'|'success'} type
   */
  function showAlert(message, type = 'error') {
    const alertBox = document.getElementById('entry-alert');
    if (!alertBox) return;

    alertBox.textContent = message;
    alertBox.style.display = 'block';

    if (type === 'error') {
      alertBox.style.backgroundColor = '#fef2f2';
      alertBox.style.color = '#b91c1c';
      alertBox.style.border = '1px solid #fecaca';
    } else {
      alertBox.style.backgroundColor = '#ecfdf5';
      alertBox.style.color = '#047857';
      alertBox.style.border = '1px solid #a7f3d0';
    }
  }

  /**
   * Clears inline alert
   */
  function clearAlert() {
    const alertBox = document.getElementById('entry-alert');
    if (alertBox) {
      alertBox.style.display = 'none';
      alertBox.textContent = '';
    }
  }

  /**
   * Validates form input fields
   * @param {string} title
   * @param {number} amount
   * @param {string} category
   * @param {string} date
   * @returns {string|null} Error message or null if valid
   */
  function validateInputs(title, amount, category, date) {
    if (!title || title.trim().length === 0) {
      return 'Please provide an expense title or description.';
    }
    if (title.trim().length < 3) {
      return 'Expense title must be at least 3 characters long.';
    }
    if (isNaN(amount) || amount <= 0) {
      return 'Amount must be a positive number greater than ₹0.00.';
    }
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return 'Please select a valid expense category from the dropdown.';
    }
    if (!date) {
      return 'Please specify a transaction date.';
    }
    return null;
  }

  /**
   * Formats a raw number into currency representation
   * @param {number} val
   * @returns {string}
   */
  function formatCurrency(val) {
    return '₹' + Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Renders the 5 most recent transactions in the table
   */
  function renderRecentTransactions() {
    const tbody = document.getElementById('recent-transactions-body');
    const badge = document.getElementById('recent-count-badge');
    if (!tbody) return;

    const allExpenses = window.ExpenseStorage ? window.ExpenseStorage.getExpenses() : [];
    
    // Sort transactions by date descending, then by creation
    const sorted = [...allExpenses].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
    });

    const recentFive = sorted.slice(0, 5);

    if (badge) {
      badge.textContent = `${recentFive.length} shown of ${allExpenses.length}`;
    }

    if (recentFive.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No transactions found. Add your first expense above!
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = recentFive.map(item => `
      <tr data-id="${item.id}">
        <td style="font-weight: 500; white-space: nowrap;">${item.date}</td>
        <td>
          <strong>${escapeHtml(item.title)}</strong>
        </td>
        <td>
          <span style="display: inline-block; padding: 0.2rem 0.55rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: #f1f5f9; color: var(--text-main); border: 1px solid var(--border-color);">
            ${escapeHtml(item.category)}
          </span>
        </td>
        <td style="font-weight: 700; color: #0f172a;">
          ${formatCurrency(item.amount)}
        </td>
        <td style="text-align: right;">
          <button class="btn btn-danger btn-delete-expense" data-id="${item.id}" data-title="${escapeHtml(item.title)}" style="padding: 0.3rem 0.7rem; font-size: 0.8rem; border-radius: var(--radius-sm);">
            <span>🗑️</span> Delete
          </button>
        </td>
      </tr>
    `).join('');

    // Attach delete listeners
    tbody.querySelectorAll('.btn-delete-expense').forEach(btn => {
      btn.addEventListener('click', handleDeleteClick);
    });
  }

  /**
   * Escape HTML to prevent injection
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Handles deletion of an individual expense
   */
  function handleDeleteClick(e) {
    const btn = e.currentTarget;
    const id = btn.getAttribute('data-id');
    const title = btn.getAttribute('data-title') || 'this transaction';

    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      if (window.ExpenseStorage && window.ExpenseStorage.deleteExpense) {
        const deleted = window.ExpenseStorage.deleteExpense(id);
        if (deleted) {
          showAlert(`Transaction "${title}" was deleted.`, 'success');
          setTimeout(clearAlert, 3000);
        }
      }
    }
  }

  /**
   * Handles Form Submission
   * @param {Event} e
   */
  function handleFormSubmit(e) {
    e.preventDefault();
    clearAlert();

    const titleInput = document.getElementById('expense-title');
    const amountInput = document.getElementById('expense-amount');
    const categorySelect = document.getElementById('expense-category');
    const dateInput = document.getElementById('expense-date');

    const title = titleInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const date = dateInput.value;

    const validationError = validateInputs(title, amount, category, date);
    if (validationError) {
      showAlert(validationError, 'error');
      return;
    }

    // Save to storage
    const newRecord = {
      title,
      amount,
      category,
      date
    };

    if (window.ExpenseStorage && window.ExpenseStorage.saveExpense) {
      window.ExpenseStorage.saveExpense(newRecord);
      showAlert(`Expense "${title}" (${formatCurrency(amount)}) recorded successfully!`, 'success');
      
      // Reset form fields
      titleInput.value = '';
      amountInput.value = '';
      categorySelect.value = '';
      setDefaultDate();

      setTimeout(clearAlert, 4000);
    } else {
      showAlert('Storage engine is unavailable. Unable to save transaction.', 'error');
    }
  }

  // Setup form & table event listeners
  function initExpenseEntry() {
    const form = document.getElementById('expense-form');
    if (!form) return;

    setDefaultDate();
    form.addEventListener('submit', handleFormSubmit);

    // Clear alert when user starts correcting inputs
    ['expense-title', 'expense-amount', 'expense-category', 'expense-date'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', clearAlert);
      }
    });

    // Render initial recent transactions
    renderRecentTransactions();

    // Listen for storage updates across tabs/modules to keep table in sync
    window.addEventListener('expensesUpdated', () => {
      renderRecentTransactions();
    });

    console.log('[Module: Entry] Initialized with form validation and recent transactions list.');
  }

  document.addEventListener('DOMContentLoaded', initExpenseEntry);
})();
