import type { FigureSpec, Series } from '~/content/types';

/**
 * Figures drawn as SVG from a post's data. Each is drawn twice, a wide
 * version and a narrow one for phones, so type stays legible at every size
 * without measuring the page; CSS shows one of them.
 */

type Variant = 'wide' | 'narrow';
type Margin = { t: number; r: number; b: number; l: number };

const INK = 'var(--ink)';
const SOFT = 'var(--ink-soft)';
const RULE = 'var(--rule)';
const ACCENT = 'var(--accent)';

export function Chart({ spec }: { spec: FigureSpec }) {
  return (
    <>
      <div className='chart-wide max-w-[760px]'>
        <ChartVariant spec={spec} variant='wide' />
      </div>
      <div className='chart-narrow max-w-[460px]'>
        <ChartVariant spec={spec} variant='narrow' />
      </div>
    </>
  );
}

function ChartVariant({ spec, variant }: { spec: FigureSpec; variant: Variant }) {
  switch (spec.kind) {
    case 'line':
      return <LineChart spec={spec} variant={variant} />;
    case 'bars':
      return variant === 'wide' ? (
        <ColumnChart spec={spec} />
      ) : (
        <RowChart spec={spec} />
      );
    case 'scatter':
      return <ScatterChart spec={spec} variant={variant} />;
    case 'timeline':
      return variant === 'wide' ? (
        <TimelineWide spec={spec} />
      ) : (
        <TimelineNarrow spec={spec} />
      );
  }
}

function Frame({
  id,
  width,
  height,
  title,
  description,
  children
}: {
  id: string;
  width: number;
  height: number;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      className='chart block h-auto w-full overflow-visible'
      viewBox={`0 0 ${width} ${height}`}
      role='img'
      aria-labelledby={`${id}-t ${id}-d`}
    >
      <title id={`${id}-t`}>{title}</title>
      <desc id={`${id}-d`}>{description}</desc>
      {children}
    </svg>
  );
}

function niceTicks(min: number, max: number, target = 5) {
  const span = max - min;
  const steps = [1, 2, 2.5, 5, 10, 20, 25, 50, 100];
  // Prefer a step that divides the axis evenly, so both ends get a label.
  const step =
    steps.find((s) => span / s <= target && Number.isInteger(span / s)) ??
    steps.find((s) => span / s <= target) ??
    span / target;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  return ticks;
}

function describeSeries(series: Series[], labels: (string | number)[]) {
  return series
    .map(
      (s) =>
        `${s.name}: ${s.values.map((v, i) => `${labels[i]} ${v}`).join(', ')}`
    )
    .join('. ');
}

/** Pushes labels apart vertically so they never overlap. */
function spreadLabels(ys: number[], gap: number, min: number, max: number) {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < order.length; k++) {
    if (order[k].y - order[k - 1].y < gap) order[k].y = order[k - 1].y + gap;
  }
  const overflow = order.length ? order[order.length - 1].y - max : 0;
  if (overflow > 0) order.forEach((o) => (o.y -= overflow));
  for (const o of order) o.y = Math.max(min, o.y);
  const out: number[] = Array.from({ length: ys.length }, () => 0);
  order.forEach((o) => (out[o.i] = o.y));
  return out;
}

const dashFor = (index: number) => (index === 0 ? undefined : '5 4');

