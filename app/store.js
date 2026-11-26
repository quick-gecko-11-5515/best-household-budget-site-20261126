// Persistent localStorage state and financial calculations for Hearthbook.
import { createInitialState } from './data.js';

const STORAGE_KEY = 'hearthbook_hartono_v1';
const listeners = new Set();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.categories) || !Array.isArray(parsed.transactions)) {
      return createInitialState();
    }
    return parsed;
  } catch {
    return createInitialState();
  }
}

let state = loadState();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors in restricted browsing modes.
  }
  for (const fn of listeners) fn(state);
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetState() {
  state = createInitialState();
  persist();
}

export function formatMoney(amount, decimals = 2) {
  const num = Number(amount) || 0;
  const abs = Math.abs(num);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (num < 0 ? '-$' : '$') + formatted;
}

export function formatWhole(amount) {
  return formatMoney(amount, 0);
}

export function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function getCategoryById(id) {
  if (id === 'income') {
    return { id: 'income', name: 'Income', planned: 0, bucket: 'income', color: '#226438' };
  }
  return state.categories.find((c) => c.id === id) || {
    id,
    name: id,
    planned: 0,
    bucket: 'wants',
    color: '#75827C',
  };
}

export function computeSummary(current = state) {
  let totalIncome = 0;
  let livingSpending = 0;
  let savingsTransfers = 0;
  const spentByCategory = {};

  for (const cat of current.categories) {
    spentByCategory[cat.id] = 0;
  }

  for (const tx of current.transactions) {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amt;
    } else {
      spentByCategory[tx.category] = (spentByCategory[tx.category] || 0) + amt;
      const cat = current.categories.find((c) => c.id === tx.category);
      if (cat && cat.bucket === 'savings') {
        savingsTransfers += amt;
      } else {
        livingSpending += amt;
      }
    }
  }

  const remainingCash = totalIncome - livingSpending;
  const freeChecking = remainingCash - savingsTransfers;
  const savingsRate = totalIncome > 0 ? (savingsTransfers / totalIncome) * 100 : 0;
  const retainedRate = totalIncome > 0 ? (remainingCash / totalIncome) * 100 : 0;

  let plannedTotal = 0;
  let plannedLiving = 0;
  let plannedSavings = 0;
  let needsActual = 0;
  let wantsActual = 0;

  const categoryRows = current.categories.map((cat) => {
    const spent = spentByCategory[cat.id] || 0;
    const planned = Number(cat.planned) || 0;
    plannedTotal += planned;
    if (cat.bucket === 'savings') {
      plannedSavings += planned;
    } else {
      plannedLiving += planned;
    }
    if (cat.bucket === 'needs') needsActual += spent;
    if (cat.bucket === 'wants') wantsActual += spent;

    const delta = planned - spent;
    const pct = planned > 0 ? (spent / planned) * 100 : spent > 0 ? 100 : 0;
    return {
      ...cat,
      spent,
      delta,
      pct,
      isOver: cat.bucket !== 'savings' && spent > planned,
    };
  });

  const unpaidBills = current.bills
    .filter((b) => !b.paid)
    .sort((a, b) => a.dueDay - b.dueDay);
  const unpaidBillsTotal = unpaidBills.reduce((acc, b) => acc + Number(b.amount || 0), 0);
  const paidBillsTotal = current.bills
    .filter((b) => b.paid)
    .reduce((acc, b) => acc + Number(b.amount || 0), 0);

  const goalsCurrentTotal = current.goals.reduce((acc, g) => acc + Number(g.current || 0), 0);
  const goalsTargetTotal = current.goals.reduce((acc, g) => acc + Number(g.target || 0), 0);

  return {
    totalIncome,
    livingSpending,
    savingsTransfers,
    totalOutflows: livingSpending + savingsTransfers,
    remainingCash,
    freeChecking,
    savingsRate,
    retainedRate,
    plannedTotal,
    plannedLiving,
    plannedSavings,
    unallocatedIncome: totalIncome - plannedTotal,
    needsActual,
    wantsActual,
    spentByCategory,
    categoryRows,
    unpaidBills,
    unpaidBillsTotal,
    paidBillsTotal,
    goalsCurrentTotal,
    goalsTargetTotal,
  };
}

