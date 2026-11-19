import React, { useState } from 'react';
import { X, Check, Lock } from 'lucide-react';
import {
  HELPERS,
  HudSnapshot,
  MARKETS,
  STORAGES,
  TOOLS,
  formatMoney,
  formatSand,
  getHelperCost,
  HelperDef,
} from '../game/types';
import { HelperSvgIcon, ToolSvgIcon } from './Icons';

type ShopTab = 'tools' | 'bucket' | 'crew';

interface WorkshopPanelProps {
  hud: HudSnapshot;
  onClose: () => void;
  onBuyTool: (index: number) => void;
  onBuyStorage: (index: number) => void;
  onBuyMarket: (index: number) => void;
  onBuyHelper: (def: HelperDef) => void;
}

export const WorkshopPanel: React.FC<WorkshopPanelProps> = ({
  hud,
  onClose,
  onBuyTool,
  onBuyStorage,
  onBuyMarket,
  onBuyHelper,
}) => {
  const [tab, setTab] = useState<ShopTab>('tools');

  const nextToolAvailable =
    hud.toolIndex + 1 < TOOLS.length && hud.cash >= TOOLS[hud.toolIndex + 1].cost;
  const nextBucketAvailable =
    (hud.storageIndex + 1 < STORAGES.length && hud.cash >= STORAGES[hud.storageIndex + 1].cost) ||
    (hud.marketIndex + 1 < MARKETS.length && hud.cash >= MARKETS[hud.marketIndex + 1].cost);
  const crewAvailable = HELPERS.some((h) => {
    const c = hud.helperCounts[h.id] || 0;
    return c < h.maxCount && hud.cash >= getHelperCost(h, c);
  });

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#06131C]/70 p-4">
      <section
        aria-label="Gear Workshop"
        className="w-full max-w-lg max-h-[82vh] rounded-2xl bg-[#0D2332] border border-teal-400/35 flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-50 leading-tight">
              Gear & Crew Workshop
            </h2>
            <p className="text-xs text-slate-300/80 font-mono-tabular mt-0.5">
              Cash: {formatMoney(hud.cash)} · Rate: {formatMoney(hud.sellValuePerGrain)}/grain
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close workshop"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="px-5 pt-3 pb-2">
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#081722] rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setTab('tools')}
              className={`px-2 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'tools' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Tools{nextToolAvailable ? ' •' : ''}
            </button>
            <button
              type="button"
              onClick={() => setTab('bucket')}
              className={`px-2 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'bucket' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Pack & Market{nextBucketAvailable ? ' •' : ''}
            </button>
            <button
              type="button"
              onClick={() => setTab('crew')}
              className={`px-2 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'crew' ? 'bg-teal-600 text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              Crew{crewAvailable ? ' •' : ''}
            </button>
          </div>
        </div>

        {/* Upgrade Items */}
        <div className="flex-1 overflow-y-auto shop-scroll px-5 py-3 space-y-3">
          {tab === 'tools' &&
            TOOLS.map((tool, idx) => {
              const owned = idx <= hud.toolIndex;
              const isEquipped = idx === hud.toolIndex;
              const isNext = idx === hud.toolIndex + 1;
              const canBuy = isNext && hud.cash >= tool.cost;

              return (
                <div
                  key={tool.id}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isEquipped
                      ? 'bg-teal-950/60 border-teal-500/45'
                      : isNext
                        ? 'bg-[#122D3F] border-white/15'
                        : 'bg-[#0A1D2A] border-white/8 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg bg-[#081722] border border-white/10 flex items-center justify-center shrink-0">
                      <ToolSvgIcon toolId={tool.id} className="w-8 h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-100 truncate">
                          {tool.name}
                        </h3>
                        {isEquipped && (
                          <span className="text-[11px] font-semibold text-teal-300 shrink-0">
                            Equipped
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300/75 mt-0.5 leading-snug">
                        {tool.description}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-2.5">
                        <span className="text-xs font-mono-tabular text-slate-300">
                          {tool.radius.toFixed(1)}m swath · {tool.power} pwr
                        </span>
                        {owned ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-300">
                            <Check className="w-3.5 h-3.5" /> Owned
                          </span>
                        ) : isNext ? (
                          <button
                            type="button"
                            disabled={!canBuy}
                            onClick={() => onBuyTool(idx)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono-tabular transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                              canBuy
                                ? 'bg-orange-500 hover:bg-orange-400 text-slate-950 active:scale-95'
                                : 'bg-white/10 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Buy {formatMoney(tool.cost)}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono-tabular">
                            <Lock className="w-3 h-3" /> {formatMoney(tool.cost)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

          {tab === 'bucket' && (
            <>
              <div className="pb-2">
                <h3 className="text-xs font-semibold text-teal-300 mb-2">
                  Backpack & Haul Capacity
                </h3>
                <div className="space-y-2.5">
                  {STORAGES.map((st, idx) => {
                    const owned = idx <= hud.storageIndex;
                    const isCurrent = idx === hud.storageIndex;
                    const isNext = idx === hud.storageIndex + 1;
                    const canBuy = isNext && hud.cash >= st.cost;

                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-xl border ${
                          isCurrent
                            ? 'bg-teal-950/60 border-teal-500/45'
                            : isNext
                              ? 'bg-[#122D3F] border-white/15'
                              : 'bg-[#0A1D2A] border-white/8 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-100 truncate">
                            {st.name}
                          </span>
                          <span className="text-xs font-mono-tabular text-amber-300 shrink-0">
                            {formatSand(st.capacity)} cap
                          </span>
                        </div>
                        <p className="text-xs text-slate-300/75 mt-1">{st.description}</p>
                        <div className="mt-2.5 flex justify-end">
                          {owned ? (
                            <span className="text-xs font-medium text-teal-300">
                              {isCurrent ? 'In Use' : 'Owned'}
                            </span>
                          ) : isNext ? (
                            <button
                              type="button"
                              disabled={!canBuy}
                              onClick={() => onBuyStorage(idx)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono-tabular transition-all cursor-pointer whitespace-nowrap ${
                                canBuy
                                  ? 'bg-orange-500 hover:bg-orange-400 text-slate-950 active:scale-95'
                                  : 'bg-white/10 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              Buy {formatMoney(st.cost)}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono-tabular">
                              Locked · {formatMoney(st.cost)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <h3 className="text-xs font-semibold text-amber-300 mb-2">
                  Sand Market Contracts
                </h3>
                <div className="space-y-2.5">
                  {MARKETS.map((mk, idx) => {
                    const owned = idx <= hud.marketIndex;
                    const isCurrent = idx === hud.marketIndex;
                    const isNext = idx === hud.marketIndex + 1;
                    const canBuy = isNext && hud.cash >= mk.cost;

                    return (
                      <div
                        key={mk.id}
                        className={`p-3 rounded-xl border ${
                          isCurrent
                            ? 'bg-amber-950/35 border-amber-500/45'
                            : isNext
                              ? 'bg-[#122D3F] border-white/15'
                              : 'bg-[#0A1D2A] border-white/8 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-100 truncate">
                            {mk.name}
                          </span>
                          <span className="text-xs font-mono-tabular text-amber-300 shrink-0">
                            {mk.multiplier}x price
                          </span>
                        </div>
                        <p className="text-xs text-slate-300/75 mt-1">{mk.description}</p>
                        <div className="mt-2.5 flex justify-end">
                          {owned ? (
                            <span className="text-xs font-medium text-amber-300">
                              {isCurrent ? 'Active Contract' : 'Owned'}
                            </span>
                          ) : isNext ? (
                            <button
                              type="button"
                              disabled={!canBuy}
                              onClick={() => onBuyMarket(idx)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono-tabular transition-all cursor-pointer whitespace-nowrap ${
                                canBuy
                                  ? 'bg-orange-500 hover:bg-orange-400 text-slate-950 active:scale-95'
                                  : 'bg-white/10 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              Sign {formatMoney(mk.cost)}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono-tabular">
                              Locked · {formatMoney(mk.cost)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab === 'crew' &&
            HELPERS.map((helper) => {
              const count = hud.helperCounts[helper.id] || 0;
              const maxed = count >= helper.maxCount;
              const cost = getHelperCost(helper, count);
              const canBuy = !maxed && hud.cash >= cost;

              return (
                <div
                  key={helper.id}
                  className="p-3.5 rounded-xl bg-[#122D3F] border border-white/12"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#081722] border border-white/10 flex items-center justify-center shrink-0">
                      <HelperSvgIcon helperId={helper.id} className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-100 truncate">
                          {helper.name}
                        </h3>
                        <span className="text-xs font-mono-tabular text-teal-300 shrink-0">
                          {count}/{helper.maxCount}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300/75 mt-0.5 leading-snug">
                        {helper.description}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-2.5">
                        <span className="text-xs font-mono-tabular text-slate-300">
                          {helper.sweepPower} pwr · {helper.sweepRadius}m
                        </span>
                        {maxed ? (
                          <span className="text-xs font-semibold text-teal-300">Max Crew</span>
                        ) : (
                          <button
                            type="button"
                            disabled={!canBuy}
                            onClick={() => onBuyHelper(helper)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono-tabular transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                              canBuy
                                ? 'bg-orange-500 hover:bg-orange-400 text-slate-950 active:scale-95'
                                : 'bg-white/10 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            Hire {formatMoney(cost)}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
};
