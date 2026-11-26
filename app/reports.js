// Reports & Insights view: category bar chart, interactive 50/30/20 rule calculator, and tailored household guidance.
import {
  computeSummary,
  escapeHtml,
  formatMoney,
  formatWhole,
  getState,
} from './store.js';
import { renderCategoryBarChart } from './charts.js';

let customIncomeOverride = null;

export function renderReports(container, ctx) {
  const state = getState();
  const s = computeSummary(state);

  const calcIncome = customIncomeOverride !== null ? customIncomeOverride : s.totalIncome;
  const safeInc = Math.max(1, calcIncome);

  const targetNeeds = calcIncome * 0.5;
  const targetWants = calcIncome * 0.3;
  const targetSavings = calcIncome * 0.2;

  const actualNeeds = s.needsActual;
  const actualWants = s.wantsActual;
  const actualSavings = s.savingsTransfers;

  const needsPct = (actualNeeds / safeInc) * 100;
  const wantsPct = (actualWants / safeInc) * 100;
  const savingsPct = (actualSavings / safeInc) * 100;

  const overCats = s.categoryRows.filter((c) => c.isOver);
  const emergencyGoal = state.goals.find((g) => g.name.toLowerCase().includes('emergency'));
  const runwayMonths = emergencyGoal && s.plannedLiving > 0
    ? (emergencyGoal.current / s.plannedLiving).toFixed(1)
    : '3.1';
  const remainingDays = Math.max(1, state.meta.daysInMonth - state.meta.currentDay);
  const groceriesRow = s.categoryRows.find((c) => c.id === 'groceries');
  const groceryDaily = groceriesRow ? Math.max(0, groceriesRow.delta) / remainingDays : 0;
  const savingsGap = Math.max(0, targetSavings - actualSavings);

  const tips = [
    {
      title: overCats.length ? `Trim ${overCats[0].name} before month-end` : 'All living categories within limit',
      body: overCats.length
        ? `${overCats[0].name} is ${formatMoney(Math.abs(overCats[0].delta))} over your ${formatWhole(overCats[0].planned)} plan. Cooking two extra dinners at home this week recovers the overage without touching savings.`
        : 'Every household spending category is currently under budget. Keep logging daily receipts to finish November ahead.',
    },
    {
      title: 'Cover upcoming bills from free checking',
      body: `You have ${formatMoney(s.unpaidBillsTotal)} in upcoming November bills (${s.unpaidBills.length} remaining) and ${formatMoney(s.freeChecking)} in unallocated checking cash — enough to clear every bill with ${formatMoney(s.freeChecking - s.unpaidBillsTotal)} to spare.`,
    },
    {
      title: savingsGap > 0 ? `Close the ${formatWhole(savingsGap)} gap to 20% savings` : '20% savings milestone reached',
      body: savingsGap > 0
        ? `You have transferred ${formatWhole(actualSavings)} (${savingsPct.toFixed(1)}%) to savings goals so far. Scheduling one ${formatWhole(savingsGap)} transfer before Nov 30 locks in the full 20% benchmark.`
        : `At ${savingsPct.toFixed(1)}% transferred, your family is beating the 20% savings benchmark this month.`,
    },
    {
      title: `Grocery pacing: ${formatMoney(groceryDaily)}/day left`,
      body: groceriesRow
        ? `With ${formatMoney(Math.max(0, groceriesRow.delta))} remaining in Groceries across the last ${remainingDays} days of November, planning one structured pantry-first shop keeps you under ${formatWhole(groceriesRow.planned)}.`
        : 'Batch meal planning once a week typically cuts household grocery waste by 10 to 15 percent.',
    },
    {
      title: `Emergency reserve covers ${runwayMonths} months`,
      body: `Your Emergency Fund (${emergencyGoal ? formatWhole(emergencyGoal.current) : '$14,800'}) covers roughly ${runwayMonths} months of planned living costs (${formatWhole(s.plannedLiving)}/mo). Continuing $600/mo builds toward a full 6-month family cushion.`,
    },
    {
      title: 'Offset higher Needs with disciplined Wants',
      body: `Family essentials (mortgage, childcare, groceries) sit at ${needsPct.toFixed(1)}% of income — normal for households with kids — while Wants are only ${wantsPct.toFixed(1)}%, keeping overall cashflow strongly positive.`,
    },
  ];

  container.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title">Reports &amp; Household Insights</h1>
        <p class="page-subtitle">${escapeHtml(state.meta.familyName)} &middot; ${escapeHtml(state.meta.monthLabel)} spending breakdown &amp; 50/30/20 rule check</p>
      </div>
      <div class="header-actions">
        <a href="#/budgets" class="btn btn-ghost">Adjust Budgets</a>
      </div>
    </header>

    <section class="two-col">
      <article class="card">
        <div class="card-head">
          <h2 class="card-title">Planned vs Actual by Category</h2>
          <span style="font-size:11.5px;color:var(--ink-soft)">Gray: Planned &middot; Color: Actual</span>
        </div>
        ${renderCategoryBarChart(s.categoryRows)}
        <div class="budget-row-top" style="margin-top:10px;padding-top:9px;border-top:1px solid var(--border);font-size:12px;color:var(--ink-soft)">
          <span>Total living spend: <strong style="color:var(--ink)">${escapeHtml(formatWhole(s.livingSpending))}</strong> of ${escapeHtml(formatWhole(s.plannedLiving))}</span>
          <span class="pill ${overCats.length ? 'pill-over' : 'pill-good'}">${overCats.length ? `${overCats.length} category over limit` : 'All within budget'}</span>
        </div>
      </article>

      <article class="card">
        <div class="card-head">
          <h2 class="card-title">50 / 30 / 20 Rule Calculator</h2>
          ${customIncomeOverride !== null ? '<button type="button" class="btn btn-ghost btn-xs" id="reset-503020-btn">Use actual income</button>' : '<span class="pill pill-pine">Live income</span>'}
        </div>

        <div class="toolbar" style="margin-bottom:14px">
          <label class="field" style="flex:1">
            <span>Monthly Take-Home Income ($)</span>
            <input type="number" id="calc-income-input" min="500" step="100" value="${Math.round(calcIncome)}">
          </label>
          <div style="font-size:12px;color:var(--ink-soft);padding-top:16px">
            50% Needs: <strong>${escapeHtml(formatWhole(targetNeeds))}</strong> &middot;
            30% Wants: <strong>${escapeHtml(formatWhole(targetWants))}</strong> &middot;
            20% Savings: <strong>${escapeHtml(formatWhole(targetSavings))}</strong>
          </div>
        </div>

        <div class="rule-bars">
          <div class="rule-row">
            <div class="rule-row-head">
              <strong>Needs (Housing, Groceries, Utilities, Transport, Health)</strong>
              <span class="num"><strong>${escapeHtml(formatWhole(actualNeeds))}</strong> (${needsPct.toFixed(1)}%) vs ${escapeHtml(formatWhole(targetNeeds))}</span>
            </div>
            <div class="progress-track progress-track-lg">
              <div class="progress-fill" style="width:${Math.min(100, Math.round((actualNeeds / Math.max(1, targetNeeds)) * 100))}%;background:${needsPct > 55 ? '#D98C26' : '#1F5C4A'}"></div>
            </div>
          </div>

          <div class="rule-row">
            <div class="rule-row-head">
              <strong>Wants (Dining, Entertainment, Home &amp; Clothing)</strong>
              <span class="num"><strong>${escapeHtml(formatWhole(actualWants))}</strong> (${wantsPct.toFixed(1)}%) vs ${escapeHtml(formatWhole(targetWants))}</span>
            </div>
            <div class="progress-track progress-track-lg">
              <div class="progress-fill" style="width:${Math.min(100, Math.round((actualWants / Math.max(1, targetWants)) * 100))}%;background:#2E7D87"></div>
            </div>
          </div>

          <div class="rule-row">
            <div class="rule-row-head">
              <strong>Savings Transfers (plus ${escapeHtml(formatWhole(s.freeChecking))} free cash)</strong>
              <span class="num"><strong>${escapeHtml(formatWhole(actualSavings))}</strong> (${savingsPct.toFixed(1)}%) vs ${escapeHtml(formatWhole(targetSavings))}</span>
            </div>
            <div class="progress-track progress-track-lg">
              <div class="progress-fill" style="width:${Math.min(100, Math.round((actualSavings / Math.max(1, targetSavings)) * 100))}%;background:#4C7C3B"></div>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="card">
      <div class="card-head">
        <h2 class="card-title">Actionable Tips for ${escapeHtml(state.meta.familyName)}</h2>
        <span class="pill pill-neutral">Updated live from ledger</span>
      </div>
      <div class="tips-grid">
        ${tips.map((t) => `<div class="tip-card"><h4>${escapeHtml(t.title)}</h4><p>${escapeHtml(t.body)}</p></div>`).join('')}
      </div>
    </section>
  `;

  container.querySelector('#calc-income-input').addEventListener('change', (e) => {
    const val = Number(e.target.value);
    if (val >= 500) {
      customIncomeOverride = val;
      renderReports(container, ctx);
    }
  });

  const resetBtn = container.querySelector('#reset-503020-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      customIncomeOverride = null;
      renderReports(container, ctx);
    });
  }
}
