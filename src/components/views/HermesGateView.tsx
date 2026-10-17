import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import {
  DoorOpen,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Zap,
  Shield,
} from 'lucide-react';

export const HermesGateView: React.FC = () => {
  const {
    hermesState,
    testHermesConnection,
    syncHermesSkills,
    updateHermesUrl,
  } = useOffice();

  const [inputUrl, setInputUrl] = useState<string>(hermesState.gatewayUrl);
  const [testing, setTesting] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleTest = async () => {
    setTesting(true);
    await testHermesConnection();
    setTesting(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    await syncHermesSkills();
    setSyncing(false);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    updateHermesUrl(inputUrl);
    setSaveMessage('Hermes Gateway endpoint updated.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto bg-[#09090F] select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#9E172C]/40 mb-6 shrink-0">
        <div>
          <h2 className="font-cinzel text-xl font-bold text-[#E8E4E9] text-glow-crimson flex items-center space-x-2">
            <DoorOpen className="w-5 h-5 text-[#39C5CF]" />
            <span>HERMES GATEWAY & RUNTIME MATRIX</span>
          </h2>
          <p className="text-xs text-[#A69EA9] mt-1 font-mono">
            Authoritative AI execution gateway, capability discovery, and binding status.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 ${
              hermesState.connected
                ? 'bg-[#14291F] text-[#39C5CF] border border-[#39C5CF]/40'
                : 'bg-[#490D1B] text-[#D7263D] border border-[#9E172C]'
            }`}
          >
            {hermesState.connected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#39C5CF] animate-ping"></span>
                <span>GATEWAY CONNECTED</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>BINDING REQUIRED</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Top Config & Diagnostic Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Connection Diagnostics Card */}
        <div className="bg-[#14121C] border border-[#9E172C]/40 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Server className="w-4 h-4 text-[#D7263D]" />
              <h3 className="font-cinzel text-sm font-bold text-[#E8E4E9]">
                Gateway Connectivity
              </h3>
            </div>

            <div className="space-y-2 text-xs font-mono mb-4 bg-[#09090F] p-3 rounded border border-[#9E172C]/20">
              <div className="flex justify-between text-[#A69EA9]">
                <span>Status:</span>
                <span className="text-[#39C5CF] font-bold">
                  {hermesState.connected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex justify-between text-[#A69EA9]">
                <span>Roundtrip Latency:</span>
                <span className="text-[#E8E4E9]">{hermesState.latencyMs} ms</span>
              </div>
              <div className="flex justify-between text-[#A69EA9]">
                <span>Active Model:</span>
                <span className="text-[#C69245] truncate max-w-[150px]">{hermesState.activeModel}</span>
              </div>
              <div className="flex justify-between text-[#A69EA9]">
                <span>Primary Agent:</span>
                <span className="text-[#39C5CF] font-bold">Mr Sunan (001)</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleTest}
              disabled={testing}
              className="flex-1 py-2 px-3 rounded bg-[#490D1B] hover:bg-[#9E172C] text-[#E8E4E9] font-semibold text-xs transition-all flex items-center justify-center space-x-1"
            >
              <Zap className="w-3.5 h-3.5 text-[#39C5CF]" />
              <span>{testing ? 'Testing...' : 'Ping Gateway'}</span>
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="py-2 px-3 rounded bg-[#14121C] border border-[#9E172C]/40 hover:border-[#9E172C] text-[#E8E4E9] text-xs transition-all flex items-center space-x-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Gateway URL Configuration */}
        <div className="lg:col-span-2 bg-[#14121C] border border-[#9E172C]/40 rounded-lg p-5 flex flex-col justify-between">
          <form onSubmit={handleSaveUrl}>
            <h3 className="font-cinzel text-sm font-bold text-[#E8E4E9] mb-1">
              Hermes Gateway Runtime Endpoint
            </h3>
            <p className="text-xs text-[#A69EA9] mb-4">
              Direct connection URL for the existing authorized Hermes AI instance.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] text-[#A69EA9] font-mono uppercase mb-1">
                Endpoint URL
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  placeholder="http://localhost:8000"
                  className="flex-1 bg-[#09090F] border border-[#9E172C]/40 rounded px-3 py-2 text-xs text-[#E8E4E9] font-mono focus:outline-none focus:border-[#D7263D]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#9E172C] hover:bg-[#D7263D] text-[#E8E4E9] font-bold text-xs shadow-[0_0_10px_rgba(215,38,61,0.4)] transition-all"
                >
                  Save URL
                </button>
              </div>
            </div>

            {saveMessage && (
              <div className="text-[11px] text-[#39C5CF] font-mono flex items-center space-x-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saveMessage}</span>
              </div>
            )}
          </form>

          <div className="p-3 bg-[#09090F] rounded border border-[#9E172C]/20 text-[10.5px] text-[#A69EA9] font-mono leading-relaxed">
            Note: Greenfield rule enforces Hermes as single source of truth for AI execution. Tenebiris stores visual spatial layouts and workstation interaction states.
          </div>
        </div>
      </div>

      {/* Capability Matrix Table matching Prompt section 6 */}
      <div className="bg-[#14121C] border border-[#9E172C]/40 rounded-lg p-5">
        <h3 className="font-cinzel text-base font-bold text-[#E8E4E9] text-glow-crimson mb-1">
          Hermes Operational Capability Matrix
        </h3>
        <p className="text-xs text-[#A69EA9] mb-4 font-mono">
          Strict verification of runtime features against verified Hermes engine interfaces.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#9E172C]/30 text-[#A69EA9] text-[10.5px] uppercase">
                <th className="py-2.5 px-3">Capability Feature</th>
                <th className="py-2.5 px-3">Operational Tier</th>
                <th className="py-2.5 px-3">Functional Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#9E172C]/20 text-[11px]">
              {hermesState.capabilities.map((cap, idx) => {
                const isSupported = cap.status === 'SUPPORTED';
                const isPartial = cap.status === 'PARTIALLY SUPPORTED';

                return (
                  <tr key={idx} className="hover:bg-[#09090F]/50">
                    <td className="py-2.5 px-3 font-semibold text-[#E8E4E9]">{cap.name}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                          isSupported
                            ? 'bg-[#14291F] text-[#39C5CF] border border-[#39C5CF]/30'
                            : isPartial
                            ? 'bg-[#2E2014] text-[#C69245] border border-[#C69245]/30'
                            : 'bg-[#490D1B] text-[#D7263D] border border-[#9E172C]'
                        }`}
                      >
                        {cap.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#A69EA9] font-sans">{cap.description}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
