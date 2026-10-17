import React, { useState } from 'react';
import { useOffice } from '../../store/officeStore';
import { Settings, Monitor, Flame, RefreshCw, Volume2, VolumeX, ShieldCheck } from 'lucide-react';

export const OccultSettingsView: React.FC = () => {
  const {
    targetFps,
    setTargetFps,
    effectsEnabled,
    setEffectsEnabled,
    toggleMode,
    isDemoMode,
  } = useOffice();

  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleResetToMrSunan = () => {
    toggleMode(false);
    setResetMessage('Reset to Greenfield Core: Mr Sunan bound as sole Chief AI Orchestrator.');
    setTimeout(() => setResetMessage(null), 3000);
  };

  const handleLoadDemoGuild = () => {
    toggleMode(true);
    setResetMessage('Loaded Full 8-Agent Guild for chamber inspection.');
    setTimeout(() => setResetMessage(null), 3000);
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto bg-[#09090F] select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#9E172C]/40 mb-6 shrink-0">
        <div>
          <h2 className="font-cinzel text-xl font-bold text-[#E8E4E9] text-glow-crimson flex items-center space-x-2">
            <Settings className="w-5 h-5 text-[#C69245]" />
            <span>OCCULT SYSTEM SETTINGS</span>
          </h2>
          <p className="text-xs text-[#A69EA9] mt-1 font-mono">
            Rendering fidelity, frame throttling, sound synthesis, and state persistence.
          </p>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Rendering & Performance */}
        <div className="bg-[#14121C] border border-[#9E172C]/40 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-4">
            <Monitor className="w-4 h-4 text-[#39C5CF]" />
            <h3 className="font-cinzel text-base font-bold text-[#E8E4E9]">
              Graphics & Performance Target
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* FPS Selector */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-[#E8E4E9]">Engine Frame Rate Cap</h4>
                <p className="text-[#A69EA9] text-[11px]">
                  Target rendering frequency for the 2.5D Isometric Canvas.
                </p>
              </div>

              <div className="flex bg-[#09090F] border border-[#9E172C]/30 rounded p-0.5">
                <button
                  onClick={() => setTargetFps(60)}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
                    targetFps === 60
                      ? 'bg-[#9E172C] text-[#E8E4E9]'
                      : 'text-[#A69EA9] hover:text-[#E8E4E9]'
                  }`}
                >
                  60 FPS (High Fidelity)
                </button>
                <button
                  onClick={() => setTargetFps(30)}
                  className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-all ${
                    targetFps === 30
                      ? 'bg-[#9E172C] text-[#E8E4E9]'
                      : 'text-[#A69EA9] hover:text-[#E8E4E9]'
                  }`}
                >
                  30 FPS (Power Saver)
                </button>
              </div>
            </div>

            {/* Visual Effects */}
            <div className="flex items-center justify-between pt-3 border-t border-[#9E172C]/20">
              <div>
                <h4 className="font-semibold text-[#E8E4E9]">Ethereal Occult Glow & Flame Flicker</h4>
                <p className="text-[#A69EA9] text-[11px]">
                  Pulsating ritual pentagram lighting, candle flicker particles, and shadow auras.
                </p>
              </div>

              <button
                onClick={() => setEffectsEnabled(!effectsEnabled)}
                className={`px-3 py-1 rounded text-xs font-mono font-semibold border transition-all ${
                  effectsEnabled
                    ? 'bg-[#14291F] text-[#39C5CF] border-[#39C5CF]/40'
                    : 'bg-[#2A141A] text-[#D7263D] border-[#9E172C]'
                }`}
              >
                {effectsEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Atmospheric Sound */}
            <div className="flex items-center justify-between pt-3 border-t border-[#9E172C]/20">
              <div>
                <h4 className="font-semibold text-[#E8E4E9]">Gothic Cathedral Ambient Echo</h4>
                <p className="text-[#A69EA9] text-[11px]">
                  Subtle low-frequency occult resonance and terminal keystroke audio feedback.
                </p>
              </div>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded border transition-all ${
                  soundEnabled
                    ? 'bg-[#490D1B] text-[#D7263D] border-[#9E172C]'
                    : 'bg-[#09090F] text-[#7A7280] border-[#9E172C]/30'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* State Management & Greenfield Rules */}
        <div className="bg-[#14121C] border border-[#9E172C]/40 rounded-lg p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Flame className="w-4 h-4 text-[#D7263D]" />
            <h3 className="font-cinzel text-base font-bold text-[#E8E4E9]">
              Workspace State & Roster Controls
            </h3>
          </div>
          <p className="text-xs text-[#A69EA9] mb-4 leading-relaxed">
            Switch between strictly Greenfield V1.0 mode (Mr Sunan as sole primary Hermes agent) and Demo Mode (full 8-agent guild for visual verification).
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleResetToMrSunan}
              className="px-4 py-2 rounded bg-[#490D1B] hover:bg-[#9E172C] text-[#E8E4E9] text-xs font-semibold border border-[#9E172C] transition-all"
            >
              Strict Greenfield Mode (Mr Sunan Only)
            </button>
            <button
              onClick={handleLoadDemoGuild}
              className="px-4 py-2 rounded bg-[#14121C] hover:bg-[#2A1828] text-[#39C5CF] text-xs font-semibold border border-[#39C5CF]/40 transition-all"
            >
              Load Demo Guild (Full 8 Agents)
            </button>
          </div>

          {resetMessage && (
            <div className="mt-3 text-xs text-[#39C5CF] font-mono flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{resetMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
