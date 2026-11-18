/**
 * Module: Monthly Reports
 * Aggregates monthly statements, KPI metrics, category breakdown table,
 * and exports filtered monthly reports to CSV.
 * Developed on branch: feature/monthly-reports
 */

(function () {
  'use strict';

  let currentSelectedMonth = null;

  /**
   * Formats numbers to Indian Rupee (INR) representation
   * @param {number} val
   * @returns {string}
   */
  function formatINR(val) {
    return '₹' + Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Converts YYYY-MM to human-readable month string (e.g., "November 2026")
   * @param {string} ymStr
   * @returns {string}
   */
  function formatMonthName(ymStr) {
    if (!ymStr) return '';
    const [year, month] = ymStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  /**
   * Calculates total days in a given YYYY-MM
   * @param {string} ymStr
   * @returns {number}
   */
  function getDaysInMonth(ymStr) {
    const [year, month] = ymStr.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }

  /**
   * Populates the month selector dropdown with all available months in dataset
   * @param {Array<Object>} expenses
   */
  function populateMonthDropdown(expenses) {
    const select = document.getElementById('report-month-select');
    if (!select) return;

    const monthSet = new Set();
    const currentCalendarMonth = new Date().toISOString().slice(0, 7);
    monthSet.add(currentCalendarMonth);

    expenses.forEach(item => {
      if (item.date && item.date.length >= 7) {
        monthSet.add(item.date.slice(0, 7));
      }
    });

    const sortedMonths = Array.from(monthSet).sort().reverse();

    // Preserve selection or default to current / first available
    const previousSelection = currentSelectedMonth || select.value;
    select.innerHTML = sortedMonths.map(ym => `
      <option value="${ym}">${formatMonthName(ym)}</option>
    `).join('');

    if (previousSelection && sortedMonths.includes(previousSelection)) {
      select.value = previousSelection;
      currentSelectedMonth = previousSelection;
    } else {
      select.value = sortedMonths[0];
      currentSelectedMonth = sortedMonths[0];
    }
  }

  /**
   * Renders KPI summary cards for the given filtered expenses
   */
  function renderKPICards(monthlyExpenses, selectedMonth) {
    const totalEl = document.getElementById('report-kpi-total');
    const topCatEl = document.getElementById('report-kpi-top-category');
    const avgDailyEl = document.getElementById('report-kpi-avg-daily');
    const countEl = document.getElementById('report-kpi-count');

    const total = monthlyExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const count = monthlyExpenses.length;

    // Highest spending category
    const catTotals = {};
    monthlyExpenses.forEach(item => {
      const cat = item.category || 'Miscellaneous';
      catTotals[cat] = (catTotals[cat] || 0) + (Number(item.amount) || 0);
    });

    let topCategory = '-';
    let maxAmount = -1;
    for (const [cat, sum] of Object.entries(catTotals)) {
      if (sum > maxAmount) {
        maxAmount = sum;
        topCategory = `${cat} (${formatINR(sum)})`;
      }
    }

    // Average daily spend over days in month
    const daysInMonth = getDaysInMonth(selectedMonth);
    const avgDaily = total / (daysInMonth || 30);

    if (totalEl) totalEl.textContent = formatINR(total);
    if (topCatEl) topCatEl.textContent = topCategory;
    if (avgDailyEl) avgDailyEl.textContent = formatINR(avgDaily);
    if (countEl) countEl.textContent = `${count} transactions`;
  }

  /**
   * Renders the category breakdown table
   */
  function renderCategoryTable(monthlyExpenses) {
    const tbody = document.getElementById('report-category-tbody');
    if (!tbody) return;

    const total = monthlyExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const categoryStats = {};

    monthlyExpenses.forEach(item => {
      const cat = item.category || 'Miscellaneous';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, amount: 0 };
      }
      categoryStats[cat].count += 1;
      categoryStats[cat].amount += Number(item.amount) || 0;
    });

    const sortedCategories = Object.keys(categoryStats).sort((a, b) => categoryStats[b].amount - categoryStats[a].amount);

    tbody.innerHTML = sortedCategories.map(cat => {
      const { count, amount } = categoryStats[cat];
      const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : '0.0';
      return `
        <tr>
          <td><strong>${escapeHtml(cat)}</strong></td>
          <td>${count}</td>
          <td style="font-weight: 600; color: #0f172a;">${formatINR(amount)}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span>${pct}%</span>
              <div style="flex: 1; max-width: 100px; height: 6px; background: #e2e8f0; border-radius: 9999px; overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background: var(--primary); border-radius: 9999px;"></div>
              </div>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  /**
   * Renders itemized transactions for the selected month
   */
  function renderItemizedTable(monthlyExpenses) {
    const tbody = document.getElementById('report-itemized-tbody');
    if (!tbody) return;

    // Sort descending by date
    const sorted = [...monthlyExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = sorted.map(item => `
      <tr>
        <td style="white-space: nowrap;">${item.date}</td>
        <td><strong>${escapeHtml(item.title)}</strong></td>
        <td>
          <span style="font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.55rem; background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 9999px;">
            ${escapeHtml(item.category)}
          </span>
        </td>
        <td style="text-align: right; font-weight: 700;">${formatINR(item.amount)}</td>
      </tr>
    `).join('');
  }

  /**
   * Escape HTML utility
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
   * Exports filtered monthly expenses as a downloadable CSV file
   */
  function exportMonthlyCSV() {
    const expenses = window.ExpenseStorage ? window.ExpenseStorage.getExpenses() : [];
    const select = document.getElementById('report-month-select');
    const selectedMonth = select ? select.value : currentSelectedMonth;

    const filtered = expenses.filter(item => item.date && item.date.startsWith(selectedMonth));

    if (filtered.length === 0) {
      alert(`No expenses found for ${formatMonthName(selectedMonth)} to export.`);
      return;
    }

    // CSV Header & rows
    const csvRows = [
      ['ID', 'Date', 'Title', 'Category', 'Amount (INR)']
    ];

    filtered.forEach(item => {
      csvRows.push([
        item.id || '',
        item.date || '',
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        (Number(item.amount) || 0).toFixed(2)
      ]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', `Expense_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`[Module: Reports] Exported ${filtered.length} records for ${selectedMonth} to CSV.`);
  }

  /**
   * Main render coordinator for Monthly Reports
   */
  function renderMonthlyReports() {
    const expenses = window.ExpenseStorage ? window.ExpenseStorage.getExpenses() : [];
    populateMonthDropdown(expenses);

    const select = document.getElementById('report-month-select');
    const selectedMonth = select ? select.value : currentSelectedMonth;
    currentSelectedMonth = selectedMonth;

    const emptyStateEl = document.getElementById('reports-empty-state');
    const contentEl = document.getElementById('reports-content');

    const monthlyExpenses = expenses.filter(item => item.date && item.date.startsWith(selectedMonth));

    if (monthlyExpenses.length === 0) {
      if (emptyStateEl) emptyStateEl.style.display = 'block';
      if (contentEl) contentEl.style.display = 'none';
      return;
    }

    if (emptyStateEl) emptyStateEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    renderKPICards(monthlyExpenses, selectedMonth);
    renderCategoryTable(monthlyExpenses);
    renderItemizedTable(monthlyExpenses);
  }

  // Setup module event listeners
  function initReportsModule() {
    console.log('[Module: Reports] Initializing Monthly Reports controller...');

    renderMonthlyReports();

    // Dropdown change listener
    const select = document.getElementById('report-month-select');
    if (select) {
      select.addEventListener('change', () => {
        currentSelectedMonth = select.value;
        renderMonthlyReports();
      });
    }

    // Export CSV button listener
    const exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportMonthlyCSV);
    }

    // Real-time synchronization whenever expense data changes
    window.addEventListener('expensesUpdated', () => {
      renderMonthlyReports();
      console.log('[Module: Reports] Reports recalculated on expensesUpdated event.');
    });

    // Re-render when switching to Reports tab
    const reportsTabBtn = document.querySelector('[data-tab="tab-reports"]');
    if (reportsTabBtn) {
      reportsTabBtn.addEventListener('click', () => {
        renderMonthlyReports();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initReportsModule);
})();
