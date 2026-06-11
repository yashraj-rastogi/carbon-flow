'use client';

import type { CarbonLogEntry } from '@/types';

interface HistoryTableProps {
  logs: CarbonLogEntry[];
}

/** Returns the appropriate styling for a utility type badge. */
function getTypeBadgeClasses(type: string): string {
  switch (type) {
    case 'electricity':
      return 'bg-yellow-950/40 text-yellow-400 border border-yellow-500/10';
    case 'gas':
      return 'bg-orange-950/40 text-orange-400 border border-orange-500/10';
    case 'water':
      return 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/10';
    default:
      return 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/10';
  }
}

/**
 * History log table displaying all ingested carbon entries.
 * Fully accessible with proper table semantics, scope attributes,
 * and an informative caption for screen readers.
 */
export default function HistoryTable({ logs }: HistoryTableProps) {
  return (
    <section
      className="relative z-10 max-w-6xl mx-auto px-6 mt-8"
      aria-label="Carbon ingestion history"
    >
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-4">
          Ingestion Registry Log
        </h2>

        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable history table">
          <table className="w-full text-left text-xs" aria-label="Carbon emissions log entries">
            <caption className="sr-only">
              A table of all uploaded utility bills and voice logs with their emission calculations.
            </caption>
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th scope="col" className="py-2.5 font-bold uppercase tracking-wider text-[11px]">
                  Date
                </th>
                <th scope="col" className="py-2.5 font-bold uppercase tracking-wider text-[11px]">
                  Type
                </th>
                <th scope="col" className="py-2.5 font-bold uppercase tracking-wider text-[11px]">
                  Details / Utility
                </th>
                <th scope="col" className="py-2.5 font-bold uppercase tracking-wider text-[11px]">
                  Usage
                </th>
                <th scope="col" className="py-2.5 font-bold uppercase tracking-wider text-[11px]">
                  Region
                </th>
                <th scope="col" className="py-2.5 font-bold uppercase tracking-wider text-right text-[11px]">
                  CO₂ Equivalent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400 font-mono text-[11px]">
                    &gt; No active records detected in registry.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="text-zinc-300 hover:bg-zinc-900/20 transition-colors"
                  >
                    <td className="py-3 font-mono">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 capitalize">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${getTypeBadgeClasses(log.type)}`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="py-3 max-w-[200px] truncate">
                      {log.billDetails?.utilityCompany || 'N/A'}
                    </td>
                    <td className="py-3 font-mono">
                      {log.billDetails?.consumption?.toFixed(1) || '0'}{' '}
                      {log.billDetails?.units || ''}
                    </td>
                    <td className="py-3 uppercase font-mono">
                      {log.billDetails?.state || 'US'}
                    </td>
                    <td className="py-3 text-right font-bold text-zinc-100">
                      {log.co2EmissionsKg?.toFixed(2)} kg
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
