export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'VICTORY';

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  radius: number; // world meters on 3D beach
  power: number; // sand depth removed per second while sweeping
  color: string;
  accent: string;
}

export interface StorageDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  capacity: number;
}

export interface MarketDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplier: number;
}

export interface HelperDef {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costScale: number;
  maxCount: number;
  sweepRadius: number;
  sweepPower: number;
  speed: number;
}

export interface BeachDef {
  id: string;
  name: string;
  subtitle: string;
  minDepth: number;
  maxDepth: number;
  valueMultiplier: number;
  treasureCount: number;
  treasureBaseValue: number;
  sandHex: number;
  sandDeepHex: number;
  waterHex: number;
}

export interface HudSnapshot {
  cash: number;
  sandHeld: number;
  bucketCapacity: number;
  sellValuePerGrain: number;
  totalSandOnBeach: number;
  remainingSand: number;
  clearedPercent: number;
  toolIndex: number;
  storageIndex: number;
  marketIndex: number;
  helperCounts: Record<string, number>;
  beachIndex: number;
  unlockedBeachIndex: number;
  treasuresFound: number;
  totalTreasures: number;
  elapsedSeconds: number;
  totalEarnedOnBeach: number;
  lifetimeGrainsSwept: number;
  nearSellZone: boolean;
  nearShopZone: boolean;
  isSweeping: boolean;
}

export const BASE_GRAIN_PRICE = 0.28;

export const TOOLS: ToolDef[] = [
  {
    id: 'toothbrush',
    name: 'Travel Toothbrush',
    description: 'Soft nylon bristles. Tiny swath—takes real grit on deep dunes.',
    cost: 0,
    radius: 1.15,
    power: 14,
    color: '#F43F5E',
    accent: '#FFF1F2',
  },
  {
    id: 'whisk_broom',
    name: 'Straw Whisk Broom',
    description: 'Hand-tied corn bristles that clear wider sandy paths.',
    cost: 24,
    radius: 1.65,
    power: 28,
    color: '#D97706',
    accent: '#FEF3C7',
  },
  {
    id: 'push_broom',
    name: 'Boardwalk Push Broom',
    description: 'Wide hardwood head built for sweeping clean beach lanes.',
    cost: 110,
    radius: 2.35,
    power: 62,
    color: '#0D9488',
    accent: '#CCFBF1',
  },
  {
    id: 'sand_scoop',
    name: 'Aluminum Sand Scoop',
    description: 'Beveled metal scoop that carves down deep coastal drifts.',
    cost: 420,
    radius: 3.1,
    power: 140,
    color: '#64748B',
    accent: '#E2E8F0',
  },
  {
    id: 'leaf_blower',
    name: 'Gas Leaf Blower',
    description: 'High-velocity air nozzle blasting wide dunes clean.',
    cost: 1650,
    radius: 4.0,
    power: 320,
    color: '#EA580C',
    accent: '#FFEDD5',
  },
  {
    id: 'street_sweeper',
    name: 'Rotary Street Sweeper',
    description: 'Counter-rotating twin brushes for industrial cove clearing.',
    cost: 6800,
    radius: 5.0,
    power: 750,
    color: '#EAB308',
    accent: '#FEF9C3',
  },
  {
    id: 'sand_dozer',
    name: 'Mini Sand Bulldozer',
    description: 'Heavy coastal scraper blade that flattens towering dunes.',
    cost: 26000,
    radius: 6.2,
    power: 1750,
    color: '#F59E0B',
    accent: '#1E293B',
  },
  {
    id: 'solar_vacuum',
    name: 'Solar Vortex Vacuum',
    description: 'Cyclone intake rig capable of clearing entire bays fast.',
    cost: 95000,
    radius: 7.8,
    power: 4200,
    color: '#0284C7',
    accent: '#E0F2FE',
  },
];

export const STORAGES: StorageDef[] = [
  {
    id: 'sand_pail',
    name: 'Plastic Sand Pail',
    description: 'Small seaside bucket. Frequent trips back to the Sell Hopper.',
    cost: 0,
    capacity: 25,
  },
  {
    id: 'hardware_bucket',
    name: '5-Gallon Hardware Bucket',
    description: 'Sturdy polymer pail for longer sweeping runs.',
    cost: 28,
    capacity: 90,
  },
  {
    id: 'wheelbarrow',
    name: 'Contractor Wheelbarrow',
    description: 'Deep steel hopper strapped cleanly to your rig.',
    cost: 145,
    capacity: 360,
  },
  {
    id: 'tow_cart',
    name: 'Towable Beach Cart',
    description: 'Balloon-tire dune trailer with generous sand volume.',
    cost: 680,
    capacity: 1500,
  },
  {
    id: 'dumper_truck',
    name: 'Sand Dumper Pack',
    description: 'Pressurized coastal hopper for massive loads.',
    cost: 3400,
    capacity: 7500,
  },
  {
    id: 'silo_barge',
    name: 'Quantum Sand Compactor',
    description: 'High-density containment cylinder for full-dune hauls.',
    cost: 18000,
    capacity: 42000,
  },
];

