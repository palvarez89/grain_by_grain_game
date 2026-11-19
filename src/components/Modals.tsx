import React from 'react';
import { BEACHES, HudSnapshot, formatMoney, formatSand } from '../game/types';

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface PauseModalProps {
  hud: HudSnapshot;
  muted: boolean;
  onResume: () => void;
  onToggleMute: () => void;
  onSelectBeach: (index: number) => void;
  onResetGame: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  hud,
  muted,
  onResume,
  onToggleMute,
  onSelectBeach,
  onResetGame,
}) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#06131C]/80 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#0E2635] border border-white/15 p-6 shadow-2xl">
        <h2 className="font-display text-2xl font-bold text-slate-50">Game Paused</h2>
        <p className="text-sm text-slate-300/80 mt-1">
          {BEACHES[hud.beachIndex].name} · {hud.clearedPercent.toFixed(1)}% cleared
        </p>

        <div className="mt-4 p-3.5 rounded-xl bg-[#081722] border border-white/10 text-xs text-slate-300 space-y-1">
          <p>
            <span className="font-semibold text-amber-300">West Boardwalk Silo:</span> Walk onto
            the pad and press <span className="font-mono-tabular font-bold">E</span> to sell sand.
          </p>
          <p>
            <span className="font-semibold text-teal-300">East Gear Workshop:</span> Walk onto the
            pad and press <span className="font-mono-tabular font-bold">F</span> to buy upgrades.
          </p>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={onToggleMute}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#081722] border border-white/10 text-sm text-slate-100 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <span>Sound Effects</span>
            <span className="font-mono-tabular text-xs font-semibold text-teal-300">
              {muted ? 'Muted' : 'On'}
            </span>
          </button>
        </div>

        {/* Beach Selector */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-slate-300 mb-2">Select Beach Cove</p>
          <div className="space-y-1.5 max-h-44 overflow-y-auto shop-scroll pr-1">
            {BEACHES.map((beach, idx) => {
              const unlocked = idx <= hud.unlockedBeachIndex;
              const active = idx === hud.beachIndex;
              return (
                <button
                  key={beach.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    onSelectBeach(idx);
                    onResume();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-left text-xs transition-colors ${
                    active
                      ? 'bg-teal-600/30 border border-teal-400/50 text-white'
                      : unlocked
                        ? 'bg-[#081722] border border-white/10 text-slate-200 hover:bg-white/10 cursor-pointer'
                        : 'bg-[#081722]/50 border border-white/5 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="font-medium truncate">
                    {idx + 1}. {beach.name}
                  </span>
                  <span className="font-mono-tabular shrink-0 ml-2">
                    {unlocked ? `${beach.valueMultiplier}x $/grain` : 'Locked'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onResetGame}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 border border-rose-400/25 transition-colors cursor-pointer whitespace-nowrap"
          >
            Reset Save
          </button>
          <button
            type="button"
            onClick={onResume}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-display font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  hud: HudSnapshot;
  onNextBeach: () => void;
  onReplayBeach: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  hud,
  onNextBeach,
  onReplayBeach,
}) => {
  const currentBeach = BEACHES[hud.beachIndex];
  const hasNextBeach = hud.beachIndex + 1 < BEACHES.length;
  const nextBeach = hasNextBeach ? BEACHES[hud.beachIndex + 1] : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#06131C]/82 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#0E2635] border border-amber-400/35 p-7 shadow-2xl">
        <p className="text-xs font-semibold text-amber-300 tracking-wide uppercase">
          100% Swept Clean
        </p>
        <h2 className="font-display text-3xl font-extrabold text-slate-50 mt-1">
          {currentBeach.name} Cleared
        </h2>
        <p className="text-sm text-slate-300/85 mt-1.5">
          Every last grain of 3D dune sand has been hauled off the shoreline.
        </p>

        <div className="grid grid-cols-2 gap-3 my-6">
          <div className="p-3.5 rounded-xl bg-[#081722] border border-white/10">
            <div className="text-xs text-slate-400">Clear Time</div>
            <div className="text-lg font-bold font-mono-tabular text-slate-50 mt-0.5">
              {formatTime(hud.elapsedSeconds)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#081722] border border-white/10">
            <div className="text-xs text-slate-400">Cash Earned</div>
            <div className="text-lg font-bold font-mono-tabular text-amber-300 mt-0.5">
              {formatMoney(hud.totalEarnedOnBeach)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#081722] border border-white/10">
            <div className="text-xs text-slate-400">Treasures Found</div>
            <div className="text-lg font-bold font-mono-tabular text-teal-300 mt-0.5">
              {hud.treasuresFound} / {hud.totalTreasures}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#081722] border border-white/10">
            <div className="text-xs text-slate-400">Lifetime Grains</div>
            <div className="text-lg font-bold font-mono-tabular text-slate-50 mt-0.5">
              {formatSand(hud.lifetimeGrainsSwept)}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onReplayBeach}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/16 text-slate-100 text-sm font-semibold border border-white/15 transition-colors cursor-pointer whitespace-nowrap"
          >
            Replay Cove
          </button>
          {nextBeach && (
            <button
              type="button"
              onClick={onNextBeach}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-display font-bold text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              Next: {nextBeach.name}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
