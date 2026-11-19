import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Pause,
  ShoppingBag,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Beach3DEngine } from './game/Beach3DEngine';
import { soundEngine } from './game/audio';
import {
  BASE_GRAIN_PRICE,
  BEACHES,
  GameState,
  HELPERS,
  HelperDef,
  HudSnapshot,
  MARKETS,
  STORAGES,
  TOOLS,
  formatMoney,
  formatSand,
  getHelperCost,
} from './game/types';
import { ToolSvgIcon } from './components/Icons';
import { TitleScreen } from './components/TitleScreen';
import { WorkshopPanel } from './components/WorkshopPanel';
import { PauseModal, VictoryModal } from './components/Modals';

const INITIAL_HUD: HudSnapshot = {
  cash: 0,
  sandHeld: 0,
  bucketCapacity: STORAGES[0].capacity,
  sellValuePerGrain: BASE_GRAIN_PRICE,
  totalSandOnBeach: 3000,
  remainingSand: 3000,
  clearedPercent: 0,
  toolIndex: 0,
  storageIndex: 0,
  marketIndex: 0,
  helperCounts: { crab: 0, beachcomber: 0, sandbot: 0, drone: 0 },
  beachIndex: 0,
  unlockedBeachIndex: 0,
  treasuresFound: 0,
  totalTreasures: BEACHES[0].treasureCount,
  elapsedSeconds: 0,
  totalEarnedOnBeach: 0,
  lifetimeGrainsSwept: 0,
  nearSellZone: false,
  nearShopZone: false,
  isSweeping: false,
};

