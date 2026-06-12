/*
 * Million Monkeys — Act 1 economy simulation (first 15 minutes, optimal play)
 * Round 2: models the SHIPPED constants (post-retune, branch act1-economy-retune)
 * Mirrors logic in src/components/Feed.jsx, src/App.jsx, src/economy.js, src/scripting.js
 *
 * Shipped reality being mirrored:
 *  - monkeys $30 base, 1.30x mult (costBasis counts BOUGHT only; bred are free)
 *  - caffeine $60 base, 2.0x mult, +10% detection per tier (1.1^n), wired in Feed.jsx
 *  - DOLLARS_PER_WORD = 2
 *  - Feed tick: rand>0.97 newline | >0.82 space | >0.72 real word | else gibberish
 *  - detectChance = 0.10 * (scaledInterval*M/40) * 1.1^caffeine  (linear in M)
 *  - no combo income (combo is celebration only)
 *  - 5s same-word dedup in handleWordDetected
 *  - breeding: unlock at 8 monkeys, interval = max(60000/max(1,floor(M/2)), 15000)
 *  - scripted gems at 2/4/6/10/15/20/28s give +1 word each; 35s near-miss gives 0
 */

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DICT_SIZE = 9884;

const SHIPPED = {
  name: 'PRE-ROUND-2 (1.30x, no mid-tier)',
  startMoney: 30,
  monkeyBaseCost: 30,
  monkeyCostMult: 1.30,
  caffeineBaseCost: 60,
  caffeineCostMult: 2.0,
  caffeineDetectMult: 1.1,
  baseCharIntervalMs: 40,
  detectChance: 0.10,
  wordValue: 2,
  breedingUnlockMonkeys: 8,
  breedingBaseIntervalMs: 60000,
  breedingMinIntervalMs: 15000,
  scriptedTimes: [2000, 4000, 6000, 10000, 15000, 20000, 28000], // near-miss at 35s gives 0
  // mid-tier item (off by default)
  ribbon: null, // { baseCost, costMult, detectMult, maxCount }
};

const FIX_CURVE = { ...SHIPPED, name: 'FIX A1: monkey costMult 1.25' };

const FIX_RIBBON = {
  ...SHIPPED,
  name: 'FIX A2: mid-tier Fresh Ribbon ($50, 1.5x, +8%/ea)',
  ribbon: { baseCost: 50, costMult: 1.5, detectMult: 1.08, maxCount: Infinity },
};

const VARIANTS = [
  { ...FIX_CURVE, monkeyCostMult: 1.25 },
  FIX_RIBBON,
  { ...SHIPPED, name: 'FIX A2b: Ribbon $45, 1.6x, +10%/ea', ribbon: { baseCost: 45, costMult: 1.6, detectMult: 1.10, maxCount: Infinity } },
  { ...SHIPPED, name: 'FIX A2c: Ribbon $50, 1.5x, +8%/ea + mult 1.28', monkeyCostMult: 1.28, ribbon: { baseCost: 50, costMult: 1.5, detectMult: 1.08, maxCount: Infinity } },
  { ...FIX_CURVE, monkeyCostMult: 1.27, name: 'FIX A1b: monkey costMult 1.27' },
  // Stress: model the playtest's throttled income (issue C) at ~50% of nominal
  { ...SHIPPED, name: 'STRESS: shipped @ 50% income (playtest conditions)', detectChance: 0.05 },
  { ...SHIPPED, name: 'STRESS: 1.25x @ 50% income', detectChance: 0.05, monkeyCostMult: 1.25 },
];

function tickIntervalMs(cfg, M) {
  const b = cfg.baseCharIntervalMs;
  let s;
  if (M < 10) s = b / M;
  else if (M < 100) s = b / (M * 2);
  else if (M < 1000) s = b / (M * 5);
  else s = b / (M * 10);
  return Math.max(s, 1);
}

