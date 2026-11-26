// Transactions view: full family ledger with search, category/type filters, sorting, add/edit/delete, and CSV export.
import {
  addTransaction,
  deleteTransaction,
  escapeHtml,
  formatMoney,
  getCategoryById,
  getState,
  updateTransaction,
} from './store.js';

const filterState = {
  query: '',
  category: 'all',
  type: 'all',
  sort: 'date-desc',
  editingId: null,
  showForm: false,
};

function formatDateCell(iso) {
  const parts = String(iso || '').split('-');
  return parts.length === 3 ? `Nov ${Number(parts[2])}, ${parts[0]}` : iso;
}

function downloadCsv(rows) {
  const header = ['Date', 'Type', 'Description', 'Category', 'Member', 'Amount', 'Note'];
  const lines = [
    header.join(','),
    ...rows.map((tx) => {
      const cat = getCategoryById(tx.category).name;
      const vals = [tx.date, tx.type, tx.description, cat, tx.member, tx.amount.toFixed(2), tx.note || ''];
      return vals.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',');
    }),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'hartono-family-nov-2026.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function renderTransactions(container, ctx) {
  const state = getState();
  const q = filterState.query.trim().toLowerCase();

  const filtered = state.transactions
    .filter((tx) => {
      if (filterState.type !== 'all' && tx.type !== filterState.type) return false;
      if (filterState.category !== 'all' && tx.category !== filterState.category) return false;
      if (q) {
        const catName = getCategoryById(tx.category).name.toLowerCase();
        const hay = `${tx.description} ${tx.note || ''} ${tx.member} ${catName} ${tx.date}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filterState.sort === 'date-asc') return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
      if (filterState.sort === 'amt-desc') return b.amount - a.amount;
      if (filterState.sort === 'amt-asc') return a.amount - b.amount;
      return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    });

  let filteredIncome = 0;
  let filteredExpenses = 0;
  for (const tx of filtered) {
    if (tx.type === 'income') filteredIncome += tx.amount;
    else filteredExpenses += tx.amount;
  }

  const editingTx = filterState.editingId
    ? state.transactions.find((t) => t.id === filterState.editingId) || null
    : null;

  const catOptions = state.categories
    .map((c) => `<option value="${escapeHtml(c.id)}"${filterState.category === c.id ? ' selected' : ''}>${escapeHtml(c.name)}</option>`)
    .join('');

  const formCatOptions = state.categories
    .map((c) => `<option value="${escapeHtml(c.id)}"${editingTx && editingTx.category === c.id ? ' selected' : ''}>${escapeHtml(c.name)}</option>`)
    .join('');

  const rowsHtml = filtered.length
    ? filtered
        .map((tx) => {
          const cat = getCategoryById(tx.category);
          const isInc = tx.type === 'income';
          return `
            <tr>
              <td class="num" style="white-space:nowrap;color:var(--ink-soft)">${escapeHtml(formatDateCell(tx.date))}</td>
              <td>
                <strong>${escapeHtml(tx.description)}</strong>
                ${tx.note ? `<div style="font-size:11.5px;color:var(--ink-muted)">${escapeHtml(tx.note)}</div>` : ''}
              </td>
              <td>
                <span class="pill pill-neutral">
                  <span class="cat-dot" style="background:${escapeHtml(cat.color)};width:7px;height:7px"></span>
                  ${escapeHtml(cat.name)}
                </span>
              </td>
              <td class="hide-sm" style="color:var(--ink-soft)">${escapeHtml(tx.member)}</td>
              <td class="text-right ${isInc ? 'amt-income' : 'amt-expense'}">${isInc ? '+' : '-'}${escapeHtml(formatMoney(tx.amount))}</td>
              <td class="text-right">
                <div class="tx-actions">
                  <button type="button" class="btn btn-ghost btn-xs" data-edit-tx="${escapeHtml(tx.id)}">Edit</button>
                  <button type="button" class="btn btn-danger-soft btn-xs" data-delete-tx="${escapeHtml(tx.id)}">Delete</button>
                </div>
              </td>
            </tr>`;
        })
        .join('')
    : `<tr><td colspan="6" class="empty-state">No transactions match your current filter.</td></tr>`;

  const hasFilters = Boolean(q || filterState.category !== 'all' || filterState.type !== 'all');

  container.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title">Transactions</h1>
        <p class="page-subtitle">${escapeHtml(state.meta.familyName)} &middot; ${escapeHtml(state.meta.monthLabel)} &middot; ${filtered.length} of ${state.transactions.length} entries shown</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-ghost" id="tx-export-btn">Export CSV</button>
        <button type="button" class="btn btn-primary" id="tx-toggle-form-btn">${filterState.showForm && !editingTx ? 'Close Form' : '+ Add Transaction'}</button>
      </div>
    </header>

    <section class="plan-banner" aria-label="Filtered transaction totals">
      <div>
        <div class="plan-stat-label">Matching Entries</div>
        <div class="plan-stat-val">${filtered.length}</div>
      </div>
      <div>
        <div class="plan-stat-label">Filtered Income</div>
        <div class="plan-stat-val" style="color:#226438">+${escapeHtml(formatMoney(filteredIncome))}</div>
      </div>
      <div>
        <div class="plan-stat-label">Filtered Outflows</div>
        <div class="plan-stat-val" style="color:var(--terra)">-${escapeHtml(formatMoney(filteredExpenses))}</div>
      </div>
      <div>
        <div class="plan-stat-label">Net Cashflow</div>
        <div class="plan-stat-val">${escapeHtml(formatMoney(filteredIncome - filteredExpenses))}</div>
      </div>
    </section>

    <section class="inline-panel" id="tx-editor-panel"${filterState.showForm ? '' : ' hidden'}>
      <div class="card-head" style="margin-bottom:10px">
        <h2 class="card-title">${editingTx ? 'Edit Transaction' : 'New Household Transaction'}</h2>
        <button type="button" class="btn btn-ghost btn-xs" id="tx-cancel-edit">Cancel</button>
      </div>
      <form id="tx-inline-form" class="form-grid">
        <label class="field">
          <span>Type</span>
          <select name="type" id="tx-f-type">
            <option value="expense"${!editingTx || editingTx.type === 'expense' ? ' selected' : ''}>Expense</option>
            <option value="income"${editingTx && editingTx.type === 'income' ? ' selected' : ''}>Income</option>
          </select>
        </label>
        <label class="field">
          <span>Date</span>
          <input type="date" name="date" value="${escapeHtml(editingTx ? editingTx.date : '2026-11-21')}" required>
        </label>
        <label class="field field-full">
          <span>Description</span>
          <input type="text" name="description" value="${escapeHtml(editingTx ? editingTx.description : '')}" placeholder="e.g. FreshMart Weekly Groceries" required>
        </label>
        <label class="field">
          <span>Category</span>
          <select name="category" id="tx-f-category"${editingTx && editingTx.type === 'income' ? ' disabled' : ''}>
            ${formCatOptions}
          </select>
        </label>
        <label class="field">
          <span>Amount ($)</span>
          <input type="number" name="amount" min="0.01" step="0.01" value="${editingTx ? editingTx.amount.toFixed(2) : ''}" placeholder="65.00" required>
        </label>
        <label class="field">
          <span>Member</span>
          <select name="member">
            ${state.meta.members.map((m) => `<option value="${escapeHtml(m)}"${editingTx && editingTx.member === m ? ' selected' : ''}>${escapeHtml(m)}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span>Note</span>
          <input type="text" name="note" value="${escapeHtml(editingTx ? editingTx.note : '')}" placeholder="Optional receipt note">
        </label>
        <div class="modal-foot field-full">
          <button type="submit" class="btn btn-primary">${editingTx ? 'Update Transaction' : 'Save Transaction'}</button>
        </div>
      </form>
    </section>

    <section class="card">
      <div class="toolbar" style="margin-bottom:12px">
        <input type="search" class="input search-input" id="tx-search" placeholder="Search merchant, note, or member..." value="${escapeHtml(filterState.query)}" aria-label="Search transactions">
        <select class="select" id="tx-cat-filter" aria-label="Filter by category">
          <option value="all">All Categories</option>
          <option value="income"${filterState.category === 'income' ? ' selected' : ''}>Income</option>
          ${catOptions}
        </select>
        <select class="select" id="tx-type-filter" aria-label="Filter by type">
          <option value="all"${filterState.type === 'all' ? ' selected' : ''}>All Types</option>
          <option value="expense"${filterState.type === 'expense' ? ' selected' : ''}>Expenses</option>
          <option value="income"${filterState.type === 'income' ? ' selected' : ''}>Income</option>
        </select>
        <select class="select" id="tx-sort" aria-label="Sort transactions">
          <option value="date-desc"${filterState.sort === 'date-desc' ? ' selected' : ''}>Newest first</option>
          <option value="date-asc"${filterState.sort === 'date-asc' ? ' selected' : ''}>Oldest first</option>
          <option value="amt-desc"${filterState.sort === 'amt-desc' ? ' selected' : ''}>Largest amount</option>
          <option value="amt-asc"${filterState.sort === 'amt-asc' ? ' selected' : ''}>Smallest amount</option>
        </select>
        ${hasFilters ? '<button type="button" class="btn btn-ghost btn-sm" id="tx-clear-filters">Clear</button>' : ''}
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th class="hide-sm">Member</th>
              <th class="text-right">Amount</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </section>
  `;

  const searchInput = container.querySelector('#tx-search');
  searchInput.addEventListener('input', (e) => {
    filterState.query = e.target.value;
    const pos = e.target.selectionStart;
    renderTransactions(container, ctx);
    const nextSearch = container.querySelector('#tx-search');
    nextSearch.focus();
    nextSearch.setSelectionRange(pos, pos);
  });

  container.querySelector('#tx-cat-filter').addEventListener('change', (e) => {
    filterState.category = e.target.value;
    renderTransactions(container, ctx);
  });

  container.querySelector('#tx-type-filter').addEventListener('change', (e) => {
    filterState.type = e.target.value;
    renderTransactions(container, ctx);
  });

  container.querySelector('#tx-sort').addEventListener('change', (e) => {
    filterState.sort = e.target.value;
    renderTransactions(container, ctx);
  });

  const clearBtn = container.querySelector('#tx-clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      filterState.query = '';
      filterState.category = 'all';
      filterState.type = 'all';
      renderTransactions(container, ctx);
    });
  }

  container.querySelector('#tx-export-btn').addEventListener('click', () => {
    downloadCsv(filtered);
    ctx.toast(`Exported ${filtered.length} transactions to CSV`);
  });

  container.querySelector('#tx-toggle-form-btn').addEventListener('click', () => {
    if (filterState.showForm && !filterState.editingId) {
      filterState.showForm = false;
    } else {
      filterState.editingId = null;
      filterState.showForm = true;
    }
    renderTransactions(container, ctx);
  });

  container.querySelector('#tx-cancel-edit').addEventListener('click', () => {
    filterState.editingId = null;
    filterState.showForm = false;
    renderTransactions(container, ctx);
  });

  const typeSel = container.querySelector('#tx-f-type');
  const catSel = container.querySelector('#tx-f-category');
  typeSel.addEventListener('change', () => {
    catSel.disabled = typeSel.value === 'income';
  });

  container.querySelector('#tx-inline-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      type: fd.get('type'),
      date: fd.get('date'),
      description: fd.get('description'),
      category: fd.get('type') === 'income' ? 'income' : fd.get('category'),
      amount: Number(fd.get('amount')),
      member: fd.get('member'),
      note: fd.get('note'),
    };
    if (filterState.editingId) {
      updateTransaction(filterState.editingId, payload);
      ctx.toast('Transaction updated');
    } else {
      addTransaction(payload);
      ctx.toast('Transaction added');
    }
    filterState.editingId = null;
    filterState.showForm = false;
    renderTransactions(container, ctx);
  });

  container.querySelectorAll('[data-edit-tx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      filterState.editingId = btn.dataset.editTx;
      filterState.showForm = true;
      renderTransactions(container, ctx);
    });
  });

  container.querySelectorAll('[data-delete-tx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      deleteTransaction(btn.dataset.deleteTx);
      ctx.toast('Transaction deleted');
      renderTransactions(container, ctx);
    });
  });
}
