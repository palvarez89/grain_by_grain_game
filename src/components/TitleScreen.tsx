import React from 'react';
import { TitleEmblem } from './Icons';

interface TitleScreenProps {
  hasSave: boolean;
  onStart: () => void;
  onNewGame: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ hasSave, onStart, onNewGame }) => {
  return (
    <div className="absolute inset-0 z-20 flex items-center bg-gradient-to-r from-[#091D2A]/90 via-[#091D2A]/62 to-transparent px-6 sm:px-14 lg:px-24">
      <div className="max-w-xl">
        <div className="flex items-center gap-4 mb-5">
          <TitleEmblem className="w-16 h-16 shrink-0" />
          <div>
            <p className="text-xs font-medium tracking-wider text-teal-300/90 uppercase">
              3D Coastal Incremental
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-50 leading-none">
              Grain by Grain
            </h1>
          </div>
        </div>

        <p className="text-base sm:text-lg text-slate-200/90 leading-relaxed mb-8 max-w-md">
          Carve away towering 3D sand dunes starting with a toothbrush. Haul full buckets back to
          the Sell Silo, then walk to the Gear Workshop for better tools.
        </p>

        <div className="flex flex-wrap items-center gap-3 mb-7">
          <button
            type="button"
            onClick={onStart}
            className="px-7 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 active:scale-[0.98] text-slate-950 font-display font-bold text-base tracking-tight transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
          >
            {hasSave ? 'Continue Sweeping' : 'Start Sweeping'}
          </button>

          {hasSave && (
            <button
              type="button"
              onClick={onNewGame}
              className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/18 active:scale-[0.98] text-slate-100 font-medium text-sm border border-white/15 transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
            >
              New Beach
            </button>
          )}
        </div>

        <p className="text-xs sm:text-sm text-slate-300/85 font-mono-tabular">
          WASD / Drag Move · Space / Hold Click Sweep · E Sell at Silo · F Workshop · Esc Pause
        </p>
      </div>
    </div>
  );
};
