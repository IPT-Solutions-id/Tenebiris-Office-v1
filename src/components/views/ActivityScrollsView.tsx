import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import { History, Search, Download, ShieldCheck, Flame, AlertTriangle, Bug } from 'lucide-react';

export const ActivityScrollsView: React.FC = () => {
  const { auditLogs } = useOffice();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tenebiris_activity_scrolls_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-hidden bg-[#09090F] select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#9E172C]/40 mb-6 shrink-0">
        <div>
          <h2 className="font-cinzel text-xl font-bold text-[#E8E4E9] text-glow-crimson flex items-center space-x-2">
            <History className="w-5 h-5 text-[#D7263D]" />
            <span>ACTIVITY SCROLLS & AUDIT TRAIL</span>
          </h2>
          <p className="text-xs text-[#A69EA9] mt-1 font-mono">
            Chronological audit ledger of all agent vows, tool handoffs, and execution events.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded bg-[#14121C] border border-[#9E172C]/50 hover:border-[#9E172C] text-[#E8E4E9] text-xs font-semibold transition-all"
        >
          <Download className="w-3.5 h-3.5 text-[#39C5CF]" />
          <span>Export Ledger (JSON)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6 shrink-0">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#7A7280] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search chronicle entries..."
            className="w-full bg-[#14121C] border border-[#9E172C]/40 rounded pl-9 pr-3 py-2 text-xs text-[#E8E4E9] focus:outline-none focus:border-[#D7263D]"
          />
        </div>

        <div className="flex space-x-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'RITUAL', 'INFO', 'WARN', 'ERROR'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                selectedLevel === lvl
                  ? 'bg-[#490D1B] text-[#E8E4E9] border border-[#9E172C] font-semibold'
                  : 'bg-[#14121C] text-[#A69EA9] hover:text-[#E8E4E9] border border-[#9E172C]/30'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="flex-1 overflow-y-auto border border-[#9E172C]/30 rounded-lg bg-[#0E0C16] font-mono text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#9E172C]/40 bg-[#14121C] text-[10.5px] uppercase text-[#A69EA9]">
              <th className="py-2.5 px-4 w-24">Timestamp</th>
              <th className="py-2.5 px-4 w-28">Severity</th>
              <th className="py-2.5 px-4 w-36">Actor</th>
              <th className="py-2.5 px-4 w-48">Action</th>
              <th className="py-2.5 px-4">Ledger Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#9E172C]/20 text-[11px]">
            {filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-[#14121C]/60 transition-colors">
                <td className="py-2.5 px-4 text-[#7A7280]">{log.timestamp}</td>
                <td className="py-2.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                      log.level === 'RITUAL'
                        ? 'bg-[#490D1B] text-[#D7263D] border border-[#9E172C]'
                        : log.level === 'ERROR'
                        ? 'bg-[#D7263D] text-[#E8E4E9]'
                        : log.level === 'WARN'
                        ? 'bg-[#2E2014] text-[#C69245]'
                        : 'bg-[#121B24] text-[#39C5CF]'
                    }`}
                  >
                    {log.level}
                  </span>
                </td>
                <td className="py-2.5 px-4 font-semibold text-[#E8E4E9]">{log.actor}</td>
                <td className="py-2.5 px-4 text-[#39C5CF]">{log.action}</td>
                <td className="py-2.5 px-4 text-[#A69EA9] font-sans">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