export function addTransaction(tx) {
  const id = 'tx-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const entry = {
    id,
    date: tx.date || '2026-11-21',
    type: tx.type === 'income' ? 'income' : 'expense',
    description: String(tx.description || '').trim(),
    category: tx.type === 'income' ? 'income' : (tx.category || 'groceries'),
    amount: Math.max(0.01, Math.round(Number(tx.amount) * 100) / 100),
    member: tx.member || 'Joint',
    note: String(tx.note || '').trim(),
  };
  state.transactions.push(entry);
  persist();
  return entry;
}

export function updateTransaction(id, updates) {
  const idx = state.transactions.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const prev = state.transactions[idx];
  const nextType = updates.type === 'income' ? 'income' : 'expense';
  state.transactions[idx] = {
    ...prev,
    date: updates.date || prev.date,
    type: nextType,
    description: String(updates.description ?? prev.description).trim(),
    category: nextType === 'income' ? 'income' : (updates.category || prev.category),
    amount: Math.max(0.01, Math.round(Number(updates.amount) * 100) / 100),
    member: updates.member || prev.member,
    note: String(updates.note ?? prev.note).trim(),
  };
  persist();
  return state.transactions[idx];
}

export function deleteTransaction(id) {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  persist();
}

export function updateCategoryPlan(catId, planned) {
  const cat = state.categories.find((c) => c.id === catId);
  if (!cat) return;
  cat.planned = Math.max(0, Math.round(Number(planned) || 0));
  persist();
}

export function addCategory({ name, planned, bucket }) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cat';
  const id = state.categories.some((c) => c.id === slug) ? `${slug}-${Date.now().toString(36)}` : slug;
  const palette = ['#2E7D87', '#6C8B47', '#7C5388', '#D48A29', '#4A6FA5', '#A66A4C'];
  const color = palette[state.categories.length % palette.length];
  const cat = {
    id,
    name: cleanName,
    planned: Math.max(0, Math.round(Number(planned) || 0)),
    bucket: ['needs', 'wants', 'savings'].includes(bucket) ? bucket : 'wants',
    color,
  };
  state.categories.push(cat);
  persist();
  return cat;
}

export function contributeToGoal(goalId, amount, alsoLogTx = false) {
  const goal = state.goals.find((g) => g.id === goalId);
  const delta = Math.round(Number(amount) * 100) / 100;
  if (!goal || !(delta > 0)) return null;
  goal.current = Math.round((Number(goal.current) + delta) * 100) / 100;
  if (alsoLogTx) {
    state.transactions.push({
      id: 'tx-goal-' + Date.now().toString(36),
      date: '2026-11-21',
      type: 'expense',
      description: `Transfer to ${goal.name}`,
      category: 'savings',
      amount: delta,
      member: 'Joint',
      note: 'Goal contribution',
    });
  }
  persist();
  return goal;
}

export function addGoal({ name, target, current, monthlyPlan, targetDate }) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;
  const palette = ['#1F5C4A', '#2E7D87', '#4A6FA5', '#D48A29', '#7C5388'];
  const goal = {
    id: 'goal-' + Date.now().toString(36),
    name: cleanName,
    target: Math.max(50, Math.round(Number(target) || 1000)),
    current: Math.max(0, Math.round(Number(current) || 0)),
    monthlyPlan: Math.max(10, Math.round(Number(monthlyPlan) || 100)),
    targetDate: String(targetDate || 'Dec 2027').trim(),
    color: palette[state.goals.length % palette.length],
  };
  state.goals.push(goal);
  persist();
  return goal;
}

export function toggleBillPaid(billId) {
  const bill = state.bills.find((b) => b.id === billId);
  if (!bill) return null;
  bill.paid = !bill.paid;
  persist();
  return bill;
}

export function addBill({ name, dueDay, amount, category, autopay }) {
  const cleanName = String(name || '').trim();
  if (!cleanName) return null;
  const bill = {
    id: 'bill-' + Date.now().toString(36),
    name: cleanName,
    dueDay: Math.min(30, Math.max(1, Math.round(Number(dueDay) || 15))),
    amount: Math.max(0.01, Math.round(Number(amount) * 100) / 100),
    category: category || 'utilities',
    autopay: Boolean(autopay),
    paid: false,
  };
  state.bills.push(bill);
  persist();
  return bill;
}
