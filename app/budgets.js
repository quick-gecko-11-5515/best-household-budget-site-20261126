// Budgets view: monthly category planner with live editable planned amounts, steppers, and over/under indicators.
import {
  addCategory,
  computeSummary,
  escapeHtml,
  formatMoney,
  formatWhole,
  getState,
  updateCategoryPlan,
} from './store.js';

let showNewCategory = false;

const BUCKET_LABELS = {
  needs: 'Need (50%)',
  wants: 'Want (30%)',
  savings: 'Savings (20%)',
};

export function renderBudgets(container, ctx) {
  const state = getState();
  const s = computeSummary(state);

  const overCount = s.categoryRows.filter((c) => c.isOver).length;
  const needsPlan = s.categoryRows.filter((c) => c.bucket === 'needs').reduce((a, c) => a + c.planned, 0);
  const wantsPlan = s.categoryRows.filter((c) => c.bucket === 'wants').reduce((a, c) => a + c.planned, 0);
  const savingsPlan = s.categoryRows.filter((c) => c.bucket === 'savings').reduce((a, c) => a + c.planned, 0);
  const planDenom = Math.max(1, s.plannedTotal);
  const needsPct = Math.round((needsPlan / planDenom) * 100);
  const wantsPct = Math.round((wantsPlan / planDenom) * 100);
  const savingsPct = Math.max(0, 100 - needsPct - wantsPct);

  const cardsHtml = s.categoryRows
    .map((cat, idx) => {
      const clampedPct = Math.min(100, Math.round(cat.pct));
      const isNearLimit = !cat.isOver && cat.delta > 0 && cat.pct >= 90 && cat.bucket !== 'savings';
      const barColor = cat.isOver ? '#C04A34' : isNearLimit ? '#D98C26' : cat.color;
      let pillClass = 'pill-good';
      let pillText = `${formatMoney(cat.delta, 0)} under`;
      if (cat.bucket === 'savings') {
        pillClass = cat.spent >= cat.planned ? 'pill-good' : 'pill-pine';
        pillText = cat.spent >= cat.planned ? 'Goal met' : `${formatWhole(cat.delta)} to go`;
      } else if (cat.isOver) {
        pillClass = 'pill-over';
        pillText = `${formatWhole(Math.abs(cat.delta))} over budget`;
      } else if (cat.delta === 0) {
        pillClass = 'pill-pine';
        pillText = 'On budget';
      } else if (isNearLimit) {
        pillClass = 'pill-warn';
        pillText = `${formatWhole(cat.delta)} left`;
      }
      const isOddLast = idx === s.categoryRows.length - 1 && s.categoryRows.length % 2 === 1;

      return `
        <article class="budget-edit-card${cat.isOver ? ' is-over' : ''}${isOddLast ? ' is-full' : ''}">
          <div class="budget-edit-top">
            <div>
              <div class="cat-label" style="font-size:14.5px">
                <span class="cat-dot" style="background:${escapeHtml(cat.color)};width:10px;height:10px"></span>
                ${escapeHtml(cat.name)}
              </div>
              <div style="margin-top:3px;display:flex;gap:6px;align-items:center">
                <span class="pill pill-neutral" style="font-size:10.5px">${escapeHtml(BUCKET_LABELS[cat.bucket] || cat.bucket)}</span>
                <span class="pill ${pillClass}">${escapeHtml(pillText)}</span>
              </div>
            </div>
            <div class="budget-input-group" aria-label="Planned monthly budget for ${escapeHtml(cat.name)}">
              <button type="button" class="stepper-btn" data-step-cat="${escapeHtml(cat.id)}" data-delta="-25" aria-label="Decrease ${escapeHtml(cat.name)} budget by 25">&minus;</button>
              <input type="number" class="budget-num-input" min="0" step="10" value="${cat.planned}" data-plan-input="${escapeHtml(cat.id)}" aria-label="${escapeHtml(cat.name)} planned amount">
              <button type="button" class="stepper-btn" data-step-cat="${escapeHtml(cat.id)}" data-delta="25" aria-label="Increase ${escapeHtml(cat.name)} budget by 25">+</button>
            </div>
          </div>

          <div class="progress-track progress-track-lg">
            <div class="progress-fill" style="width:${clampedPct}%;background:${escapeHtml(barColor)}"></div>
          </div>

          <div class="budget-row-top" style="font-size:12.5px;color:var(--ink-soft)">
            <span>Spent: <strong style="color:var(--ink)">${escapeHtml(formatMoney(cat.spent))}</strong> (${Math.round(cat.pct)}%)</span>
            <span>Planned: <strong style="color:var(--ink)">${escapeHtml(formatWhole(cat.planned))}</strong></span>
          </div>
        </article>`;
    })
    .join('');

  const unallocColor = s.unallocatedIncome < 0 ? 'var(--terra)' : '#226438';

  container.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title">Monthly Budget Planner</h1>
        <p class="page-subtitle">${escapeHtml(state.meta.familyName)} &middot; ${escapeHtml(state.meta.monthLabel)} &middot; Edit any category limit to recalculate live</p>
      </div>
      <div class="header-actions">
        <a href="#/reports" class="btn btn-ghost">50/30/20 Calculator</a>
        <button type="button" class="btn btn-primary" id="toggle-new-cat-btn">${showNewCategory ? 'Close Form' : '+ Add Category'}</button>
      </div>
    </header>

    <section class="plan-banner" aria-label="Monthly plan allocation">
      <div>
        <div class="plan-stat-label">Monthly Income</div>
        <div class="plan-stat-val">${escapeHtml(formatWhole(s.totalIncome))}</div>
      </div>
      <div>
        <div class="plan-stat-label">Planned Total</div>
        <div class="plan-stat-val">${escapeHtml(formatWhole(s.plannedTotal))}</div>
      </div>
      <div>
        <div class="plan-stat-label">${s.unallocatedIncome >= 0 ? 'Unallocated Buffer' : 'Over-Allocated'}</div>
        <div class="plan-stat-val" style="color:${unallocColor}">${escapeHtml(formatWhole(s.unallocatedIncome))}</div>
      </div>
      <div>
        <div class="plan-stat-label">Budget Alerts</div>
        <div class="plan-stat-val" style="color:${overCount > 0 ? 'var(--terra)' : '#226438'}">${overCount > 0 ? `${overCount} over limit` : 'All on track'}</div>
      </div>
    </section>

    <section class="card" style="padding:12px 16px">
      <div class="budget-row-top" style="margin-bottom:7px">
        <strong style="font-size:13px">Planned Allocation Mix (Needs ${needsPct}% &middot; Wants ${wantsPct}% &middot; Savings ${savingsPct}%)</strong>
        <span class="num" style="font-size:12px;color:var(--ink-soft)">Needs ${escapeHtml(formatWhole(needsPlan))} &middot; Wants ${escapeHtml(formatWhole(wantsPlan))} &middot; Savings ${escapeHtml(formatWhole(savingsPlan))}</span>
      </div>
      <div style="display:flex;height:10px;border-radius:999px;overflow:hidden;gap:2px;background:#ECE7DC">
        <div style="width:${needsPct}%;background:#1F5C4A" title="Needs ${needsPct}%"></div>
        <div style="width:${wantsPct}%;background:#D48A29" title="Wants ${wantsPct}%"></div>
        <div style="width:${savingsPct}%;background:#2E7D87" title="Savings ${savingsPct}%"></div>
      </div>
    </section>

    <section class="inline-panel" id="new-cat-panel"${showNewCategory ? '' : ' hidden'}>
      <div class="card-head" style="margin-bottom:10px">
        <h2 class="card-title">Add Budget Category</h2>
      </div>
      <form id="new-cat-form" class="form-grid">
        <label class="field">
          <span>Category Name</span>
          <input type="text" name="name" placeholder="e.g. Pets & Vet Care" required>
        </label>
        <label class="field">
          <span>Monthly Limit ($)</span>
          <input type="number" name="planned" min="10" step="10" value="150" required>
        </label>
        <label class="field">
          <span>50/30/20 Group</span>
          <select name="bucket">
            <option value="needs">Needs</option>
            <option value="wants" selected>Wants</option>
            <option value="savings">Savings</option>
          </select>
        </label>
        <div class="modal-foot" style="align-items:flex-end">
          <button type="submit" class="btn btn-primary">Create Category</button>
        </div>
      </form>
    </section>

    <section class="budget-cards-grid">${cardsHtml}</section>
  `;

  container.querySelector('#toggle-new-cat-btn').addEventListener('click', () => {
    showNewCategory = !showNewCategory;
    renderBudgets(container, ctx);
  });

  container.querySelector('#new-cat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const created = addCategory({
      name: fd.get('name'),
      planned: Number(fd.get('planned')),
      bucket: fd.get('bucket'),
    });
    if (created) {
      showNewCategory = false;
      ctx.toast(`Added category "${created.name}"`);
      renderBudgets(container, ctx);
    }
  });

  container.querySelectorAll('[data-step-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const catId = btn.dataset.stepCat;
      const delta = Number(btn.dataset.delta);
      const currentCat = getState().categories.find((c) => c.id === catId);
      if (!currentCat) return;
      updateCategoryPlan(catId, Math.max(0, currentCat.planned + delta));
      renderBudgets(container, ctx);
    });
  });

  container.querySelectorAll('[data-plan-input]').forEach((input) => {
    input.addEventListener('change', () => {
      const catId = input.dataset.planInput;
      updateCategoryPlan(catId, Number(input.value));
      ctx.toast('Updated monthly budget limit');
      renderBudgets(container, ctx);
    });
  });
}