function LineChart({
  spec,
  variant
}: {
  spec: Extract<FigureSpec, { kind: 'line' }>;
  variant: Variant;
}) {
  const wide = variant === 'wide';
  const W = wide ? 760 : 340;
  const H = wide ? 340 : 280;
  const m: Margin = wide
    ? { t: 34, r: 128, b: 56, l: 48 }
    : { t: 30, r: 82, b: 54, l: 36 };
  const [y0, y1] = spec.yDomain;
  const n = spec.x.length;
  const x = (i: number) => m.l + (i * (W - m.l - m.r)) / (n - 1);
  const y = (v: number) => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);
  const ticks = niceTicks(y0, y1, wide ? 6 : 4);
  const labelEvery = !wide && n > 7 ? 2 : 1;
  const unit = spec.yUnit ?? '';
  const styled = spec.series.map((s, i) => ({
    s,
    // Our series is solid accent; the others alternate solid and dashed.
    dash: s.accent
      ? undefined
      : dashFor(spec.series.slice(0, i).filter((other) => !other.accent).length)
  }));
  const endYs = spreadLabels(
    spec.series.map((s) => y(s.values[s.values.length - 1])),
    wide ? 15 : 13,
    m.t,
    H - m.b
  );
  const id = `fig-${spec.id}-${variant}`;

  return (
    <Frame
      id={id}
      width={W}
      height={H}
      title={`Line chart: ${spec.yLabel} by ${spec.xLabel.toLowerCase()}.`}
      description={describeSeries(spec.series, spec.x)}
    >
      <text x={0} y={14} className='chart-title'>
        {spec.yLabel.toUpperCase()}
      </text>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke={RULE} strokeWidth={1} />
          <text x={m.l - 8} y={y(t) + 4} textAnchor='end'>
            {t}
            {unit}
          </text>
        </g>
      ))}
      <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} stroke={INK} strokeWidth={1} />
      {spec.x.map((label, i) =>
        i % labelEvery === 0 || i === n - 1 ? (
          <g key={i}>
            <line x1={x(i)} x2={x(i)} y1={H - m.b} y2={H - m.b + 5} stroke={INK} />
            <text x={x(i)} y={H - m.b + 19} textAnchor='middle'>
              {label}
            </text>
          </g>
        ) : null
      )}
      <text x={m.l + (W - m.l - m.r) / 2} y={H - 8} textAnchor='middle'>
        {spec.xLabel}
      </text>
      {styled.map(({ s, dash }) => (
        <g key={s.name}>
          <path
            d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join('')}
            fill='none'
            stroke={s.accent ? ACCENT : SOFT}
            strokeWidth={s.accent ? 2.25 : 1.4}
            strokeDasharray={dash}
            strokeLinejoin='round'
          />
          {s.values.map((v, i) => (
            <circle
              key={i}
              cx={x(i)}
              cy={y(v)}
              r={s.accent ? 2.8 : 2.2}
              fill={s.accent ? ACCENT : 'var(--paper)'}
              stroke={s.accent ? ACCENT : SOFT}
              strokeWidth={1.2}
            />
          ))}
        </g>
      ))}
      {spec.series.map((s, i) => (
        <text
          key={s.name}
          x={x(n - 1) + 10}
          y={endYs[i] + 4}
          className={s.accent ? 'chart-title' : undefined}
          style={s.accent ? { fill: ACCENT } : undefined}
        >
          {s.name}
        </text>
      ))}
    </Frame>
  );
}

