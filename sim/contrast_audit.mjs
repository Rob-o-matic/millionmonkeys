// WCAG contrast audit across drift keyframes (mirrors src/tokens.js interpolation)
// Run: node sim/contrast_audit.mjs
// QA gate for the Act 1 derived ink tokens (Round 3): --brass-ink,
// --harvest-ink, --status-breeding, --ribbon-ink are verified at drift 0
// (Phase 1 drift is pinned at 0 per Build Rule 2).
const ACT_1 = { paper:'#F6F1E5', ink:'#211D1A', ribbonRed:'#A8362B', brass:'#A28439', platen:'#4A4440' };
const ACT_2 = { paper:'#FCFCFD', ink:'#212A36', ribbonRed:'#1A7F74', brass:'#3E9B5F', platen:'#5A6270' };
const ACT_3 = { paper:'#0A0B0F', ink:'#CCCCCC', ribbonRed:'#E8B458', brass:'#E8B458', platen:'#777777' };

// Round 3 derived Act 1 ink tokens (static, drift-0 only in Phase 1)
const DERIVED = {
  brassInk: '#665020',     // --brass-ink
  harvestInk: '#1d5c38',   // --harvest-ink
  statusBreeding: '#11505f', // --status-breeding
  ribbonInk: '#8E2E25',    // --ribbon-ink
};

const hex2rgb = h => { const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h); return [parseInt(m[1],16),parseInt(m[2],16),parseInt(m[3],16)]; };
const rgb2hex = (r,g,b) => '#'+[r,g,b].map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');
const lerp = (a,b,t) => a+(b-a)*t;
const lerpColor = (c1,c2,t) => { const a=hex2rgb(c1),b=hex2rgb(c2); return rgb2hex(lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)); };

function tokensAt(d){
  const out={};
  for (const k of ['paper','ink','ribbonRed','brass','platen']) {
    out[k] = d<=0.5 ? lerpColor(ACT_1[k],ACT_2[k],d*2) : lerpColor(ACT_2[k],ACT_3[k],(d-0.5)*2);
  }
  return out;
}

function relLum(hex){
  const [r,g,b]=hex2rgb(hex).map(v=>{ v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
  return 0.2126*r+0.7152*g+0.0722*b;
}
function ratio(fg,bg){ const l1=relLum(fg),l2=relLum(bg); const [hi,lo]=l1>l2?[l1,l2]:[l2,l1]; return (hi+0.05)/(lo+0.05); }
// alpha composite fg-color w/ alpha over bg
function comp(rgba, bg){ const [r,g,b,a]=rgba; const [br,bgc,bb]=hex2rgb(bg); return rgb2hex(r*a+br*(1-a), g*a+bgc*(1-a), b*a+bb*(1-a)); }

const fmt = x => x.toFixed(2);
let failures = 0;
const check = (label, r, need) => {
  const ok = r >= need;
  if (!ok) failures++;
  console.log(` ${ok ? 'PASS' : 'FAIL'} ${label}: ${fmt(r)} (need ${need})`);
};

for (const d of [0,0.25,0.5,0.75,1.0]){
  const t = tokensAt(d);
  const statusBg = comp([0,0,0,0.15], t.paper);            // .status-box background
  const harvestBg = comp([62,155,95,0.25], t.paper);       // .char.harvested bg (--harvest-tint)
  console.log(`\n=== drift ${d} === paper=${t.paper} ink=${t.ink} ribbonRed=${t.ribbonRed} brass=${t.brass} platen=${t.platen}`);
  console.log(` ink/paper (body, buttons 14px)          : ${fmt(ratio(t.ink,t.paper))}  (need 4.5)`);
  console.log(` platen/paper (labels 11px, desc 8px)    : ${fmt(ratio(t.platen,t.paper))}  (need 4.5)`);
  console.log(` brass/paper (decorative borders)        : ${fmt(ratio(t.brass,t.paper))}  (non-text, info)`);
  console.log(` ribbonRed/paper (focus outline)         : ${fmt(ratio(t.ribbonRed,t.paper))}  (non-text need 3.0)`);
  console.log(` platen/statusBoxBg(${statusBg}) 12px     : ${fmt(ratio(t.platen,statusBg))}  (need 4.5)`);
  console.log(` ink/paper progress-text (ink-on-paper)  : ${fmt(ratio(t.ink,t.paper))}  (need 4.5 @12px)`);
}

/* === Round 3 derived ink tokens — Act 1 / drift 0 QA gate === */
console.log(`\n=== Act 1 derived ink tokens (drift 0) ===`);
{
  const t = tokensAt(0);
  const statusBg = comp([0,0,0,0.15], t.paper);            // rgba(0,0,0,0.15) over paper -> #d1cdc3
  const harvestBg = comp([62,155,95,0.25], t.paper);       // --harvest-tint over paper
  const brassTintBg = comp([...hex2rgb(t.brass), 0.25], t.paper); // tier2: color-mix(brass 25%) over paper
  console.log(` statusBg=${statusBg} harvestBg=${harvestBg} brassTintBg=${brassTintBg}`);
  check('brass-ink/paper (stat 18px bold = large, need 3.0; held to 4.5)', ratio(DERIVED.brassInk, t.paper), 4.5);
  check('brass-ink/statusBg (.status-purchase 12px)', ratio(DERIVED.brassInk, statusBg), 4.5);
  check('brass-ink/brassTintBg (tier2 gem 16px bold)', ratio(DERIVED.brassInk, brassTintBg), 3.0);
  check('harvest-ink/harvestBg (.char.harvested 14px)', ratio(DERIVED.harvestInk, harvestBg), 4.5);
  check('harvest-ink/paper', ratio(DERIVED.harvestInk, t.paper), 4.5);
  check('status-breeding/statusBg (.status-breeding 12px)', ratio(DERIVED.statusBreeding, statusBg), 4.5);
  check('ribbon-ink/statusBg (.status-discovery 12px)', ratio(DERIVED.ribbonInk, statusBg), 4.5);
  check('ribbon-ink/paper', ratio(DERIVED.ribbonInk, t.paper), 4.5);
  check('ink/brass (warning alert-button hover text)', ratio(t.ink, t.brass), 4.5);
  check('paper/ribbonRed (critical alert-button hover text)', ratio(t.paper, t.ribbonRed), 4.5);
  check('status-breeding/paper (automated sell border, non-text)', ratio(DERIVED.statusBreeding, t.paper), 3.0);
  check('brass/paper (affordable button border, non-text 1.4.11)', ratio(t.brass, t.paper), 3.0);
}

console.log(failures === 0 ? '\nALL CHECKS PASS' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
