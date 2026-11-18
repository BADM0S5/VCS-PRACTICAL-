/**
 * Module: Analytics Charts
 * Interactive Chart.js visualizations for category distribution and expenditure comparison.
 * Developed on branch: feature/charts
 */

(function () {
  'use strict';

  // Chart instances
  let doughnutChartInstance = null;
  let barChartInstance = null;

  // Category Color Palette
  const CATEGORY_COLORS = {
    Food: { bg: 'rgba(249, 115, 22, 0.85)', border: '#f97316' },           // Vibrant Orange
    Transport: { bg: 'rgba(6, 182, 212, 0.85)', border: '#06b6d4' },       // Cyan
    Academics: { bg: 'rgba(139, 92, 246, 0.85)', border: '#8b5cf6' },      // Violet
    Utilities: { bg: 'rgba(234, 179, 8, 0.85)', border: '#eab308' },       // Amber
    Entertainment: { bg: 'rgba(236, 72, 153, 0.85)', border: '#ec4899' },  // Pink
    Miscellaneous: { bg: 'rgba(100, 116, 139, 0.85)', border: '#64748b' }  // Slate
  };

  const DEFAULT_COLOR = { bg: 'rgba(99, 102, 241, 0.85)', border: '#6366f1' };

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
   * Destroys existing chart instances safely
   */
  function destroyCharts() {
    if (doughnutChartInstance) {
      doughnutChartInstance.destroy();
      doughnutChartInstance = null;
    }
    if (barChartInstance) {
      barChartInstance.destroy();
      barChartInstance = null;
    }
  }

  /**
   * Calculates category aggregate totals from expense records
   * @param {Array<Object>} expenses
   * @returns {Object} { categoryTotals, totalAmount, activeCategoriesCount, topCategory }
   */
  function aggregateCategoryData(expenses) {
    const categoryTotals = {};
    let totalAmount = 0;

    expenses.forEach(item => {
      const cat = item.category || 'Miscellaneous';
      const amt = Number(item.amount) || 0;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
      totalAmount += amt;
    });

    let topCategory = '-';
    let maxSpent = -1;
    let activeCategoriesCount = 0;

    for (const [cat, sum] of Object.entries(categoryTotals)) {
      if (sum > 0) activeCategoriesCount++;
      if (sum > maxSpent) {
        maxSpent = sum;
        topCategory = `${cat} (${formatINR(sum)})`;
      }
    }

    return {
      categoryTotals,
      totalAmount,
      activeCategoriesCount,
      topCategory
    };
  }

  /**
   * Updates summary cards above charts
   */
  function updateSummaryCards(totalAmount, topCategory, activeCategoriesCount) {
    const totalEl = document.getElementById('charts-stat-total');
    const topCatEl = document.getElementById('charts-stat-top-category');
    const countEl = document.getElementById('charts-stat-categories-count');

    if (totalEl) totalEl.textContent = formatINR(totalAmount);
    if (topCatEl) topCatEl.textContent = topCategory;
    if (countEl) countEl.textContent = activeCategoriesCount.toString();
  }

  /**
   * Renders the Category Doughnut Chart
   */
  function renderDoughnutChart(labels, data, totalAmount) {
    const ctx = document.getElementById('category-doughnut-chart');
    if (!ctx) return;

    const bgColors = labels.map(cat => (CATEGORY_COLORS[cat] || DEFAULT_COLOR).bg);
    const borderColors = labels.map(cat => (CATEGORY_COLORS[cat] || DEFAULT_COLOR).border);

    doughnutChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 12,
              font: {
                family: 'Inter, sans-serif',
                size: 11
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw || 0;
                const percentage = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : '0.0';
                return ` ${context.label}: ${formatINR(value)} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '62%'
      }
    });
  }

  /**
   * Renders the Category Expenditure Bar Chart
   */
  function renderBarChart(labels, data) {
    const ctx = document.getElementById('spending-bar-chart');
    if (!ctx) return;

    const bgColors = labels.map(cat => (CATEGORY_COLORS[cat] || DEFAULT_COLOR).bg);
    const borderColors = labels.map(cat => (CATEGORY_COLORS[cat] || DEFAULT_COLOR).border);

    barChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Spent (₹)',
          data: data,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return ` Expenditure: ${formatINR(context.raw)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: 'Inter, sans-serif',
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (val) {
                return '₹' + val;
              },
              font: {
                family: 'Inter, sans-serif',
                size: 10
              }
            },
            grid: {
              color: '#f1f5f9'
            }
          }
        }
      }
    });
  }

  /**
   * Main render coordinator for Analytics tab
   */
  function renderCharts() {
    const emptyStateEl = document.getElementById('charts-empty-state');
    const contentEl = document.getElementById('charts-content');

    const expenses = window.ExpenseStorage ? window.ExpenseStorage.getExpenses() : [];

    // Fallback state if no expenses recorded
    if (!expenses || expenses.length === 0) {
      destroyCharts();
      if (emptyStateEl) emptyStateEl.style.display = 'block';
      if (contentEl) contentEl.style.display = 'none';
      return;
    }

    if (emptyStateEl) emptyStateEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    const { categoryTotals, totalAmount, activeCategoriesCount, topCategory } = aggregateCategoryData(expenses);

    // Update KPI indicators
    updateSummaryCards(totalAmount, topCategory, activeCategoriesCount);

    // Sort categories alphabetically or by predefined list for deterministic display
    const labels = Object.keys(categoryTotals).sort();
    const data = labels.map(lbl => categoryTotals[lbl]);

    // Cleanly re-render charts
    destroyCharts();
    renderDoughnutChart(labels, data, totalAmount);
    renderBarChart(labels, data);
  }

  // Setup event listeners
  function initChartsModule() {
    console.log('[Module: Charts] Initializing dynamic Chart.js module...');

    // Initial render
    renderCharts();

    // Real-time synchronization whenever expense data changes
    window.addEventListener('expensesUpdated', () => {
      renderCharts();
      console.log('[Module: Charts] Real-time charts updated on expensesUpdated event.');
    });

    // Re-render when switching to Analytics tab to adjust canvas scaling
    const chartsTabBtn = document.querySelector('[data-tab="tab-charts"]');
    if (chartsTabBtn) {
      chartsTabBtn.addEventListener('click', () => {
        setTimeout(renderCharts, 50);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initChartsModule);
})();
