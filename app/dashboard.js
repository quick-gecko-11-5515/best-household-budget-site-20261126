// Dashboard view: monthly overview KPIs, category budgets, donut chart, upcoming bills, goals, recent transactions.
import {
  computeSummary,
  escapeHtml,
  formatMoney,
  formatWhole,
  getCategoryById,
  getState,
  toggleBillPaid,
} from './store.js';
import { renderDonutChart } from './charts.js';

function formatShortDate(iso) {
  const parts = String(iso || '').split('-');
  if (parts.length !== 3) return iso;
  return `Nov ${Number(parts[2])}`;
}

export function renderDashboard(container, ctx) {
  const state = getState();
  const s = computeSummary(state);

  const livingCats = s.categoryRows.filter((c) => c.bucket !== 'savings');
  const sortedBySpend = [...livingCats].sort((a, b) => b.spent - a.spent);
  const topSlices = sortedBySpend.slice(0, 6).map((c) => ({
    label: c.name,
    value: c.spent,
    color: c.color,
  }));
  const otherTotal = sortedBySpend.slice(6).reduce((acc, c) => acc + c.spent, 0);
  if (otherTotal > 0) {
    topSlices.push({ label: 'Other', value: otherTotal, color: '#A66A4C' });
  }

  const recentTx = [...state.transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 5);

  const spendShare = s.totalIncome > 0 ? ((s.livingSpending / s.totalIncome) * 100).toFixed(1) : '0.0';
  const budgetRowsHtml = livingCats
    .map((cat) => {
      const clampedPct = Math.min(100, Math.round(cat.pct));
      const isNearLimit = !cat.isOver && cat.delta > 0 && cat.pct >= 90;
      const barColor = cat.isOver ? '#C04A34' : isNearLimit ? '#D98C26' : cat.color;
      const pillClass = cat.isOver
        ? 'pill-over'
        : cat.delta === 0
          ? 'pill-pine'
          : isNearLimit
            ? 'pill-warn'
            : 'pill-good';
      const pillText = cat.isOver
        ? `${formatWhole(Math.abs(cat.delta))} over`
        : cat.delta === 0
          ? 'On target'
          : `${formatWhole(cat.delta)} left`;
      return `
        <div class="budget-row">
          <div class="budget-row-top">
            <span class="cat-label">
              <span class="cat-dot" style="background:${escapeHtml(cat.color)}"></span>
              ${escapeHtml(cat.name)}
            </span>
            <span class="budget-figures">
              <span><strong>${escapeHtml(formatWhole(cat.spent))}</strong> / ${escapeHtml(formatWhole(cat.planned))}</span>
              <span class="pill ${pillClass}">${escapeHtml(pillText)}</span>
            </span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${clampedPct}%;background:${escapeHtml(barColor)}"></div>
          </div>
        </div>`;
    })
    .join('');

  const legendHtml = topSlices
    .map((sl) => {
      const pct = s.livingSpending > 0 ? Math.round((sl.value / s.livingSpending) * 100) : 0;
      return `
        <div class="legend-item">
          <span class="legend-left">
            <span class="cat-dot" style="background:${escapeHtml(sl.color)}"></span>
            <span class="legend-name">${escapeHtml(sl.label)}</span>
          </span>
          <span class="legend-val">${escapeHtml(formatWhole(sl.value))}<span class="legend-pct">${pct}%</span></span>
        </div>`;
    })
    .join('');

  const upcomingHtml = s.unpaidBills.length
    ? s.unpaidBills
        .slice(0, 4)
        .map((bill) => {
          const cat = getCategoryById(bill.category);
          const daysLeft = bill.dueDay - state.meta.currentDay;
          const dueNote = daysLeft >= 0 ? `Due in ${daysLeft}d` : `${Math.abs(daysLeft)}d overdue`;
          return `
            <div class="bill-mini-row">
              <span class="bill-date-chip">Nov ${bill.dueDay}</span>
              <div class="bill-info">
                <div class="bill-name">${escapeHtml(bill.name)}</div>
                <div class="bill-meta">${escapeHtml(cat.name)} &middot; ${escapeHtml(dueNote)}</div>
              </div>
              <div class="bill-right">
                <span class="bill-amt">${escapeHtml(formatMoney(bill.amount, 0))}</span>
                <button type="button" class="btn btn-ghost btn-xs" data-pay-bill="${escapeHtml(bill.id)}">Mark Paid</button>
              </div>
            </div>`;
        })
        .join('')
    : '<div class="empty-state">All November recurring bills are paid.</div>';

  const goalsPreviewHtml = state.goals
    .slice(0, 3)
    .map((g) => {
      const pct = Math.min(100, Math.round((g.current / g.target) * 100));
      return `
        <div class="budget-row">
          <div class="budget-row-top">
            <span class="cat-label">
              <span class="cat-dot" style="background:${escapeHtml(g.color)}"></span>
              ${escapeHtml(g.name)}
            </span>
            <span class="budget-figures">
              <strong>${escapeHtml(formatWhole(g.current))}</strong> / ${escapeHtml(formatWhole(g.target))} (${pct}%)
            </span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${pct}%;background:${escapeHtml(g.color)}"></div>
          </div>
        </div>`;
    })
    .join('');

  const recentRowsHtml = recentTx
    .map((tx) => {
      const cat = getCategoryById(tx.category);
      const isInc = tx.type === 'income';
      return `
        <tr>
          <td class="num" style="white-space:nowrap;color:var(--ink-muted)">${escapeHtml(formatShortDate(tx.date))}</td>
          <td><strong>${escapeHtml(tx.description)}</strong></td>
          <td><span class="pill pill-neutral"><span class="cat-dot" style="background:${escapeHtml(cat.color)};width:7px;height:7px"></span>${escapeHtml(cat.name)}</span></td>
          <td class="hide-sm" style="color:var(--ink-soft)">${escapeHtml(tx.member)}</td>
          <td class="text-right ${isInc ? 'amt-income' : 'amt-expense'}">${isInc ? '+' : '-'}${escapeHtml(formatMoney(tx.amount))}</td>
        </tr>`;
    })
    .join('');

  container.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title">Household Overview</h1>
        <p class="page-subtitle">${escapeHtml(state.meta.familyName)} &middot; ${escapeHtml(state.meta.monthLabel)} &middot; Day ${state.meta.currentDay} of ${state.meta.daysInMonth}</p>
      </div>
      <div class="header-actions">
        <a href="#/reports" class="btn btn-ghost">50/30/20 Report</a>
        <button type="button" class="btn btn-primary" data-open-quick-add>+ Add Transaction</button>
      </div>
    </header>

    <section class="kpi-grid" aria-label="Monthly summary">
      <div class="kpi-card">
        <span class="kpi-label">Monthly Income</span>
        <span class="kpi-value">${escapeHtml(formatWhole(s.totalIncome))}</span>
        <span class="kpi-sub"><span class="pill pill-pine">3 inflows</span> Maya &amp; Budi</span>
      </div>
      <div class="kpi-card kpi-spend">
        <span class="kpi-label">Total Spending</span>
        <span class="kpi-value">${escapeHtml(formatWhole(s.livingSpending))}</span>
        <span class="kpi-sub"><span class="pill pill-neutral">${spendShare}% of income</span> of ${escapeHtml(formatWhole(s.plannedLiving))} plan</span>
      </div>
      <div class="kpi-card kpi-left">
        <span class="kpi-label">Remaining Cash</span>
        <span class="kpi-value">${escapeHtml(formatWhole(s.remainingCash))}</span>
        <span class="kpi-sub"><span class="pill pill-good">${escapeHtml(formatWhole(s.freeChecking))} free</span> after ${escapeHtml(formatWhole(s.savingsTransfers))} saved</span>
      </div>
      <div class="kpi-card kpi-save">
        <span class="kpi-label">Savings Rate</span>
        <span class="kpi-value">${s.savingsRate.toFixed(1)}%</span>
        <span class="kpi-sub"><span class="pill pill-warn">${escapeHtml(formatWhole(s.savingsTransfers))} / ${escapeHtml(formatWhole(s.plannedSavings))}</span> target 20%</span>
      </div>
    </section>

    <section class="dash-grid">
      <div class="stack">
        <article class="card">
          <div class="card-head">
            <h2 class="card-title">Category Budgets</h2>
            <a href="#/budgets" class="card-link">Edit plan &rarr;</a>
          </div>
          <div class="budget-bar-list">${budgetRowsHtml}</div>
        </article>

        <article class="card">
          <div class="card-head">
            <h2 class="card-title">Recent Transactions</h2>
            <a href="#/transactions" class="card-link">All ${state.transactions.length} entries &rarr;</a>
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
                </tr>
              </thead>
              <tbody>${recentRowsHtml}</tbody>
            </table>
          </div>
        </article>
      </div>

      <div class="stack">
        <article class="card">
          <div class="card-head">
            <h2 class="card-title">Spending Breakdown</h2>
            <a href="#/reports" class="card-link">Insights &rarr;</a>
          </div>
          <div class="donut-wrap">
            <div class="donut-svg-box">
              ${renderDonutChart(topSlices, formatWhole(s.livingSpending), 'Living Spend')}
            </div>
            <div class="chart-legend">${legendHtml}</div>
          </div>
        </article>

        <article class="card">
          <div class="card-head">
            <h2 class="card-title">Upcoming Bills (${s.unpaidBills.length} due &middot; ${escapeHtml(formatWhole(s.unpaidBillsTotal))})</h2>
            <a href="#/bills" class="card-link">Calendar &rarr;</a>
          </div>
          <div class="bill-mini-list">${upcomingHtml}</div>
        </article>

        <article class="card">
          <div class="card-head">
            <h2 class="card-title">Savings Goals</h2>
            <a href="#/goals" class="card-link">Add funds &rarr;</a>
          </div>
          <div class="budget-bar-list">${goalsPreviewHtml}</div>
        </article>
      </div>
    </section>
  `;

  container.querySelectorAll('[data-pay-bill]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bill = toggleBillPaid(btn.dataset.payBill);
      if (bill) ctx.toast(`Marked "${bill.name}" as paid`);
      renderDashboard(container, ctx);
    });
  });

  container.querySelectorAll('[data-open-quick-add]').forEach((btn) => {
    btn.addEventListener('click', () => ctx.openQuickAdd());
  });
}
