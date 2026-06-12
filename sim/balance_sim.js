/*
 * Million Monkeys — Act 1 economy simulation (first 15 minutes, optimal play)
 * Mirrors logic in src/Feed.jsx, src/App.jsx, src/economy.js, src/scripting.js
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

const CURRENT = {
  name: 'CURRENT',
  startMoney: 30,
  monkeyBaseCost: 30,
  monkeyCostMult: 1.15,
  caffeineBaseCost: 60,
  caffeineCostMult: 1.15,
  caffeineWorks: false,      // getProductionMultiplier is never called in App/Feed
  baseCharIntervalMs: 40,    // Feed.jsx
  realWordChance: 0.10,      // Feed.jsx rand window
  detectChance: 0.30,        // Feed.jsx onWordGenerated gate
  wordValue: 10,             // gameState.js SELL_WORDS
  comboWindowMs: 2000,
  comboBonusCap: Infinity,
  breedingUnlockMonkeys: 8,
  breedingBaseIntervalMs: 7500,
  breedingMinIntervalMs: 500,
  scriptedTimes: [2000, 4000, 6000, 10000, 15000, 20000, 28000], // near-miss at 35s gives 0
};

const PROPOSED = {
  ...CURRENT,
  name: 'PROPOSED',
  detectChance: 0.10,        // 0.30 -> 0.10
  wordValue: 2,              // $10 -> $2
  monkeyCostMult: 1.25,      // 1.15 -> 1.25 (monkeys only)
  caffeineCostMult: 1.5,     // 1.15 -> 1.5
  comboBonusCap: 3,          // uncapped -> +3 max bonus words
  breedingBaseIntervalMs: 30000, // 7500 -> 30000
  breedingMinIntervalMs: 5000,   // 500 -> 5000
  caffeineWorks: true,       // wire getProductionMultiplier into detection rate
  detectLinear: true,        // detection rate scales linearly with monkeys (ignores 2x/5x/10x blur tiers)
};

const VARIANTS = [
  PROPOSED,
  { ...PROPOSED, name: 'B: comboCap2', comboBonusCap: 2 },
  { ...PROPOSED, name: 'C: cap2+breed45k/10k', comboBonusCap: 2, breedingBaseIntervalMs: 45000, breedingMinIntervalMs: 10000 },
  { ...PROPOSED, name: 'D: C + mult1.3', comboBonusCap: 2, breedingBaseIntervalMs: 45000, breedingMinIntervalMs: 10000, monkeyCostMult: 1.3 },
  { ...PROPOSED, name: 'E: D + value$1+detect0.15', wordValue: 1, detectChance: 0.15, comboBonusCap: 2, breedingBaseIntervalMs: 45000, breedingMinIntervalMs: 10000, monkeyCostMult: 1.3 },
  { ...PROPOSED, name: 'F: v2 d0.1 cap1 m1.3 caff2.0 breed60k/15k', wordValue: 2, detectChance: 0.10, comboBonusCap: 1, monkeyCostMult: 1.3, caffeineCostMult: 2.0, breedingBaseIntervalMs: 60000, breedingMinIntervalMs: 15000 },
  { ...PROPOSED, name: 'G: F but detect0.07', wordValue: 2, detectChance: 0.07, comboBonusCap: 1, monkeyCostMult: 1.3, caffeineCostMult: 2.0, breedingBaseIntervalMs: 60000, breedingMinIntervalMs: 15000 },
  { ...PROPOSED, name: 'H: F but no combo bonus', wordValue: 2, detectChance: 0.10, comboBonusCap: 0, monkeyCostMult: 1.3, caffeineCostMult: 2.0, breedingBaseIntervalMs: 60000, breedingMinIntervalMs: 15000 },
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

function simulate(cfg, seed, minutes = 15, log = false) {
  const rand = mulberry32(seed);
  const END = minutes * 60000;
  let t = 0;                 // ms
  let money = cfg.startMoney;
  let words = 0;             // unsold word inventory (we sell right before buying)
  let monkeysBought = 0, monkeysBred = 0;
  let caffeine = 0;
  let purchases = [];        // {t, what, cost}
  let combo = 0, lastDetect = -Infinity;
  let lastBreed = 0;
  let recentWords = [];      // {idx, t} for 5s dedup
  let scriptedDone = new Set();
  let wordsHarvested = 0, moneyEarnedTotal = 0;
  const minuteRows = [];

  const M = () => monkeysBought + monkeysBred;
  const monkeyCost = () => Math.round(cfg.monkeyBaseCost * Math.pow(cfg.monkeyCostMult, monkeysBought));
  const caffCost = () => Math.round(cfg.caffeineBaseCost * Math.pow(cfg.caffeineCostMult, caffeine));
  const sellAll = () => { const v = words * cfg.wordValue; money += v; moneyEarnedTotal += v; words = 0; };

  // income/s estimate for ROI comparison
  const detectMult = () => (cfg.caffeineWorks ? Math.pow(1.1, caffeine) : 1);
  const effDetect = (m, c) => {
    const dm = cfg.caffeineWorks ? Math.pow(1.1, c) : 1;
    let p = cfg.detectChance * dm;
    if (cfg.detectLinear) p *= (tickIntervalMs(cfg, m) * m) / cfg.baseCharIntervalMs;
    return Math.min(1, p);
  };
  const incomePerSec = (m, c) => {
    if (m === 0) return 0;
    const tps = 1000 / tickIntervalMs(cfg, m);
    return tps * cfg.realWordChance * effDetect(m, c) * cfg.wordValue;
  };

  const tryBuy = () => {
    // greedy optimal-ish: compare marginal income per dollar
    for (;;) {
      const mc = monkeyCost();
      const cc = caffCost();
      const wealth = money + words * cfg.wordValue;
      const mGain = incomePerSec(M() + 1, caffeine) - incomePerSec(M(), caffeine);
      const cGain = cfg.caffeineWorks && M() > 0 ? incomePerSec(M(), caffeine + 1) - incomePerSec(M(), caffeine) : 0;
      const mROI = mGain / mc, cROI = cGain / cc;
      let pick = null;
      if (M() === 0) pick = wealth >= mc ? 'monkey' : null;
      else if (cROI > mROI && wealth >= cc) pick = 'caffeine';
      else if (wealth >= mc) pick = 'monkey';
      else if (cROI > 0 && wealth >= cc) pick = 'caffeine';
      if (!pick) break;
      sellAll();
      if (pick === 'monkey') { money -= monkeyCost(); purchases.push({ t, what: `Monkey #${monkeysBought + 1}`, cost: monkeyCost() }); monkeysBought++; }
      else { money -= caffCost(); purchases.push({ t, what: `Caffeine #${caffeine + 1}`, cost: caffCost() }); caffeine++; }
    }
  };

  let nextMinute = 60000;
  let breedingUnlocked = false;

  while (t < END) {
    tryBuy();
    const m = M();
    const dt = m > 0 ? tickIntervalMs(cfg, m) : 100;
    t += dt;

    // minute snapshot
    while (t >= nextMinute && nextMinute <= END) {
      minuteRows.push({
        min: nextMinute / 60000, money: Math.round(money + words * cfg.wordValue),
        earned: Math.round(moneyEarnedTotal), monkeys: M(), bought: monkeysBought,
        bred: monkeysBred, caffeine, purchases: purchases.length, wordsHarvested,
        nextMonkeyCost: monkeyCost(),
      });
      nextMinute += 60000;
    }
    if (m === 0) continue;

    // scripted gems (run alongside feed in first 35s)
    for (const st of cfg.scriptedTimes) {
      if (t >= st && !scriptedDone.has(st)) { scriptedDone.add(st); words += 1; wordsHarvested += 1; }
    }

    // feed tick
    const r = rand();
    if (r > 0.82 && r <= 0.92 + 0 /* mirror: rand>0.72 && rand<=0.82 is real word */) { /* placeholder */ }
    // mirror Feed.jsx exactly: rand>0.97 newline; >0.82 space; >0.72 real word; else gibberish
    if (r > 0.72 && r <= 0.82) {
      // real word emitted
      if (rand() < effDetect(m, caffeine)) {
        // detected -> dedup check
        const idx = Math.floor(rand() * DICT_SIZE);
        recentWords = recentWords.filter(w => t - w.t < 5000);
        const dup = recentWords.some(w => w.idx === idx);
        if (!dup) {
          recentWords.push({ idx, t });
          // combo
          if (t - lastDetect < cfg.comboWindowMs && lastDetect > 0) combo += 1; else combo = 1;
          lastDetect = t;
          let gained = 1;
          if (combo >= 2) gained += Math.min(combo - 1, cfg.comboBonusCap);
          words += gained; wordsHarvested += gained;
        }
      }
    }

    // breeding
    if (!breedingUnlocked && m >= cfg.breedingUnlockMonkeys) { breedingUnlocked = true; lastBreed = t; }
    if (breedingUnlocked) {
      const pairs = Math.max(1, Math.floor(M() / 2));
      const interval = Math.max(cfg.breedingBaseIntervalMs / pairs, cfg.breedingMinIntervalMs);
      if (t - lastBreed > interval) { monkeysBred += 1; lastBreed = t; }
    }
  }
  sellAll();
  return { minuteRows, purchases, final: { money, monkeys: M(), bought: monkeysBought, bred: monkeysBred, caffeine, wordsHarvested, moneyEarnedTotal } };
}