export default function App() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Beach3DEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [hasSave, setHasSave] = useState(false);
  const [workshopOpen, setWorkshopOpen] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  // Mount isolated 3D WebGL scene once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const engine = new Beach3DEngine(
      container,
      (snap) => setHud(snap),
      (finalSnap) => {
        setHud(finalSnap);
        setWorkshopOpen(false);
        setGameState('VICTORY');
      },
      (lost) => setContextLost(lost)
    );

    engineRef.current = engine;
    setHasSave(engine.hasSavedGame());
    setHud(engine.getSnapshot());
    engine.setAmbientOnly(true);
    engine.startLoop();

    const onResize = () => engine.resize();
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(() => engine.resize());
    ro.observe(container);

    return () => {
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sync game state & workshop pause to engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (gameState === 'TITLE_MENU') {
      engine.setAmbientOnly(true);
      engine.setPaused(false);
    } else if (gameState === 'PLAYING') {
      engine.setAmbientOnly(false);
      engine.setPaused(workshopOpen);
    } else {
      engine.setAmbientOnly(false);
      engine.setPaused(true);
    }
  }, [gameState, workshopOpen]);

  // Close workshop if player somehow leaves the zone
  useEffect(() => {
    if (workshopOpen && !hud.nearShopZone) {
      setWorkshopOpen(false);
    }
  }, [workshopOpen, hud.nearShopZone]);

  const handleStartGame = useCallback(() => {
    soundEngine.unlock();
    setGameState('PLAYING');
  }, []);

  const handleNewGame = useCallback(() => {
    soundEngine.unlock();
    engineRef.current?.resetAllProgress();
    setHasSave(false);
    setWorkshopOpen(false);
    setGameState('PLAYING');
  }, []);

  const handleSellAtStation = useCallback(() => {
    soundEngine.unlock();
    engineRef.current?.sellSandAtStation();
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setMuted(nextMuted);
  }, []);

  const handleBuyTool = useCallback((idx: number) => {
    soundEngine.unlock();
    engineRef.current?.buyTool(idx);
  }, []);

  const handleBuyStorage = useCallback((idx: number) => {
    soundEngine.unlock();
    engineRef.current?.buyStorage(idx);
  }, []);

  const handleBuyMarket = useCallback((idx: number) => {
    soundEngine.unlock();
    engineRef.current?.buyMarket(idx);
  }, []);

  const handleBuyHelper = useCallback((def: HelperDef) => {
    soundEngine.unlock();
    engineRef.current?.buyHelper(def);
  }, []);

  const handleSelectBeach = useCallback((idx: number) => {
    soundEngine.unlock();
    engineRef.current?.setupBeach(idx);
  }, []);

  const handleNextBeach = useCallback(() => {
    soundEngine.unlock();
    const nextIdx = Math.min(BEACHES.length - 1, hud.beachIndex + 1);
    engineRef.current?.setupBeach(nextIdx);
    setGameState('PLAYING');
  }, [hud.beachIndex]);

  const handleReplayBeach = useCallback(() => {
    soundEngine.unlock();
    engineRef.current?.setupBeach(hud.beachIndex);
    setGameState('PLAYING');
  }, [hud.beachIndex]);

  const handleResetProgress = useCallback(() => {
    engineRef.current?.resetAllProgress();
    setHasSave(false);
    setWorkshopOpen(false);
    setGameState('PLAYING');
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (gameState === 'TITLE_MENU') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handleStartGame();
        }
        return;
      }

      if (gameState === 'PLAYING') {
        if (e.code === 'KeyE') {
          e.preventDefault();
          handleSellAtStation();
        } else if (e.code === 'KeyF') {
          if (hud.nearShopZone) {
            e.preventDefault();
            setWorkshopOpen((prev) => !prev);
          }
        } else if (e.code === 'KeyH') {
          e.preventDefault();
          setDockCollapsed((prev) => !prev);
        } else if (e.code === 'KeyM') {
          e.preventDefault();
          handleToggleMute();
        } else if (e.code === 'Escape') {
          e.preventDefault();
          if (workshopOpen) {
            setWorkshopOpen(false);
          } else {
            setGameState('PAUSED');
          }
        }
        return;
      }

      if (gameState === 'PAUSED') {
        if (e.code === 'Escape') {
          e.preventDefault();
          setGameState('PLAYING');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gameState,
    workshopOpen,
    hud.nearShopZone,
    handleStartGame,
    handleSellAtStation,
    handleToggleMute,
  ]);

  const affordableUpgradeCount = useMemo(() => {
    let count = 0;
    if (hud.toolIndex + 1 < TOOLS.length && hud.cash >= TOOLS[hud.toolIndex + 1].cost) count++;
    if (hud.storageIndex + 1 < STORAGES.length && hud.cash >= STORAGES[hud.storageIndex + 1].cost)
      count++;
    if (hud.marketIndex + 1 < MARKETS.length && hud.cash >= MARKETS[hud.marketIndex + 1].cost)
      count++;
    for (const h of HELPERS) {
      const owned = hud.helperCounts[h.id] || 0;
      if (owned < h.maxCount && hud.cash >= getHelperCost(h, owned)) {
        count++;
      }
    }
    return count;
  }, [hud]);

  const currentBeach = BEACHES[hud.beachIndex];
  const currentTool = TOOLS[hud.toolIndex];
  const currentStorage = STORAGES[hud.storageIndex];
  const bucketRatio = Math.min(1, hud.sandHeld / Math.max(1, hud.bucketCapacity));
  const isBucketFull = hud.sandHeld >= hud.bucketCapacity - 0.5;
  const sellPayout =
    hud.sandHeld >= 0.5 ? Math.max(1, Math.round(hud.sandHeld * hud.sellValuePerGrain)) : 0;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#93D5EB]">
      {/* Isolated WebGL 3D Viewport */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Graceful WebGL Context Loss Fallback */}
      {contextLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C2231] text-slate-100 p-6">
          <div className="max-w-sm text-center">
            <h2 className="font-display text-xl font-bold">3D Graphics Context Paused</h2>
            <p className="text-sm text-slate-300 mt-2">
              Waiting for the browser WebGL context to restore.
            </p>
          </div>
        </div>
      )}

      {/* Title Screen */}
      {gameState === 'TITLE_MENU' && (
        <TitleScreen
          hasSave={hasSave}
          onStart={handleStartGame}
          onNewGame={handleNewGame}
        />
      )}

      {/* Minimal Top-Left Beach Progress Badge */}
      {gameState !== 'TITLE_MENU' && (
        <div className="pointer-events-none fixed top-4 left-4 z-10">
          <div className="pointer-events-auto rounded-xl bg-[#0B202E]/92 border border-white/12 px-4 py-2.5 min-w-[230px] shadow-lg">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-sm font-bold text-slate-50 truncate">
                {currentBeach.name}
              </span>
              <span className="font-mono-tabular text-xs font-bold text-teal-300 shrink-0">
                {hud.clearedPercent.toFixed(1)}% swept
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full rounded-full bg-[#06131C] overflow-hidden">
              <div
                className="h-full bg-teal-400 transition-[width] duration-150"
                style={{ width: `${Math.min(100, hud.clearedPercent)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-300/85 font-mono-tabular">
              <span>{formatSand(Math.ceil(hud.remainingSand))} grains left</span>
              <span>
                Treasures {hud.treasuresFound}/{hud.totalTreasures}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Spatial Contextual Station Prompt (Center-Bottom above dock) */}
      {gameState === 'PLAYING' && !workshopOpen && (hud.nearSellZone || hud.nearShopZone) && (
        <div className="pointer-events-none fixed bottom-28 left-1/2 -translate-x-1/2 z-20">
          {hud.nearSellZone && (
            <button
              type="button"
              disabled={sellPayout <= 0}
              onClick={handleSellAtStation}
              className={`pointer-events-auto px-5 py-2.5 rounded-xl font-display font-bold text-sm shadow-xl transition-transform cursor-pointer whitespace-nowrap ${
                sellPayout > 0
                  ? 'bg-orange-500 hover:bg-orange-400 text-slate-950 active:scale-95'
                  : 'bg-[#0B202E]/95 border border-amber-400/40 text-amber-200 cursor-default'
              }`}
            >
              {sellPayout > 0
                ? `Sell ${formatSand(hud.sandHeld)} Sand (+${formatMoney(sellPayout)}) [E]`
                : 'Sell Silo — Sweep Sand First'}
            </button>
          )}

          {hud.nearShopZone && (
            <button
              type="button"
              onClick={() => setWorkshopOpen(true)}
              className="pointer-events-auto px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-display font-bold text-sm shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                Open Gear Workshop [F]
                {affordableUpgradeCount > 0 ? ` · ${affordableUpgradeCount} Ready` : ''}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Collapsible Unified Bottom Control Dock */}
      {gameState !== 'TITLE_MENU' && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-10 w-[min(920px,95vw)] transition-transform duration-200 ${
            dockCollapsed ? 'translate-y-[calc(100%-26px)]' : 'translate-y-0'
          }`}
        >
          {/* Collapse / Expand Tab */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setDockCollapsed((prev) => !prev)}
              className="px-3 py-1 rounded-t-lg bg-[#0B202E]/92 border border-b-0 border-white/12 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {dockCollapsed ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> Show HUD (H)
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> Hide HUD (H)
                </>
              )}
            </button>
          </div>

          {/* Main Dock Bar (solid dark coastal slate, zero backdrop-filter) */}
          <div className="rounded-2xl bg-[#0B202E]/95 border border-white/14 px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3">
            {/* Tool & Controls Status */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#071620] border border-white/10 flex items-center justify-center shrink-0">
                <ToolSvgIcon toolId={currentTool.id} className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-100 truncate">
                  {currentTool.name}
                </div>
                <div className="text-[11px] font-mono-tabular text-slate-300/80 truncate">
                  {isBucketFull
                    ? 'Backpack Full · Walk to West Sell Silo'
                    : affordableUpgradeCount > 0 && !hud.nearShopZone
                      ? `${affordableUpgradeCount} Upgrade Ready · Walk to East Workshop`
                      : 'WASD / Drag Move · Space / Hold Click Sweep'}
                </div>
              </div>
            </div>

            {/* Cash & Backpack Fill */}
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Cash
                </div>
                <div className="font-mono-tabular text-base font-bold text-amber-300 leading-tight">
                  {formatMoney(hud.cash)}
                </div>
              </div>

              <div className="h-7 w-px bg-white/12" />

              <div className="min-w-[125px]">
                <div className="flex items-center justify-between text-[10px] font-medium text-slate-300">
                  <span className="truncate max-w-[76px]">
                    {currentStorage.name.split(' ').slice(-1)[0]}
                  </span>
                  <span
                    className={`font-mono-tabular font-bold ${
                      isBucketFull ? 'text-orange-400' : 'text-slate-200'
                    }`}
                  >
                    {isBucketFull ? 'FULL' : `${Math.round(bucketRatio * 100)}%`}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-[#06131C] overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-100 ${
                      isBucketFull ? 'bg-orange-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${bucketRatio * 100}%` }}
                  />
                </div>
                <div className="mt-0.5 text-[10px] font-mono-tabular text-slate-400">
                  {formatSand(hud.sandHeld)} / {formatSand(hud.bucketCapacity)}
                </div>
              </div>

              {/* Mute & Pause */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  aria-label={muted ? 'Unmute sound' : 'Mute sound'}
                  title={muted ? 'Unmute (M)' : 'Mute (M)'}
                  className="w-9 h-9 rounded-lg bg-[#071620] border border-white/10 text-slate-200 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setGameState('PAUSED')}
                  aria-label="Pause game"
                  title="Pause (Esc)"
                  className="w-9 h-9 rounded-lg bg-[#071620] border border-white/10 text-slate-200 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Pause className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gear Workshop Modal (Only accessible when standing at East Shack) */}
      {workshopOpen && gameState === 'PLAYING' && hud.nearShopZone && (
        <WorkshopPanel
          hud={hud}
          onClose={() => setWorkshopOpen(false)}
          onBuyTool={handleBuyTool}
          onBuyStorage={handleBuyStorage}
          onBuyMarket={handleBuyMarket}
          onBuyHelper={handleBuyHelper}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          hud={hud}
          muted={muted}
          onResume={() => setGameState('PLAYING')}
          onToggleMute={handleToggleMute}
          onSelectBeach={handleSelectBeach}
          onResetGame={handleResetProgress}
        />
      )}

      {/* Victory Modal */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          hud={hud}
          onNextBeach={handleNextBeach}
          onReplayBeach={handleReplayBeach}
        />
      )}
    </main>
  );
}
