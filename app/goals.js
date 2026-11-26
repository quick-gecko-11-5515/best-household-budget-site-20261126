// Goals view: family savings targets, progress bars, quick add-money controls, and custom goal creation.
import {
  addGoal,
  computeSummary,
  contributeToGoal,
  escapeHtml,
  formatWhole,
  getState,
} from './store.js';

let showGoalForm = false;

export function renderGoals(container, ctx) {
  const state = getState();
  const s = computeSummary(state);
  const overallPct = s.goalsTargetTotal > 0 ? ((s.goalsCurrentTotal / s.goalsTargetTotal) * 100).toFixed(1) : '0.0';

  const goalsHtml = state.goals
    .map((goal) => {
      const pct = Math.min(100, Math.round((goal.current / Math.max(1, goal.target)) * 100));
      const remaining = Math.max(0, goal.target - goal.current);
      const monthsEst = goal.monthlyPlan > 0 ? Math.ceil(remaining / goal.monthlyPlan) : 0;
      const paceText = remaining === 0
        ? 'Goal funded!'
        : `~${monthsEst} mo left at ${formatWhole(goal.monthlyPlan)}/mo`;

      return `
        <article class="goal-card">
          <div class="goal-head">
            <div>
              <h2 class="goal-title">${escapeHtml(goal.name)}</h2>
              <div style="font-size:12px;color:var(--ink-soft);margin-top:2px">Target: ${escapeHtml(goal.targetDate)} &middot; ${escapeHtml(paceText)}</div>
            </div>
            <span class="pill ${remaining === 0 ? 'pill-good' : 'pill-pine'}">${pct}%</span>
          </div>

          <div class="goal-nums">
            <span class="goal-current">${escapeHtml(formatWhole(goal.current))}</span>
            <span class="goal-target">of ${escapeHtml(formatWhole(goal.target))} (${escapeHtml(formatWhole(remaining))} to go)</span>
          </div>

          <div class="progress-track progress-track-lg">
            <div class="progress-fill" style="width:${pct}%;background:${escapeHtml(goal.color)}"></div>
          </div>

          <div class="goal-add-row">
            <button type="button" class="btn btn-ghost btn-xs" data-goal-add="${escapeHtml(goal.id)}" data-amt="50">+$50</button>
            <button type="button" class="btn btn-ghost btn-xs" data-goal-add="${escapeHtml(goal.id)}" data-amt="150">+$150</button>
            <button type="button" class="btn btn-ghost btn-xs" data-goal-add="${escapeHtml(goal.id)}" data-amt="300">+$300</button>
            <input type="number" class="goal-custom-input" min="1" step="10" placeholder="Amount $" data-goal-input="${escapeHtml(goal.id)}" aria-label="Custom contribution to ${escapeHtml(goal.name)}">
            <button type="button" class="btn btn-primary btn-xs" data-goal-custom="${escapeHtml(goal.id)}">Add</button>
          </div>
        </article>`;
    })
    .join('');

  container.innerHTML = `
    <header class="page-header">
      <div>
        <h1 class="page-title">Savings Goals</h1>
        <p class="page-subtitle">${escapeHtml(state.meta.familyName)} &middot; Fund household reserves and track milestone progress</p>
      </div>
      <div class="header-actions">
        <label style="display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:var(--ink-soft);cursor:pointer">
          <input type="checkbox" id="goal-log-tx" checked>
          Also log as Savings transaction
        </label>
        <button type="button" class="btn btn-primary" id="toggle-goal-form-btn">${showGoalForm ? 'Close Form' : '+ New Goal'}</button>
      </div>
    </header>

    <section class="plan-banner" style="grid-template-columns:repeat(3,minmax(0,1fr))" aria-label="Savings goals overview">
      <div>
        <div class="plan-stat-label">Total Saved</div>
        <div class="plan-stat-val" style="color:var(--pine-mid)">${escapeHtml(formatWhole(s.goalsCurrentTotal))}</div>
      </div>
      <div>
        <div class="plan-stat-label">Combined Targets</div>
        <div class="plan-stat-val">${escapeHtml(formatWhole(s.goalsTargetTotal))}</div>
      </div>
      <div>
        <div class="plan-stat-label">Overall Funded</div>
        <div class="plan-stat-val">${overallPct}%</div>
      </div>
    </section>

    <section class="inline-panel" id="new-goal-panel"${showGoalForm ? '' : ' hidden'}>
      <div class="card-head" style="margin-bottom:10px">
        <h2 class="card-title">Create New Savings Goal</h2>
      </div>
      <form id="new-goal-form" class="form-grid">
        <label class="field">
          <span>Goal Name</span>
          <input type="text" name="name" placeholder="e.g. Kids College Tuition Fund" required>
        </label>
        <label class="field">
          <span>Target Date</span>
          <input type="text" name="targetDate" placeholder="e.g. Sep 2029" value="Dec 2028" required>
        </label>
        <label class="field">
          <span>Target Amount ($)</span>
          <input type="number" name="target" min="100" step="50" value="5000" required>
        </label>
        <label class="field">
          <span>Starting Balance ($)</span>
          <input type="number" name="current" min="0" step="50" value="500" required>
        </label>
        <label class="field">
          <span>Monthly Contribution Plan ($)</span>
          <input type="number" name="monthlyPlan" min="10" step="10" value="150" required>
        </label>
        <div class="modal-foot" style="align-items:flex-end">
          <button type="submit" class="btn btn-primary">Save Goal</button>
        </div>
      </form>
    </section>

    <section class="goals-grid">${goalsHtml}</section>
  `;

  container.querySelector('#toggle-goal-form-btn').addEventListener('click', () => {
    showGoalForm = !showGoalForm;
    renderGoals(container, ctx);
  });

  container.querySelector('#new-goal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const created = addGoal({
      name: fd.get('name'),
      target: Number(fd.get('target')),
      current: Number(fd.get('current')),
      monthlyPlan: Number(fd.get('monthlyPlan')),
      targetDate: fd.get('targetDate'),
    });
    if (created) {
      showGoalForm = false;
      ctx.toast(`Created goal "${created.name}"`);
      renderGoals(container, ctx);
    }
  });

  const shouldLog = () => Boolean(container.querySelector('#goal-log-tx')?.checked);

  container.querySelectorAll('[data-goal-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const amt = Number(btn.dataset.amt);
      const g = contributeToGoal(btn.dataset.goalAdd, amt, shouldLog());
      if (g) ctx.toast(`Added ${formatWhole(amt)} to ${g.name}`);
      renderGoals(container, ctx);
    });
  });

  container.querySelectorAll('[data-goal-custom]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const goalId = btn.dataset.goalCustom;
      const input = container.querySelector(`[data-goal-input="${goalId}"]`);
      const amt = Number(input?.value);
      if (!(amt > 0)) return;
      const g = contributeToGoal(goalId, amt, shouldLog());
      if (g) ctx.toast(`Added ${formatWhole(amt)} to ${g.name}`);
      renderGoals(container, ctx);
    });
  });
}
