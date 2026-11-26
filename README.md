# Hearthbook — Household Budget Site

[![make.fun bounty](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![make.fun rank](https://make.fun/badge/best-household-budget-site-20261126-1457/quick-gecko-11-5515/best-household-budget-site-20261126/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![make.fun reward](https://make.fun/badge/best-household-budget-site-20261126-1457/quick-gecko-11-5515/best-household-budget-site-20261126/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)

**Hearthbook** is a fast, offline-ready household budgeting web application built with vanilla ES modules, zero external dependencies, and persistent `localStorage` state. Pre-loaded with a realistic November 2026 ledger for **The Hartono Family** ($6,400 monthly income), it helps families track daily spending, plan monthly category budgets, fund savings goals, stay ahead of recurring bills, and balance their 50/30/20 allocation.

## Features
- **Dashboard (`#/dashboard`)**: Monthly income, spending, remaining cash, and savings rate KPIs; live category budget progress bars; inline SVG spending donut chart; upcoming bills with paid toggles; savings goals preview; and recent transactions.
- **Transactions (`#/transactions`)**: Full searchable and filterable family ledger with category/type filters, sorting, add/edit/delete controls, and CSV export.
- **Budgets (`#/budgets`)**: Interactive monthly planner per category with inline planned-amount inputs, quick steppers, over/under status indicators, Needs/Wants/Savings classification, and custom category creation.
- **Goals (`#/goals`)**: Savings goals tracker with target progress bars, monthly pace estimates, quick add-money controls, and custom goal creation.
- **Bills (`#/bills`)**: November 2026 due-date calendar grid and recurring bill schedule with persistent paid/unpaid toggles and add-bill form.
- **Reports & Insights (`#/reports`)**: Category spending bar chart, interactive 50/30/20 rule calculator bound to live household income, and tailored household budgeting recommendations.

## Local Preview & Dossier Build
```bash
# Preview the static app locally
node serve.ts

# Build the submission output and dossier.json
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License
MIT
