import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import { orderStatusLabel } from '@/lib/order-status';
import { niceMax, RANGES, type SalesRange, type SalesSummary } from '@/lib/sales';
import { CountUp } from '../CountUp';
import admin from './Admin.module.css';
import styles from './Sales.module.css';

const compact = (n: number) =>
  n === 0 ? '₹0' : `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n)}`;
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/**
 * The admin sales dashboard. EXTRAPOLATED – no reference design; built from the admin's own
 * pieces (figures, filters, tables) and the dataviz method: one series in the brand red, thin
 * square columns (the site has no rounded corners), recessive hairline grid, a tooltip on every
 * column (hover or keyboard), and the same numbers as a table.
 */
export function SalesView({ range, summary, exportBase = '/admin/export' }: { range: SalesRange; summary: SalesSummary; exportBase?: string }) {
  const { points, by } = summary.series;
  const top = niceMax(Math.max(0, ...points.map((p) => p.revenue)));
  const ticks = [top, top / 2, 0];
  // A handful of dates along the bottom, never crowded: about six, always the last.
  const step = Math.max(1, Math.ceil(points.length / 6));
  const showLabel = (i: number) => i === points.length - 1 || (i % step === 0 && points.length - 1 - i >= step / 2);
  const statusTotal = summary.byStatus.reduce((n, s) => n + s.count, 0);
  const label = RANGES.find((r) => r.key === range)?.label ?? '';

  const figures = [
    { label: 'Revenue', value: <CountUp value={summary.revenue} />, money: true },
    { label: 'Orders', value: <CountUp value={summary.orders} plain duration={600} /> },
    { label: 'Average order', value: <CountUp value={summary.average} />, money: true },
    { label: 'Pieces sold', value: <CountUp value={summary.units} plain duration={600} /> },
    { label: `Refunded (${summary.refunds.orders})`, value: <CountUp value={summary.refunds.total} />, money: true },
  ];

  return (
    <>
      <header className={admin.head}>
        <div>
          <p className={admin.date}>{label}</p>
          <h1 className={admin.title}>Sales</h1>
        </div>
        <p className={admin.sub}>Confirmed, packed, shipped and delivered orders. India time.</p>
      </header>

      <div className={styles.toolbar}>
        <nav className={admin.filters} aria-label="Period">
          {RANGES.map((r) => (
            <Link key={r.key} href={r.key === '30d' ? '/admin/sales' : `/admin/sales?range=${r.key}`} className={admin.filter} aria-current={r.key === range ? 'page' : undefined}>
              {r.label}
            </Link>
          ))}
        </nav>
        <div className={styles.exports}>
          <a href={`${exportBase}?type=orders&range=${range}`} className="text-link">
            Export orders (CSV)
          </a>
          <a href={`${exportBase}?type=items&range=${range}`} className="text-link">
            Export items (CSV)
          </a>
        </div>
      </div>

      <div className={admin.figures}>
        {figures.map((f, i) => (
          <div key={f.label} className={admin.figure} style={{ '--i': i } as React.CSSProperties}>
            <span className={admin.figureLabel}>{f.label}</span>
            <span className={`${admin.figureValue} ${f.money ? styles.money : ''}`}>{f.value}</span>
          </div>
        ))}
      </div>

      <section className={admin.section} aria-labelledby="chart-title">
        <h2 id="chart-title" className={admin.sectionTitle}>
          Revenue by {by}
        </h2>
        <figure className={styles.chart}>
          <div className={styles.plot}>
            <div className={styles.grid} aria-hidden="true">
              {ticks.map((t) => (
                <div key={t} className={styles.gridLine}>
                  <span className={styles.tick}>{compact(t)}</span>
                </div>
              ))}
            </div>
            <ol className={styles.bars} style={{ '--n': points.length } as React.CSSProperties} aria-label={`Revenue by ${by}`}>
              {points.map((p, i) => {
                const h = (p.revenue / top) * 100;
                const text = `${p.label}: ${formatPrice(p.revenue)} from ${p.orders} ${p.orders === 1 ? 'order' : 'orders'}`;
                return (
                  <li
                    key={p.key}
                    className={styles.col}
                    tabIndex={0}
                    aria-label={text}
                    // Tooltips in the outer quarter on each side open inward, so they stay on screen.
                    data-edge={i < points.length / 4 ? 'start' : i >= (points.length * 3) / 4 ? 'end' : undefined}
                    style={{ '--h': h, '--i': Math.min(i, 30) } as React.CSSProperties}
                  >
                    {p.revenue > 0 && <span className={styles.bar} />}
                    <span className={styles.tip} aria-hidden="true">
                      <strong>{p.label}</strong>
                      <span>
                        {formatPrice(p.revenue)} · {p.orders} {p.orders === 1 ? 'order' : 'orders'}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
            {summary.revenue === 0 && <p className={styles.none}>No sales in this period yet.</p>}
          </div>
          <div className={styles.axis} style={{ '--n': points.length } as React.CSSProperties} aria-hidden="true">
            {points.map((p, i) => (
              <span key={p.key}>{showLabel(i) ? p.label : ''}</span>
            ))}
          </div>
          <details className={styles.asTable}>
            <summary className="text-link">Show as table</summary>
            <div className={admin.tableWrap}>
              <table className={admin.table}>
                <thead>
                  <tr>
                    <th className={admin.th}>{by === 'day' ? 'Day' : 'Month'}</th>
                    <th className={`${admin.th} ${admin.num}`}>Orders</th>
                    <th className={`${admin.th} ${admin.num}`}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {points.map((p) => (
                    <tr key={p.key}>
                      <td>{p.label}</td>
                      <td className={admin.num}>{p.orders}</td>
                      <td className={admin.num}>{formatPrice(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </figure>
      </section>

      <div className={styles.split}>
        <section className={admin.section} aria-labelledby="status-title">
          <h2 id="status-title" className={admin.sectionTitle}>
            Orders by status
          </h2>
          {statusTotal ? (
            <ul className={styles.meters} style={{ '--figure': '3em' } as React.CSSProperties}>
              {summary.byStatus.map((s, i) => (
                <li key={s.status} style={{ '--w': pct(s.count, statusTotal), '--i': i } as React.CSSProperties}>
                  <span className={styles.meterName}>{orderStatusLabel(s.status)}</span>
                  <span className={styles.meterTrack} aria-hidden="true">
                    <span className={styles.meterFill} />
                  </span>
                  <span className={styles.meterFigure}>{s.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={admin.empty}>No orders in this period.</p>
          )}
        </section>

        <section className={admin.section} aria-labelledby="pay-title">
          <h2 id="pay-title" className={admin.sectionTitle}>
            How customers paid
          </h2>
          {summary.orders ? (
            <ul className={styles.meters} style={{ '--figure': '10em' } as React.CSSProperties}>
              {summary.payment.map((p, i) => (
                <li key={p.method} style={{ '--w': pct(p.revenue, summary.revenue), '--i': i } as React.CSSProperties}>
                  <span className={styles.meterName}>{p.method === 'online' ? 'Online' : 'Cash on delivery'}</span>
                  <span className={styles.meterTrack} aria-hidden="true">
                    <span className={styles.meterFill} />
                  </span>
                  <span className={styles.meterFigure}>
                    {formatPrice(p.revenue)} · {pct(p.revenue, summary.revenue)}%
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={admin.empty}>No sales in this period.</p>
          )}
        </section>
      </div>

      <section className={admin.section} aria-labelledby="best-title">
        <h2 id="best-title" className={admin.sectionTitle}>
          Best sellers
        </h2>
        {summary.best.length ? (
          <div className={admin.tableWrap}>
            <table className={admin.table}>
              <thead>
                <tr>
                  <th className={admin.th}>Piece</th>
                  <th className={`${admin.th} ${admin.num}`}>Pieces sold</th>
                  <th className={`${admin.th} ${admin.num}`}>Revenue</th>
                  <th className={`${admin.th} ${admin.num}`}>Share</th>
                </tr>
              </thead>
              <tbody>
                {summary.best.map((b, i) => (
                  <tr key={b.slug} style={{ '--i': i } as React.CSSProperties}>
                    <td>
                      <Link href={`/products/${b.slug}`} className={styles.piece}>
                        {b.name}
                      </Link>
                    </td>
                    <td className={admin.num}>{b.units}</td>
                    <td className={admin.num}>{formatPrice(b.revenue)}</td>
                    <td className={admin.num}>{pct(b.revenue, summary.revenue)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={admin.empty}>Nothing sold in this period yet.</p>
        )}
      </section>
    </>
  );
}
