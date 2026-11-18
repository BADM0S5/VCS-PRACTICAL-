/**
 * Module: Expense Entry
 * Handles expense input form, category selection, and strict validation.
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
      showAlert(`Expense "${title}" (₹${amount.toFixed(2)}) recorded successfully!`, 'success');
      
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

  // Setup form event listeners
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

    console.log('[Module: Entry] Expense input form initialized with validation.');
  }

  document.addEventListener('DOMContentLoaded', initExpenseEntry);
})();