function report(cfg, seeds = [1, 2, 3, 4, 5]) {
  console.log(`\n================ ${cfg.name} ================`);
  // average minute table across seeds
  const runs = seeds.map(s => simulate(cfg, s));
  const mins = runs[0].minuteRows.length;
  console.log('min | wealth$ | earned$ | monkeys (bought+bred) | caff | purchases | nextMonkey$');
  for (let i = 0; i < mins; i++) {
    const avg = k => Math.round(runs.reduce((a, r) => a + r.minuteRows[i][k], 0) / runs.length);
    console.log(
      String(avg('min')).padStart(3), '|',
      String(avg('money')).padStart(7), '|',
      String(avg('earned')).padStart(7), '|',
      `${String(avg('monkeys')).padStart(5)} (${avg('bought')}+${avg('bred')})`.padStart(12), '|',
      String(avg('caffeine')).padStart(4), '|',
      String(avg('purchases')).padStart(9), '|',
      avg('nextMonkeyCost')
    );
  }
  // purchase timeline (seed 1)
  console.log('\nPurchase timeline (seed 1):');
  let prev = 0;
  runs[0].purchases.slice(0, 25).forEach(p => {
    const sec = p.t / 1000;
    console.log(`  ${(sec / 60).toFixed(0).padStart(2)}:${String(Math.floor(sec % 60)).padStart(2, '0')}  ${p.what.padEnd(12)} $${p.cost}  (+${(sec - prev).toFixed(0)}s)`);
    prev = sec;
  });
  if (runs[0].purchases.length > 25) console.log(`  ... ${runs[0].purchases.length - 25} more`);
  const p10 = runs.map(r => r.purchases.filter(p => p.t <= 600000).length);
  console.log(`\nPurchases by min 10 (per seed): ${p10.join(', ')}`);
  const p3 = runs.map(r => r.minuteRows[2]?.earned ?? 0);
  console.log(`Money earned by min 3 (per seed): ${p3.join(', ')}`);
}

report(CURRENT);
for (const v of VARIANTS) report(v);
