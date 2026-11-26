// Entry module: hash router, lazy view loader, quick-add modal, and live sidebar cash summary.
import {
  addTransaction,
  computeSummary,
  escapeHtml,
  formatWhole,
  getState,
  resetState,
  subscribe,
} from './store.js';
import { renderDashboard } from './dashboard.js';

const viewRoot = document.getElementById('view-root');
const navLinks = Array.from(document.querySelectorAll('#main-nav .nav-link'));
const sidebarSummary = document.getElementById('sidebar-summary');
const modal = document.getElementById('quick-modal');
const quickForm = document.getElementById('quick-tx-form');
const quickType = document.getElementById('q-type');
const quickCategory = document.getElementById('q-category');
const toastEl = document.getElementById('toast');

let toastTimer = null;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.hidden = true;
  }, 2600);
}

function syncSidebarSummary() {
  const s = computeSummary();
  sidebarSummary.innerHTML = `
    <div class="sidebar-summary-row"><span>Income</span><strong>${escapeHtml(formatWhole(s.totalIncome))}</strong></div>
    <div class="sidebar-summary-row"><span>Spent</span><strong>${escapeHtml(formatWhole(s.livingSpending))}</strong></div>
    <div class="sidebar-summary-row"><span>Remaining</span><strong>${escapeHtml(formatWhole(s.remainingCash))}</strong></div>
    <div class="sidebar-summary-row"><span>Unpaid bills</span><strong>${escapeHtml(formatWhole(s.unpaidBillsTotal))}</strong></div>
  `;
}

function populateQuickCategories() {
  const cats = getState().categories;
  quickCategory.innerHTML = cats
    .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`)
    .join('');
}

function openQuickAdd() {
  populateQuickCategories();
  quickForm.reset();
  document.getElementById('q-date').value = '2026-11-21';
  quickCategory.disabled = false;
  modal.hidden = false;
  document.getElementById('q-description').focus();
}

function closeQuickAdd() {
  modal.hidden = true;
}

const appCtx = {
  toast: showToast,
  openQuickAdd,
};

function getCurrentRoute() {
  const raw = (location.hash || '#/dashboard').replace(/^#\/?/, '').split('?')[0].toLowerCase();
  const valid = new Set(['dashboard', 'transactions', 'budgets', 'goals', 'bills', 'reports']);
  return valid.has(raw) ? raw : 'dashboard';
}

function highlightNav(route) {
  for (const link of navLinks) {
    const active = link.dataset.route === route;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}

async function renderRoute() {
  const route = getCurrentRoute();
  highlightNav(route);
  syncSidebarSummary();

  if (route === 'dashboard') {
    renderDashboard(viewRoot, appCtx);
    return;
  }
  if (route === 'transactions') {
    const mod = await import('./transactions.js');
    mod.renderTransactions(viewRoot, appCtx);
    return;
  }
  if (route === 'budgets') {
    const mod = await import('./budgets.js');
    mod.renderBudgets(viewRoot, appCtx);
    return;
  }
  if (route === 'goals') {
    const mod = await import('./goals.js');
    mod.renderGoals(viewRoot, appCtx);
    return;
  }
  if (route === 'bills') {
    const mod = await import('./bills.js');
    mod.renderBills(viewRoot, appCtx);
    return;
  }
  if (route === 'reports') {
    const mod = await import('./reports.js');
    mod.renderReports(viewRoot, appCtx);
  }
}

document.getElementById('sidebar-add-btn').addEventListener('click', openQuickAdd);
document.getElementById('mobile-add-btn').addEventListener('click', openQuickAdd);
document.getElementById('close-modal-btn').addEventListener('click', closeQuickAdd);
document.getElementById('cancel-modal-btn').addEventListener('click', closeQuickAdd);

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeQuickAdd();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) closeQuickAdd();
});

quickType.addEventListener('change', () => {
  quickCategory.disabled = quickType.value === 'income';
});

quickForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(quickForm);
  addTransaction({
    type: fd.get('type'),
    date: fd.get('date'),
    description: fd.get('description'),
    category: fd.get('type') === 'income' ? 'income' : fd.get('category'),
    amount: Number(fd.get('amount')),
    member: fd.get('member'),
    note: fd.get('note'),
  });
  closeQuickAdd();
  showToast('Saved transaction to ledger');
  renderRoute();
});

document.getElementById('reset-demo-btn').addEventListener('click', () => {
  resetState();
  showToast('Restored November 2026 sample data');
  renderRoute();
});

subscribe(syncSidebarSummary);
window.addEventListener('hashchange', () => {
  renderRoute();
  window.scrollTo({ top: 0 });
});

renderRoute();
