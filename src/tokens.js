/* Token interpolation system for the three-act narrative drift */

/* Keyframe values for each act */
const ACT_1_TOKENS = {
  paper: '#F6F1E5',
  ink: '#211D1A',
  ribbonRed: '#A8362B',
  brass: '#B08D3E',
  platen: '#4A4440',
  borderRadius: 0,
  headerFont: 'monospace',
  feedFont: '"Special Elite", "Courier Prime", monospace',
};

const ACT_2_TOKENS = {
  paper: '#FCFCFD',
  ink: '#212A36',
  ribbonRed: '#1A7F74',
  brass: '#3E9B5F',
  platen: '#5A6270',
  borderRadius: 8,
  headerFont: 'system-ui, -apple-system, sans-serif',
  feedFont: '"Courier Prime", monospace',
};

const ACT_3_TOKENS = {
  paper: '#0A0B0F',
  ink: '#CCCCCC',
  ribbonRed: '#E8B458',
  brass: '#E8B458',
  platen: '#777777',
  borderRadius: 0,
  headerFont: 'system-ui, -apple-system, sans-serif',
  feedFont: '"Courier Prime", monospace',
};

/* Hex to RGB for interpolation */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [255, 255, 255];
}

/* RGB to Hex */
function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/* Interpolate between two RGB colors */
function interpolateColor(color1, color2, t) {
  const [r1, g1, b1] = hexToRgb(color1);
  const [r2, g2, b2] = hexToRgb(color2);

  const r = r1 + (r2 - r1) * t;
  const g = g1 + (g2 - g1) * t;
  const b = b1 + (b2 - b1) * t;

  return rgbToHex(r, g, b);
}

/* Interpolate between two numeric values */
function interpolateNumber(num1, num2, t) {
  return num1 + (num2 - num1) * t;
}

/* Apply tokens based on act and drift progress */
export function applyTokens(driftProgress = 0) {
  // driftProgress: 0..1, where 0 = Act 1 start, 1 = Act 3 end
  // This is driven by narrative purchases, not time

  let paper, ink, ribbonRed, brass, platen, borderRadius, headerFont, feedFont;

  if (driftProgress <= 0.5) {
    // Act 1 → Act 2 transition (first half of game)
    const t = driftProgress * 2; // 0..1
    paper = interpolateColor(ACT_1_TOKENS.paper, ACT_2_TOKENS.paper, t);
    ink = interpolateColor(ACT_1_TOKENS.ink, ACT_2_TOKENS.ink, t);
    ribbonRed = interpolateColor(
      ACT_1_TOKENS.ribbonRed,
      ACT_2_TOKENS.ribbonRed,
      t
    );
    brass = interpolateColor(ACT_1_TOKENS.brass, ACT_2_TOKENS.brass, t);
    platen = interpolateColor(ACT_1_TOKENS.platen, ACT_2_TOKENS.platen, t);
    borderRadius = interpolateNumber(
      ACT_1_TOKENS.borderRadius,
      ACT_2_TOKENS.borderRadius,
      t
    );
    headerFont =
      t < 0.5 ? ACT_1_TOKENS.headerFont : ACT_2_TOKENS.headerFont;
  } else {
    // Act 2 → Act 3 transition (second half of game)
    const t = (driftProgress - 0.5) * 2; // 0..1
    paper = interpolateColor(ACT_2_TOKENS.paper, ACT_3_TOKENS.paper, t);
    ink = interpolateColor(ACT_2_TOKENS.ink, ACT_3_TOKENS.ink, t);
    ribbonRed = interpolateColor(
      ACT_2_TOKENS.ribbonRed,
      ACT_3_TOKENS.ribbonRed,
      t
    );
    brass = interpolateColor(ACT_2_TOKENS.brass, ACT_3_TOKENS.brass, t);
    platen = interpolateColor(ACT_2_TOKENS.platen, ACT_3_TOKENS.platen, t);
    borderRadius = interpolateNumber(
      ACT_2_TOKENS.borderRadius,
      ACT_3_TOKENS.borderRadius,
      t
    );
    headerFont =
      t < 0.5 ? ACT_2_TOKENS.headerFont : ACT_3_TOKENS.headerFont;
  }

  feedFont = ACT_1_TOKENS.feedFont; // Feed font stays monospace throughout

  /* Apply to CSS custom properties */
  const root = document.documentElement;
  root.style.setProperty('--paper', paper);
  root.style.setProperty('--ink', ink);
  root.style.setProperty('--ribbon-red', ribbonRed);
  root.style.setProperty('--brass', brass);
  root.style.setProperty('--platen', platen);
  root.style.setProperty('--button-border-radius', `${borderRadius}px`);
  root.style.setProperty('--header-font', headerFont);
  root.style.setProperty('--feed-font', feedFont);
}

/* Ensure Anthology tokens never drift */
export function freezeAnthologyTokens() {
  const anthology = document.querySelector('.anthology');
  if (!anthology) return;

  const style = anthology.style;
  style.setProperty('--bg', '#F6F1E5', 'important');
  style.setProperty('--text', '#211D1A', 'important');
  style.setProperty('--ribbon-red', '#A8362B', 'important');
  style.setProperty('--brass', '#B08D3E', 'important');
  style.setProperty('--platen', '#4A4440', 'important');
  style.setProperty('--button-border-radius', '0px', 'important');
  style.setProperty('--header-font', 'monospace', 'important');
  style.setProperty(
    '--feed-font',
    '"Special Elite", "Courier Prime", monospace',
    'important'
  );
}
