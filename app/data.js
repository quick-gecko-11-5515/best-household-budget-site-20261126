// Realistic November 2026 household budget dataset for The Hartono Family.

export const HOUSEHOLD_META = {
  familyName: 'The Hartono Family',
  members: ['Maya', 'Budi', 'Joint'],
  monthLabel: 'November 2026',
  monthKey: '2026-11',
  currentDay: 21,
  daysInMonth: 30,
  firstWeekday: 0, // Nov 1, 2026 is a Sunday (0 = Sun)
};

export const INITIAL_CATEGORIES = [
  { id: 'housing', name: 'Housing', planned: 1850, bucket: 'needs', color: '#1F5C4A' },
  { id: 'groceries', name: 'Groceries', planned: 780, bucket: 'needs', color: '#2E7D87' },
  { id: 'utilities', name: 'Utilities', planned: 310, bucket: 'needs', color: '#4A6FA5' },
  { id: 'transport', name: 'Transport', planned: 420, bucket: 'needs', color: '#6C8B47' },
  { id: 'health', name: 'Health & Childcare', planned: 540, bucket: 'needs', color: '#7C5388' },
  { id: 'dining', name: 'Dining', planned: 280, bucket: 'wants', color: '#C04A34' },
  { id: 'entertainment', name: 'Entertainment', planned: 220, bucket: 'wants', color: '#D48A29' },
  { id: 'home', name: 'Home & Clothing', planned: 320, bucket: 'wants', color: '#A66A4C' },
  { id: 'savings', name: 'Savings & Goals', planned: 1280, bucket: 'savings', color: '#18362D' },
];

export const INITIAL_TRANSACTIONS = [
  { id: 'tx-01', date: '2026-11-01', type: 'income', description: 'Maya Salary — Hospital Clinic Payroll', category: 'income', amount: 3450.00, member: 'Maya', note: 'Primary paycheck' },
  { id: 'tx-02', date: '2026-11-01', type: 'expense', description: 'Maple Ridge Mortgage & HOA', category: 'housing', amount: 1850.00, member: 'Joint', note: 'Auto-draft #11' },
  { id: 'tx-03', date: '2026-11-01', type: 'expense', description: 'Emergency Fund Auto-Transfer', category: 'savings', amount: 600.00, member: 'Joint', note: 'High-yield savings' },
  { id: 'tx-04', date: '2026-11-02', type: 'expense', description: 'BrightSteps After-School Program', category: 'health', amount: 340.00, member: 'Joint', note: 'Two children' },
  { id: 'tx-05', date: '2026-11-03', type: 'expense', description: 'FreshMart Family Groceries', category: 'groceries', amount: 218.40, member: 'Maya', note: 'Weekly pantry & produce' },
  { id: 'tx-06', date: '2026-11-04', type: 'expense', description: 'City Water & Recycling', category: 'utilities', amount: 64.00, member: 'Joint', note: 'Monthly bill' },
  { id: 'tx-07', date: '2026-11-05', type: 'expense', description: 'Metro Transit Monthly Pass', category: 'transport', amount: 98.00, member: 'Budi', note: 'Commuter pass' },
  { id: 'tx-08', date: '2026-11-06', type: 'expense', description: 'Warung Nusantara Family Dinner', category: 'dining', amount: 84.50, member: 'Joint', note: 'Friday night out' },
  { id: 'tx-09', date: '2026-11-07', type: 'expense', description: 'Science Museum Family Pass', category: 'entertainment', amount: 68.00, member: 'Joint', note: 'Weekend outing' },
  { id: 'tx-10', date: '2026-11-08', type: 'expense', description: 'Kids Winter Coats & Boots', category: 'home', amount: 112.00, member: 'Maya', note: 'Seasonal clothing' },
  { id: 'tx-11', date: '2026-11-09', type: 'expense', description: "Trader's Co-op Produce & Bulk", category: 'groceries', amount: 186.20, member: 'Budi', note: 'Rice, oats & fruit' },
  { id: 'tx-12', date: '2026-11-10', type: 'expense', description: 'GreenGrid Electric & Gas', category: 'utilities', amount: 142.50, member: 'Joint', note: 'Autumn heating' },
  { id: 'tx-13', date: '2026-11-11', type: 'expense', description: 'Shell Fuel Station', category: 'transport', amount: 62.40, member: 'Maya', note: 'Full tank' },
  { id: 'tx-14', date: '2026-11-12', type: 'expense', description: 'FiberHome Internet', category: 'utilities', amount: 75.00, member: 'Joint', note: '300 Mbps plan' },
  { id: 'tx-15', date: '2026-11-13', type: 'expense', description: 'Friday Pizza & Gelato Night', category: 'dining', amount: 62.00, member: 'Budi', note: 'Family treat' },
  { id: 'tx-16', date: '2026-11-14', type: 'expense', description: 'Family Dental Co-pay & Pharmacy', category: 'health', amount: 92.00, member: 'Maya', note: 'Checkup & vitamins' },
  { id: 'tx-17', date: '2026-11-14', type: 'expense', description: 'Streaming & Kids Audiobook Bundle', category: 'entertainment', amount: 34.00, member: 'Maya', note: 'Monthly plan' },
  { id: 'tx-18', date: '2026-11-15', type: 'income', description: 'Budi Salary — Civil Engineering Payroll', category: 'income', amount: 2650.00, member: 'Budi', note: 'Mid-month payroll' },
  { id: 'tx-19', date: '2026-11-15', type: 'expense', description: 'FreshMart Weekly Shop', category: 'groceries', amount: 194.80, member: 'Maya', note: 'Week 3 groceries' },
  { id: 'tx-20', date: '2026-11-15', type: 'expense', description: 'Bali Holiday & Car Reserve Transfer', category: 'savings', amount: 550.00, member: 'Joint', note: 'Goal funding split' },
  { id: 'tx-21', date: '2026-11-16', type: 'expense', description: 'Coffee & Workday Lunches', category: 'dining', amount: 78.50, member: 'Maya', note: 'Clinic cafe' },
  { id: 'tx-22', date: '2026-11-16', type: 'expense', description: 'Hardware Store LED Bulbs & Filters', category: 'home', amount: 53.50, member: 'Budi', note: 'Furnace filter pack' },
  { id: 'tx-23', date: '2026-11-17', type: 'expense', description: 'Tire Rotation & Oil Service', category: 'transport', amount: 118.00, member: 'Budi', note: '60k mile maintenance' },
  { id: 'tx-24', date: '2026-11-18', type: 'income', description: 'Weekend Tutoring & Design Stipend', category: 'income', amount: 300.00, member: 'Maya', note: 'Extra household income' },
  { id: 'tx-25', date: '2026-11-19', type: 'expense', description: 'Shell Fuel Station', category: 'transport', amount: 54.60, member: 'Maya', note: 'Mid-month refill' },
  { id: 'tx-26', date: '2026-11-19', type: 'expense', description: 'Community Cinema Matinee', category: 'entertainment', amount: 46.00, member: 'Budi', note: 'Four tickets' },
  { id: 'tx-27', date: '2026-11-20', type: 'expense', description: 'Neighborhood Bakery & Dairy', category: 'groceries', amount: 68.60, member: 'Budi', note: 'Bread, milk & eggs' },
  { id: 'tx-28', date: '2026-11-20', type: 'expense', description: 'Noodle House Sunday Lunch', category: 'dining', amount: 81.00, member: 'Joint', note: 'Extended family visit' },
];