function Legend({ series, x, y }: { series: Series[]; x: number; y: number }) {
  const starts = series.map((_, i) =>
    series.slice(0, i).reduce((sum, s) => sum + s.name.length * 6.8 + 30, 0)
  );
  return (
    <g>
      {series.map((s, i) => {
        const start = starts[i];
        return (
          <g key={s.name} transform={`translate(${x + start},${y})`}>
            <rect
              width={10}
              height={10}
              y={-9}
              fill={s.accent ? ACCENT : SOFT}
              fillOpacity={s.accent ? 1 : 0.45}
            />
            <text x={15} y={0}>
              {s.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ColumnChart({ spec }: { spec: Extract<FigureSpec, { kind: 'bars' }> }) {
  const W = 760;
  const H = 330;
  const m: Margin = { t: 50, r: 8, b: 40, l: 48 };
  const [y0, y1] = spec.yDomain;
  const y = (v: number) => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);
  const band = (W - m.l - m.r) / spec.categories.length;
  const groupPad = band * 0.22;
  const barW = (band - groupPad * 2) / spec.series.length;
  const ticks = niceTicks(y0, y1, 5);
  const unit = spec.yUnit ?? '';
  const id = `fig-${spec.id}-wide`;
  return (
    <Frame
      id={id}
      width={W}
      height={H}
      title={`Bar chart: ${spec.yLabel}.`}
      description={describeSeries(spec.series, spec.categories)}
    >
      <text x={0} y={14} className='chart-title'>
        {spec.yLabel.toUpperCase()}
      </text>
      {spec.series.length > 1 ? <Legend series={spec.series} x={m.l} y={36} /> : null}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke={RULE} />
          <text x={m.l - 8} y={y(t) + 4} textAnchor='end'>
            {t}
            {unit}
          </text>
        </g>
      ))}
      {spec.categories.map((cat, ci) => (
        <g key={cat}>
          {spec.series.map((s, si) => {
            const v = s.values[ci];
            const bx = m.l + ci * band + groupPad + si * barW;
            return (
              <g key={s.name}>
                <rect
                  x={bx + 1}
                  y={y(v)}
                  width={barW - 2}
                  height={Math.max(0, H - m.b - y(v))}
                  fill={s.accent ? ACCENT : SOFT}
                  fillOpacity={s.accent ? 1 : 0.45}
                />
                <text x={bx + barW / 2} y={y(v) - 6} textAnchor='middle'>
                  {v}
                </text>
              </g>
            );
          })}
          <text x={m.l + ci * band + band / 2} y={H - m.b + 20} textAnchor='middle'>
            {cat}
          </text>
        </g>
      ))}
      <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} stroke={INK} />
    </Frame>
  );
}

function RowChart({ spec }: { spec: Extract<FigureSpec, { kind: 'bars' }> }) {
  const W = 340;
  const rowH = 13;
  const groupH = spec.series.length * rowH + 30;
  const top = spec.series.length > 1 ? 52 : 30;
  const H = top + spec.categories.length * groupH;
  const labelW = 0;
  const right = 40;
  const [, y1] = spec.yDomain;
  const x = (v: number) => labelW + (v / y1) * (W - labelW - right);
  const unit = spec.yUnit ?? '';
  const id = `fig-${spec.id}-narrow`;
  return (
    <Frame
      id={id}
      width={W}
      height={H}
      title={`Bar chart: ${spec.yLabel}.`}
      description={describeSeries(spec.series, spec.categories)}
    >
      <text x={0} y={14} className='chart-title'>
        {spec.yLabel.toUpperCase()}
      </text>
      {spec.series.length > 1 ? <Legend series={spec.series} x={0} y={38} /> : null}
      {spec.categories.map((cat, ci) => {
        const gy = top + ci * groupH;
        return (
          <g key={cat}>
            <text x={0} y={gy + 14} className='chart-title'>
              {cat}
            </text>
            {spec.series.map((s, si) => {
              const v = s.values[ci];
              const by = gy + 22 + si * rowH;
              return (
                <g key={s.name}>
                  <rect x={0} y={by} width={W - right} height={rowH - 3} fill={RULE} fillOpacity={0.35} />
                  <rect
                    x={0}
                    y={by}
                    width={Math.max(1, x(v))}
                    height={rowH - 3}
                    fill={s.accent ? ACCENT : SOFT}
                    fillOpacity={s.accent ? 1 : 0.45}
                  />
                  <text x={W - right + 6} y={by + 9}>
                    {v}
                    {unit}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}
    </Frame>
  );
}

function ScatterChart({
  spec,
  variant
}: {
  spec: Extract<FigureSpec, { kind: 'scatter' }>;
  variant: Variant;
}) {
  const wide = variant === 'wide';
  const W = wide ? 760 : 340;
  const H = wide ? 360 : 300;
  const m: Margin = wide
    ? { t: 34, r: 20, b: 56, l: 48 }
    : { t: 30, r: 10, b: 56, l: 36 };
  const [x0, x1] = spec.xDomain;
  const [y0, y1] = spec.yDomain;
  const tx = (v: number) => (spec.xLog ? Math.log10(v) : v);
  const x = (v: number) =>
    m.l + ((tx(v) - tx(x0)) / (tx(x1) - tx(x0))) * (W - m.l - m.r);
  const y = (v: number) => H - m.b - ((v - y0) / (y1 - y0)) * (H - m.t - m.b);
  const xTicks = spec.xLog
    ? Array.from(
        { length: Math.round(Math.log10(x1) - Math.log10(x0)) + 1 },
        (_, i) => x0 * 10 ** i
      )
    : niceTicks(x0, x1, 5);
  const yTicks = niceTicks(y0, y1, 5);
  const id = `fig-${spec.id}-${variant}`;
  const below = spec.threshold
    ? spec.points.filter((p) => p.y < spec.threshold!.y).length
    : 0;
  return (
    <Frame
      id={id}
      width={W}
      height={H}
      title={`Scatter plot: ${spec.yLabel} against ${spec.xLabel.toLowerCase()}.`}
      description={`${spec.points.length} points.${spec.threshold ? ` ${below} fall below ${spec.threshold.label.toLowerCase()}.` : ''}`}
    >
      <text x={0} y={14} className='chart-title'>
        {spec.yLabel.toUpperCase()}
      </text>
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke={RULE} />
          <text x={m.l - 8} y={y(t) + 4} textAnchor='end'>
            {t.toFixed(1)}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={H - m.b} y2={H - m.b + 5} stroke={INK} />
          <text x={x(t)} y={H - m.b + 19} textAnchor='middle'>
            {Number(t.toPrecision(2))}%
          </text>
        </g>
      ))}
      <line x1={m.l} x2={W - m.r} y1={H - m.b} y2={H - m.b} stroke={INK} />
      <text x={m.l + (W - m.l - m.r) / 2} y={H - 8} textAnchor='middle'>
        {wide ? spec.xLabel : spec.xLabel.replace(/ \(log scale\)$/, ', log')}
      </text>
      {spec.threshold ? (
        <g>
          <line
            x1={m.l}
            x2={W - m.r}
            y1={y(spec.threshold.y)}
            y2={y(spec.threshold.y)}
            stroke={ACCENT}
            strokeDasharray='4 4'
          />
          <text
            x={W - m.r}
            y={y(spec.threshold.y) - 7}
            textAnchor='end'
            style={{ fill: ACCENT }}
          >
            {spec.threshold.label}
          </text>
        </g>
      ) : null}
      {spec.points.map((p, i) => (
        <circle
          key={i}
          cx={x(p.x)}
          cy={y(p.y)}
          r={wide ? 3.6 : 3}
          fill={p.highlight ? ACCENT : 'var(--paper)'}
          stroke={p.highlight ? ACCENT : SOFT}
          strokeWidth={1.2}
        />
      ))}
    </Frame>
  );
}

function wrap(text: string, maxChars: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function TimelineWide({ spec }: { spec: Extract<FigureSpec, { kind: 'timeline' }> }) {
  const W = 760;
  const H = 190;
  const n = spec.steps.length;
  const pad = 8;
  const colW = (W - pad * 2) / n;
  const lineY = 44;
  const id = `fig-${spec.id}-wide`;
  return (
    <Frame
      id={id}
      width={W}
      height={H}
      title='Timeline.'
      description={spec.steps.map((s) => `${s.date}: ${s.title}. ${s.detail}.`).join(' ')}
    >
      <line x1={pad} x2={W - pad} y1={lineY} y2={lineY} stroke={INK} />
      {spec.steps.map((step, i) => {
        const cx = pad + i * colW;
        const last = i === n - 1;
        return (
          <g key={step.title} transform={`translate(${cx},0)`}>
            <text x={0} y={lineY - 16} style={{ fill: ACCENT }}>
              {step.date.toUpperCase()}
            </text>
            <circle
              cx={6}
              cy={lineY}
              r={5}
              fill={last ? 'var(--paper)' : ACCENT}
              stroke={ACCENT}
              strokeWidth={1.5}
            />
            <text x={0} y={lineY + 32} className='chart-title' style={{ fontSize: 13 }}>
              {step.title}
            </text>
            {wrap(step.detail, 21).map((line, li) => (
              <text key={li} x={0} y={lineY + 52 + li * 16}>
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </Frame>
  );
}

function TimelineNarrow({ spec }: { spec: Extract<FigureSpec, { kind: 'timeline' }> }) {
  const W = 340;
  const stepH = 74;
  const H = spec.steps.length * stepH;
  const id = `fig-${spec.id}-narrow`;
  return (
    <Frame
      id={id}
      width={W}
      height={H}
      title='Timeline.'
      description={spec.steps.map((s) => `${s.date}: ${s.title}. ${s.detail}.`).join(' ')}
    >
      <line x1={7} x2={7} y1={10} y2={H - stepH + 14} stroke={INK} />
      {spec.steps.map((step, i) => {
        const top = i * stepH;
        const last = i === spec.steps.length - 1;
        return (
          <g key={step.title} transform={`translate(0,${top})`}>
            <circle
              cx={7}
              cy={10}
              r={5}
              fill={last ? 'var(--paper)' : ACCENT}
              stroke={ACCENT}
              strokeWidth={1.5}
            />
            <text x={26} y={14} style={{ fill: ACCENT }}>
              {step.date.toUpperCase()}
            </text>
            <text x={26} y={34} className='chart-title' style={{ fontSize: 13 }}>
              {step.title}
            </text>
            {wrap(step.detail, 42).map((line, li) => (
              <text key={li} x={26} y={52 + li * 15}>
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </Frame>
  );
}