export const MARKETS: MarketDef[] = [
  {
    id: 'roadside_stand',
    name: 'Pier Bucket Weigher',
    description: 'Basic coastal sand rate at the boardwalk hopper.',
    cost: 0,
    multiplier: 1.0,
  },
  {
    id: 'quartz_sifter',
    name: 'Quartz Sand Sifter',
    description: 'Fine mesh grading separates clean white silica.',
    cost: 45,
    multiplier: 1.65,
  },
  {
    id: 'glassworks',
    name: 'Local Glassworks Buyer',
    description: 'Harbor kilns pay extra for graded beach silica.',
    cost: 240,
    multiplier: 2.9,
  },
  {
    id: 'silicon_foundry',
    name: 'Silicon Foundry Contract',
    description: 'Refined mineral supply agreement for coastal labs.',
    cost: 1150,
    multiplier: 5.8,
  },
  {
    id: 'hourglass_export',
    name: 'Artisanal Hourglass Export',
    description: 'Precision-sorted grains prized by instrument makers.',
    cost: 5500,
    multiplier: 12.5,
  },
  {
    id: 'crystal_refinery',
    name: 'Optical Crystal Refinery',
    description: 'Top-tier mineral refining for maximum payout per grain.',
    cost: 26000,
    multiplier: 28.0,
  },
];

export const HELPERS: HelperDef[] = [
  {
    id: 'crab',
    name: 'Trained Hermit Crab',
    description: 'Scuttles across the dunes and hauls sand back to the Sell Silo.',
    baseCost: 65,
    costScale: 1.5,
    maxCount: 6,
    sweepRadius: 1.3,
    sweepPower: 5,
    speed: 3.6,
  },
  {
    id: 'beachcomber',
    name: 'Boardwalk Helper',
    description: 'Runs across dunes sweeping sand and banking cash at the Silo.',
    baseCost: 340,
    costScale: 1.55,
    maxCount: 5,
    sweepRadius: 2.0,
    sweepPower: 20,
    speed: 5.2,
  },
  {
    id: 'sandbot',
    name: 'Solar Sand-Bot',
    description: 'Tracked autonomous rover sweeping and delivering dunes directly.',
    baseCost: 1900,
    costScale: 1.6,
    maxCount: 5,
    sweepRadius: 2.8,
    sweepPower: 85,
    speed: 6.4,
  },
  {
    id: 'drone',
    name: 'Shoreline Vortex Drone',
    description: 'Hovering quad-rotor clearing high dunes and piping to the Silo.',
    baseCost: 9800,
    costScale: 1.65,
    maxCount: 4,
    sweepRadius: 3.8,
    sweepPower: 340,
    speed: 8.5,
  },
];

export const BEACHES: BeachDef[] = [
  {
    id: 'pebble_cove',
    name: 'Pebble Cove',
    subtitle: 'Sunlit morning cove with rolling golden dunes over limestone stone',
    minDepth: 1.2,
    maxDepth: 5.5,
    valueMultiplier: 1.0,
    treasureCount: 8,
    treasureBaseValue: 16,
    sandHex: 0xf4d58d,
    sandDeepHex: 0xd9a857,
    waterHex: 0x0e9aa7,
  },
  {
    id: 'shellfish_bay',
    name: 'Shellfish Bay',
    subtitle: 'Deep coastal drifts packed over harbor cobbles',
    minDepth: 5.0,
    maxDepth: 22,
    valueMultiplier: 2.6,
    treasureCount: 10,
    treasureBaseValue: 65,
    sandHex: 0xf6de9f,
    sandDeepHex: 0xcf9347,
    waterHex: 0x0c879e,
  },
  {
    id: 'driftwood_point',
    name: 'Driftwood Point',
    subtitle: 'High wind-carved sandbanks along a cedar headland',
    minDepth: 20,
    maxDepth: 85,
    valueMultiplier: 6.8,
    treasureCount: 12,
    treasureBaseValue: 260,
    sandHex: 0xefc988,
    sandDeepHex: 0xb97d3c,
    waterHex: 0x0a7690,
  },
  {
    id: 'coral_shoals',
    name: 'Coral Shoals',
    subtitle: 'Dense ivory silica dunes above a bright turquoise reef shelf',
    minDepth: 95,
    maxDepth: 340,
    valueMultiplier: 17,
    treasureCount: 14,
    treasureBaseValue: 1100,
    sandHex: 0xf9ebd0,
    sandDeepHex: 0xd8b882,
    waterHex: 0x0d9488,
  },
  {
    id: 'mirage_atoll',
    name: 'Golden Mirage Atoll',
    subtitle: 'Towering amber dunes rich with optical quartz grains',
    minDepth: 420,
    maxDepth: 1450,
    valueMultiplier: 48,
    treasureCount: 18,
    treasureBaseValue: 4800,
    sandHex: 0xf5cf7d,
    sandDeepHex: 0xc28024,
    waterHex: 0x0369a1,
  },
];

export function getHelperCost(def: HelperDef, count: number): number {
  return Math.round(def.baseCost * Math.pow(def.costScale, count));
}

export function formatMoney(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 10_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${Math.floor(amount).toLocaleString('en-US')}`;
}

export function formatSand(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 10_000) return `${(amount / 1_000).toFixed(1)}K`;
  return Math.floor(amount).toLocaleString('en-US');
}
