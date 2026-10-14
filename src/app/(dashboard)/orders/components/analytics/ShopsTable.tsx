import { Link } from "react-router-dom";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatSomUZS } from "@/lib/money";
import type { ShopPerformance } from "@/lib/api/schemas/analytics";
import { formatMinutes, formatSeconds } from "@/app/(dashboard)/orders/components/analytics/format";

export function ShopsTable({ shops }: { shops: ShopPerformance[] }) {
  if (shops.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">За этот период активности заведений нет</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Заведение</TableHead>
          <TableHead className="text-right">Выручка</TableHead>
          <TableHead className="text-right">Выполнено</TableHead>
          <TableHead className="text-right">Доля отмен</TableHead>
          <TableHead className="text-right">Принятие</TableHead>
          <TableHead className="text-right">Приготовление</TableHead>
          <TableHead className="text-right">Оценка</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {shops.map((shop) => {
          const closed = shop.completed + shop.cancelled;
          const cancelRate = closed > 0 ? (shop.cancelled / closed) * 100 : 0;
          return (
            <TableRow key={shop.shop_id}>
              <TableCell>
                <div className="flex flex-col">
                  <Link to={`/shops/${shop.shop_id}`} className="text-sm underline-offset-2 hover:underline">
                    {shop.shop_name || `Заведение #${shop.shop_id}`}
                  </Link>
                  <span className="text-xs text-muted-foreground">{shop.partner_name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-sm tabular-nums">{formatSomUZS(shop.revenue)}</TableCell>
              <TableCell className="text-right tabular-nums">{shop.completed.toLocaleString("ru-RU")}</TableCell>
              <TableCell className={cancelRate >= 25 ? "text-right tabular-nums text-red-600 dark:text-red-400" : "text-right tabular-nums"}>
                {cancelRate.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatSeconds(shop.accept_median_sec)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMinutes(shop.prep_median_min)}</TableCell>
              <TableCell className="text-right tabular-nums">{shop.avg_rating != null ? shop.avg_rating.toFixed(1) : "—"}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