function simulate(cfg, seed, minutes = 15) {
  const rand = mulberry32(seed);
  const END = minutes * 60000;
  let t = 0;
  let money = cfg.startMoney;
  let words = 0;
  let monkeysBought = 0, monkeysBred = 0;
  let caffeine = 0, ribbons = 0;
  let purchases = [];
  let lastBreed = 0;
  let recentWords = [];
  let scriptedDone = new Set();
  let wordsHarvested = 0, moneyEarnedTotal = 0;
  const minuteRows = [];

  const M = () => monkeysBought + monkeysBred;
  const monkeyCost = () => Math.round(cfg.monkeyBaseCost * Math.pow(cfg.monkeyCostMult, monkeysBought));
  const caffCost = () => Math.round(cfg.caffeineBaseCost * Math.pow(cfg.caffeineCostMult, caffeine));
  const ribbonCost = () => cfg.ribbon ? Math.round(cfg.ribbon.baseCost * Math.pow(cfg.ribbon.costMult, ribbons)) : Infinity;
  const sellAll = () => { const v = words * cfg.wordValue; money += v; moneyEarnedTotal += v; words = 0; };

  const effDetect = (m, c, rb) => {
    const dt = tickIntervalMs(cfg, m);
    let p = cfg.detectChance * ((dt * m) / cfg.baseCharIntervalMs) * Math.pow(cfg.caffeineDetectMult, c);
    if (cfg.ribbon) p *= Math.pow(cfg.ribbon.detectMult, rb);
    return Math.min(1, p);
  };
  const incomePerSec = (m, c, rb) => {
    if (m === 0) return 0;
    const tps = 1000 / tickIntervalMs(cfg, m);
    return tps * 0.10 /* real word chance */ * effDetect(m, c, rb) * cfg.wordValue;
  };

  const tryBuy = () => {
    for (;;) {
      const mc = monkeyCost(), cc = caffCost(), rc = ribbonCost();
      const wealth = money + words * cfg.wordValue;
      const base = incomePerSec(M(), caffeine, ribbons);
      const mROI = (incomePerSec(M() + 1, caffeine, ribbons) - base) / mc;
      const cROI = M() > 0 ? (incomePerSec(M(), caffeine + 1, ribbons) - base) / cc : 0;
      const rROI = M() > 0 && cfg.ribbon && ribbons < cfg.ribbon.maxCount
        ? (incomePerSec(M(), caffeine, ribbons + 1) - base) / rc : 0;
      let pick = null;
      if (M() === 0) pick = wealth >= mc ? 'monkey' : null;
      else {
        // best affordable ROI
        const opts = [
          { k: 'monkey', roi: mROI, cost: mc },
          { k: 'caffeine', roi: cROI, cost: cc },
          { k: 'ribbon', roi: rROI, cost: rc },
        ].filter(o => o.roi > 0 && wealth >= o.cost).sort((a, b) => b.roi - a.roi);
        pick = opts[0]?.k ?? null;
      }
      if (!pick) break;
      sellAll();
      if (pick === 'monkey') { const c = monkeyCost(); money -= c; monkeysBought++; purchases.push({ t, what: `Monkey #${monkeysBought}`, cost: c }); }
      else if (pick === 'caffeine') { const c = caffCost(); money -= c; caffeine++; purchases.push({ t, what: `Caffeine #${caffeine}`, cost: c }); }
      else { const c = ribbonCost(); money -= c; ribbons++; purchases.push({ t, what: `Ribbon #${ribbons}`, cost: c }); }
    }
  };

  let nextMinute = 60000;
  let breedingUnlocked = false;

  while (t < END) {
    tryBuy();
    const m = M();
    const dt = m > 0 ? tickIntervalMs(cfg, m) : 100;
    t += dt;

    while (t >= nextMinute && nextMinute <= END) {
      minuteRows.push({
        min: nextMinute / 60000, money: Math.round(money + words * cfg.wordValue),
        earned: Math.round(moneyEarnedTotal), monkeys: M(), bought: monkeysBought,
        bred: monkeysBred, caffeine, ribbons, purchases: purchases.length, wordsHarvested,
        nextMonkeyCost: monkeyCost(),
        incomePerMin: Math.round(incomePerSec(M(), caffeine, ribbons) * 60),
      });
      nextMinute += 60000;
    }
    if (m === 0) continue;

    for (const st of cfg.scriptedTimes) {
      if (t >= st && !scriptedDone.has(st)) { scriptedDone.add(st); words += 1; wordsHarvested += 1; }
    }

    const r = rand();
    if (r > 0.72 && r <= 0.82) {
      if (rand() < effDetect(m, caffeine, ribbons)) {
        const idx = Math.floor(rand() * DICT_SIZE);
        recentWords = recentWords.filter(w => t - w.t < 5000);
        if (!recentWords.some(w => w.idx === idx)) {
          recentWords.push({ idx, t });
          words += 1; wordsHarvested += 1;
        }
      }
    }

    if (!breedingUnlocked && m >= cfg.breedingUnlockMonkeys) { breedingUnlocked = true; lastBreed = t; }
    if (breedingUnlocked) {
      const pairs = Math.max(1, Math.floor(M() / 2));
      const interval = Math.max(cfg.breedingBaseIntervalMs / pairs, cfg.breedingMinIntervalMs);
      if (t - lastBreed > interval) { monkeysBred += 1; lastBreed = t; }
    }
  }
  sellAll();
  return { minuteRows, purchases, final: { money, monkeys: M(), bought: monkeysBought, bred: monkeysBred, caffeine, ribbons, wordsHarvested, moneyEarnedTotal } };
}

