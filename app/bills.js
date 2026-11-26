// Bills view: November 2026 recurring bills calendar and checklist with persistent paid toggles.
import {
  addBill,
  computeSummary,
  escapeHtml,
  formatMoney,
  getCategoryById,
  getState,
  toggleBillPaid,
} from './store.js';

let showBillForm = false;

export function renderBills(container, ctx) {
  const state = getState();
  const s = computeSummary(state);
  const sortedBills = [...state.bills].sort((a, b) => a.dueDay - b.dueDay);
  const billsByDay = new Map();
  for (const b of sortedBills) {
    if (!billsByDay.has(b.dueDay)) billsByDay.set(b.dueDay, []);
    billsByDay.get(b.dueDay).push(b);
  }

  const paidCount = sortedBills.filter((b) => b.paid).length;
  const dueCount = sortedBills.length - paidCount;

  const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    .map((d) => `<div class="cal-dow">${d}</div>`)
    .join('');

  const cells = [];
  for (let i = 0; i < state.meta.firstWeekday; i += 1) {
    cells.push('<div class="cal-cell is-empty"></div>');
  }
  for (let day = 1; day <= state.meta.daysInMonth; day += 1) {
    const dayBills = billsByDay.get(day) || [];
    const hasUnpaid = dayBills.some((b) => !b.paid);
    const hasPaid = dayBills.length > 0 && !hasUnpaid;
    const isToday = day === state.meta.currentDay;
    const cls = [
      'cal-cell',
      isToday ? 'is-today' : '',
      hasUnpaid ? 'has-due' : hasPaid ? 'has-paid' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const tags = dayBills
      .map((b) => `<div class="cal-bill-tag" title="${escapeHtml(b.name)} (${escapeHtml(formatMoney(b.amount))})">${b.paid ? '&#10003; ' : ''}${escapeHtml(b.shortLabel || b.name.split(' ')[0])}</div>`)
      .join('');
    cells.push(`<div class="${cls}"><span class="cal-day">${day}${isToday ? ' &bull;' : ''}</span>${tags}</div>`);
  }

  const billRowsHtml = sortedBills
    .map((bill) => {
      const cat = getCategoryById(bill.category);
      const statusBadge = bill.paid
        ? '<span class="pill pill-good">Paid</span>'
        : bill.dueDay < state.meta.currentDay
          ? '<span class="pill pill-over">Overdue</span>'
          : `<span class="pill pill-warn">Due Nov ${bill.dueDay}</span>`;

      return `
        <div class="bill-mini-row">
          <span class="bill-date-chip">Nov ${bill.dueDay}</span>
          <div class="bill-info">
            <div class="bill-name">${escapeHtml(bill.name)}</div>
            <div class="bill-meta">${escapeHtml(cat.name)} &middot; ${bill.autopay ? 'Autopay' : 'Manual'} &middot; ${statusBadge}</div>
          </div>
          <div class="bill-right">
            <span class="bill-amt">${escapeHtml(formatMoney(bill.amount))}</span>
            <button type="button" class="btn ${bill.paid ? 'btn-ghost' : 'btn-primary'} btn-xs" data-toggle-bill="${escapeHtml(bill.id)}">
              ${bill.paid ? 'Paid &#10003;' : 'Mark Paid'}
            </button>
          </div>
        </div>`;
    })
    .join('');

  const catOptions = state.categories
    .filter((c) => c.bucket !== 'savings')
    .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`)
    .join('');

  container.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title">Recurring Bills</h1>
        <p class="page-subtitle">${escapeHtml(state.meta.familyName)} &middot; ${escapeHtml(state.meta.monthLabel)} due-date calendar and payment status</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-primary" id="toggle-bill-form-btn">${showBillForm ? 'Close Form' : '+ Add Bill'}</button>
      </div>
    </header>

    <section class="plan-banner" style="grid-template-columns:repeat(3,minmax(0,1fr))" aria-label="Recurring bills totals">
      <div>
        <div class="plan-stat-label">Paid This Month (${paidCount})</div>
        <div class="plan-stat-val" style="color:#226438">${escapeHtml(formatMoney(s.paidBillsTotal))}</div>
      </div>
      <div>
        <div class="plan-stat-label">Upcoming Due (${dueCount})</div>
        <div class="plan-stat-val" style="color:var(--amber)">${escapeHtml(formatMoney(s.unpaidBillsTotal))}</div>
      </div>
      <div>
        <div class="plan-stat-label">Monthly Fixed Bills</div>
        <div class="plan-stat-val">${escapeHtml(formatMoney(s.paidBillsTotal + s.unpaidBillsTotal))}</div>
      </div>
    </section>

    <section class="inline-panel" id="new-bill-panel"${showBillForm ? '' : ' hidden'}>
      <div class="card-head" style="margin-bottom:10px">
        <h2 class="card-title">Add Recurring Monthly Bill</h2>
      </div>
      <form id="new-bill-form" class="form-grid">
        <label class="field">
          <span>Bill Name</span>
          <input type="text" name="name" placeholder="e.g. Home Security Monitoring" required>
        </label>
        <label class="field">
          <span>Due Day (1&ndash;30)</span>
          <input type="number" name="dueDay" min="1" max="30" value="25" required>
        </label>
        <label class="field">
          <span>Amount ($)</span>
          <input type="number" name="amount" min="1" step="0.01" placeholder="45.00" required>
        </label>
        <label class="field">
          <span>Category</span>
          <select name="category">${catOptions}</select>
        </label>
        <label class="field field-full" style="flex-direction:row;align-items:center;gap:8px">
          <input type="checkbox" name="autopay">
          <span>Enrolled in automatic bank draft (Autopay)</span>
        </label>
        <div class="modal-foot field-full">
          <button type="submit" class="btn btn-primary">Add Recurring Bill</button>
        </div>
      </form>
    </section>

    <section class="bills-layout">
      <article class="card">
        <div class="card-head">
          <h2 class="card-title">November 2026 Calendar</h2>
          <span style="font-size:11.5px;color:var(--ink-soft)">Green: Paid &middot; Amber: Due &middot; &bull; Day 21</span>
        </div>
        <div class="cal-grid">
          ${dows}
          ${cells.join('')}
        </div>
      </article>

      <article class="card">
        <div class="card-head">
          <h2 class="card-title">Monthly Checklist</h2>
          <span class="pill pill-neutral">${paidCount}/${sortedBills.length} paid</span>
        </div>
        <div class="bill-mini-list">${billRowsHtml}</div>
      </article>
    </section>
  `;

  container.querySelector('#toggle-bill-form-btn').addEventListener('click', () => {
    showBillForm = !showBillForm;
    renderBills(container, ctx);
  });

  container.querySelector('#new-bill-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const created = addBill({
      name: fd.get('name'),
      dueDay: Number(fd.get('dueDay')),
      amount: Number(fd.get('amount')),
      category: fd.get('category'),
      autopay: fd.get('autopay') === 'on',
    });
    if (created) {
      showBillForm = false;
      ctx.toast(`Added recurring bill "${created.name}"`);
      renderBills(container, ctx);
    }
  });

  container.querySelectorAll('[data-toggle-bill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const updated = toggleBillPaid(btn.dataset.toggleBill);
      if (updated) {
        ctx.toast(updated.paid ? `Marked "${updated.name}" paid` : `Marked "${updated.name}" unpaid`);
      }
      renderBills(container, ctx);
    });
  });
}
