import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSomUZS } from "@/lib/money";
import type { PromoCodeMetric, PromoSplitRow } from "@/lib/api/schemas/analytics";

const empty: PromoSplitRow = { has_promo: false, orders: 0, completed: 0, cancelled: 0, revenue: 0, customers: 0 };

function SplitColumn({ title, row, totalCompleted }: { title: string; row: PromoSplitRow; totalCompleted: number }) {
  const share = totalCompleted > 0 ? (row.completed / totalCompleted) * 100 : 0;
  const closed = row.completed + row.cancelled;
  const cancelRate = closed > 0 ? (row.cancelled / closed) * 100 : 0;
  const avgOrder = row.completed > 0 ? row.revenue / row.completed : 0;

  const stats = [
    { label: "Revenue", value: `${formatSomUZS(row.revenue)} UZS` },
    { label: "Avg order value", value: `${formatSomUZS(Math.round(avgOrder))} UZS` },
    { label: "Cancel rate", value: `${cancelRate.toFixed(1)}%` },
    { label: "Customers", value: row.customers.toLocaleString() },
  ];

  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{row.completed.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">completed orders · {share.toFixed(1)}% of all</p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="text-sm font-medium tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function PromoSection({ split, discount, codes }: {
  split: PromoSplitRow[];
  discount: number;
  codes: PromoCodeMetric[];
}) {
  const withPromo = split.find((r) => r.has_promo) ?? { ...empty, has_promo: true };
  const withoutPromo = split.find((r) => !r.has_promo) ?? empty;
  const totalCompleted = withPromo.completed + withoutPromo.completed;
  const discountShare = withPromo.revenue > 0 ? (discount / withPromo.revenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SplitColumn title="With promo code" row={withPromo} totalCompleted={totalCompleted} />
        <SplitColumn title="Without promo code" row={withoutPromo} totalCompleted={totalCompleted} />
      </div>

      <p className="text-sm text-muted-foreground">
        Discount given: <span className="font-medium text-foreground tabular-nums">{formatSomUZS(Math.round(discount))} UZS</span>
        {withPromo.revenue > 0 && ` · ${discountShare.toFixed(1)}% of promo order value`}
      </p>

      {codes.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Order value</TableHead>
              <TableHead className="text-right">Discount</TableHead>
              <TableHead className="text-right">First-time customers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.map((c) => (
              <TableRow key={c.code}>
                <TableCell className="font-mono text-xs">{c.code}</TableCell>
                <TableCell className="text-right tabular-nums">{c.orders.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">{formatSomUZS(c.revenue)}</TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">{formatSomUZS(Math.round(c.discount))}</TableCell>
                <TableCell className="text-right tabular-nums">{c.new_customers.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