function gapStats(purchases, windowMs = 600000) {
  const inWin = purchases.filter(p => p.t <= windowMs);
  const gaps = [];
  let prev = 0;
  for (const p of inWin) { gaps.push((p.t - prev) / 1000); prev = p.t; }
  const maxGap = gaps.length ? Math.max(...gaps) : Infinity;
  return { count: inWin.length, maxGap, gaps };
}

function report(cfg, seeds = [1, 2, 3, 4, 5, 6, 7, 8]) {
  console.log(`\n================ ${cfg.name} ================`);
  const runs = seeds.map(s => simulate(cfg, s));
  const mins = runs[0].minuteRows.length;
  console.log('min | wealth$ | earned$ | inc$/min | monkeys (bought+bred) | caff | rib | purchases | nextMonkey$');
  for (let i = 0; i < mins; i++) {
    const avg = k => Math.round(runs.reduce((a, r) => a + r.minuteRows[i][k], 0) / runs.length);
    console.log(
      String(avg('min')).padStart(3), '|',
      String(avg('money')).padStart(7), '|',
      String(avg('earned')).padStart(7), '|',
      String(avg('incomePerMin')).padStart(8), '|',
      `${String(avg('monkeys')).padStart(5)} (${avg('bought')}+${avg('bred')})`.padStart(12), '|',
      String(avg('caffeine')).padStart(4), '|',
      String(avg('ribbons')).padStart(3), '|',
      String(avg('purchases')).padStart(9), '|',
      avg('nextMonkeyCost')
    );
  }
  console.log('\nPurchase timeline (seed 1, first 10 min):');
  let prev = 0;
  runs[0].purchases.filter(p => p.t <= 600000).forEach(p => {
    const sec = p.t / 1000;
    console.log(`  ${(sec / 60).toFixed(0).padStart(2)}:${String(Math.floor(sec % 60)).padStart(2, '0')}  ${p.what.padEnd(13)} $${String(p.cost).padEnd(5)} (+${(sec - prev).toFixed(0)}s wait)`);
    prev = sec;
  });
  const stats = runs.map(r => gapStats(r.purchases));
  console.log(`\nPurchases by min 10 (per seed): ${stats.map(s => s.count).join(', ')}`);
  console.log(`Max wait s in min 0-10 (per seed): ${stats.map(s => Math.round(s.maxGap)).join(', ')}`);
  const worst = Math.max(...stats.map(s => s.maxGap));
  const minPurch = Math.min(...stats.map(s => s.count));
  console.log(`VERDICT: worst wait ${Math.round(worst)}s (target <=120) | min purchases ${minPurch} (target >=8) -> ${worst <= 120 && minPurch >= 8 ? 'PASS' : 'FAIL'}`);
}

report(SHIPPED);
for (const v of VARIANTS) report(v);
