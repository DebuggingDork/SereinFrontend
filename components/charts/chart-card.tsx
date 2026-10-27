"use client";

import { Download, Table2 } from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "@/components/ui/toast";

export interface TableView {
  columns: string[];
  rows: (string | number)[][];
}

// Every chart gets the same frame: a title, an accessible table view, an image
// export, and proper loading and empty states so an empty account never errors.
export function ChartCard({
  title,
  subtitle,
  loading,
  error,
  empty,
  emptyHint = "Nothing to show yet.",
  table,
  children,
  className = "",
  legend,
}: {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  emptyHint?: string;
  table?: TableView;
  children: React.ReactNode;
  className?: string;
  legend?: { label: string; color: string }[];
}) {
  const node = useRef<HTMLElement>(null);
  const [showTable, setShowTable] = useState(false);
  const { toast } = useToast();

  async function exportImage() {
    if (!node.current) return;
    try {
      // Only needed the moment someone exports, so it stays out of the page bundle.
      const { toPng } = await import("html-to-image");
      const url = await toPng(node.current, {
        pixelRatio: 2,
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        filter: (el) => !(el instanceof HTMLElement && el.dataset.chartControls !== undefined),
      });
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\W+/g, "-")}.png`;
      link.click();
    } catch {
      toast("That chart could not be exported.", { tone: "error" });
    }
  }

  const hasData = !loading && !error && !empty;

  return (
    <section ref={node} className={`rounded-3xl border border-line bg-surface p-5 ${className}`}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px]">{title}</h2>
          {subtitle && <p className="text-[13px] text-ink-3">{subtitle}</p>}
        </div>
        {hasData && (
          <div data-chart-controls className="flex shrink-0 gap-0.5">
            {table && (
              <button
                type="button"
                aria-label={showTable ? "Show chart" : "Show as table"}
                aria-pressed={showTable}
                onClick={() => setShowTable((current) => !current)}
                className="pressable cursor-pointer rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
              >
                <Table2 size={14} aria-hidden />
              </button>
            )}
            <button
              type="button"
              aria-label={`Export ${title} as an image`}
              onClick={exportImage}
              className="pressable cursor-pointer rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink"
            >
              <Download size={14} aria-hidden />
            </button>
          </div>
        )}
      </header>

      {legend && hasData && !showTable && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
          {legend.map((item) => (
            <li key={item.label} className="flex items-center gap-1.5">
              <span className="size-2 rounded-[2px]" style={{ background: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {loading ? (
        <div className="skeleton h-52 w-full" aria-busy />
      ) : error ? (
        <p role="alert" className="py-16 text-center text-sm text-bad">
          This chart could not load.
        </p>
      ) : empty ? (
        <div className="flex h-52 items-center justify-center px-6 text-center text-sm text-ink-3">{emptyHint}</div>
      ) : showTable && table ? (
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="sticky top-0 bg-surface text-ink-3">
              <tr>
                {table.columns.map((column) => (
                  <th key={column} scope="col" className="py-1.5 pr-3 font-normal">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular">
              {table.rows.map((row, index) => (
                <tr key={index} className="border-t border-line">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="py-1.5 pr-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