export const INITIAL_GOALS = [
  { id: 'goal-1', name: 'Emergency Fund (6 Months)', target: 24000, current: 14800, monthlyPlan: 600, targetDate: 'Dec 2027', color: '#1F5C4A' },
  { id: 'goal-2', name: 'Bali Family Holiday', target: 4500, current: 3150, monthlyPlan: 250, targetDate: 'Jul 2027', color: '#2E7D87' },
  { id: 'goal-3', name: 'Hybrid Car Replacement', target: 15000, current: 6400, monthlyPlan: 300, targetDate: 'Nov 2028', color: '#4A6FA5' },
  { id: 'goal-4', name: 'Home Solar & Roof Reserve', target: 8000, current: 2900, monthlyPlan: 130, targetDate: 'Jun 2028', color: '#D48A29' },
];

export const INITIAL_BILLS = [
  { id: 'bill-1', name: 'Maple Ridge Mortgage & HOA', shortLabel: 'Mortgage', dueDay: 1, amount: 1850.00, category: 'housing', autopay: true, paid: true },
  { id: 'bill-2', name: 'BrightSteps After-School', shortLabel: 'After-School', dueDay: 2, amount: 340.00, category: 'health', autopay: true, paid: true },
  { id: 'bill-3', name: 'City Water & Recycling', shortLabel: 'Water', dueDay: 4, amount: 64.00, category: 'utilities', autopay: false, paid: true },
  { id: 'bill-4', name: 'GreenGrid Electric & Gas', shortLabel: 'Electric', dueDay: 10, amount: 142.50, category: 'utilities', autopay: true, paid: true },
  { id: 'bill-5', name: 'FiberHome Internet', shortLabel: 'Internet', dueDay: 12, amount: 75.00, category: 'utilities', autopay: true, paid: true },
  { id: 'bill-6', name: 'Family Mobile Plan', shortLabel: 'Mobile', dueDay: 24, amount: 88.00, category: 'utilities', autopay: true, paid: false },
  { id: 'bill-7', name: 'Auto & Home Insurance', shortLabel: 'Insurance', dueDay: 27, amount: 215.00, category: 'transport', autopay: false, paid: false },
  { id: 'bill-8', name: 'Piano & Swim Lessons', shortLabel: 'Lessons', dueDay: 29, amount: 120.00, category: 'entertainment', autopay: false, paid: false },
];

export function createInitialState() {
  return {
    meta: { ...HOUSEHOLD_META },
    categories: INITIAL_CATEGORIES.map((c) => ({ ...c })),
    transactions: INITIAL_TRANSACTIONS.map((t) => ({ ...t })),
    goals: INITIAL_GOALS.map((g) => ({ ...g })),
    bills: INITIAL_BILLS.map((b) => ({ ...b })),
  };
}
