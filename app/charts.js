// Inline SVG chart generators (zero external libraries).
import { escapeHtml, formatWhole } from './store.js';

export function renderDonutChart(slices, centerValue, centerLabel = 'Spent') {
  const total = slices.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const size = 156;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 57;
  const circumference = 2 * Math.PI * radius;

  if (total <= 0) {
    return `
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="No spending data yet">
        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#E5E0D5" stroke-width="20"/>
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="16" font-weight="800" fill="#1A2320">$0</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="11" fill="#75827C">${escapeHtml(centerLabel)}</text>
      </svg>`;
  }

  let offset = 0;
  const rings = slices
    .filter((s) => s.value > 0)
    .map((slice) => {
      const fraction = slice.value / total;
      const arc = fraction * circumference;
      const gap = slices.length > 1 ? Math.min(2.2, arc * 0.25) : 0;
      const dash = `${Math.max(0.5, arc - gap).toFixed(2)} ${(circumference - Math.max(0.5, arc - gap)).toFixed(2)}`;
      const dashOffset = (-offset).toFixed(2);
      offset += arc;
      return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${escapeHtml(slice.color)}" stroke-width="20" stroke-dasharray="${dash}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 ${cx} ${cy})"><title>${escapeHtml(slice.label)}: ${escapeHtml(formatWhole(slice.value))}</title></circle>`;
    })
    .join('');

  return `
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Monthly spending by category">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#EFEBE2" stroke-width="20"/>
      ${rings}
      <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="18" font-weight="800" fill="#1A2320">${escapeHtml(centerValue)}</text>
      <text x="${cx}" y="${cy + 15}" text-anchor="middle" font-size="11" font-weight="600" fill="#687670">${escapeHtml(centerLabel)}</text>
    </svg>`;
}

export function renderCategoryBarChart(rows) {
  const items = rows.filter((r) => r.bucket !== 'savings');
  const maxVal = Math.max(100, ...items.map((r) => Math.max(r.spent, r.planned)));
  const width = 620;
  const height = 238;
  const padLeft = 44;
  const padRight = 14;
  const padTop = 18;
  const padBottom = 52;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const step = plotW / Math.max(1, items.length);

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((frac) => {
    const val = Math.round(maxVal * frac);
    const y = padTop + plotH - frac * plotH;
    return `
      <line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}" stroke="#EBE6DC" stroke-width="1"/>
      <text x="${padLeft - 6}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="10.5" fill="#75827C">$${val}</text>`;
  }).join('');

  const bars = items.map((item, i) => {
    const xCenter = padLeft + step * i + step / 2;
    const barW = Math.min(24, step * 0.34);
    const plannedH = (item.planned / maxVal) * plotH;
    const spentH = (item.spent / maxVal) * plotH;
    const plannedY = padTop + plotH - plannedH;
    const spentY = padTop + plotH - spentH;
    const shortName = item.name.split(' ')[0];
    const spentFill = item.isOver ? '#C04A34' : item.color;

    return `
      <g>
        <rect x="${(xCenter - barW - 2).toFixed(1)}" y="${plannedY.toFixed(1)}" width="${barW.toFixed(1)}" height="${plannedH.toFixed(1)}" rx="3" fill="#DDD7CA">
          <title>${escapeHtml(item.name)} Planned: ${formatWhole(item.planned)}</title>
        </rect>
        <rect x="${(xCenter + 2).toFixed(1)}" y="${spentY.toFixed(1)}" width="${barW.toFixed(1)}" height="${spentH.toFixed(1)}" rx="3" fill="${escapeHtml(spentFill)}">
          <title>${escapeHtml(item.name)} Spent: ${formatWhole(item.spent)}</title>
        </rect>
        <text x="${xCenter.toFixed(1)}" y="${(padTop + plotH + 16).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="600" fill="#3B4843">${escapeHtml(shortName)}</text>
        <text x="${xCenter.toFixed(1)}" y="${(padTop + plotH + 30).toFixed(1)}" text-anchor="middle" font-size="10" fill="${item.isOver ? '#C04A34' : '#75827C'}">${escapeHtml(formatWhole(item.spent))}</text>
      </g>`;
  }).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" style="max-height:245px;display:block" role="img" aria-label="Planned versus actual monthly spending by category">
      ${ticks}
      ${bars}
    </svg>`;
}
