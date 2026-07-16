/** Design tokens matching the iOS BookishChat app */
export const colors = {
  inkBlue: "rgb(46, 64, 148)", // 0.18, 0.25, 0.58
  cream: "rgb(246, 243, 235)", // 0.965, 0.955, 0.92
  ruleClr: "rgba(46, 64, 148, 0.28)",
  redClr: "rgb(209, 46, 46)", // 0.82, 0.18, 0.18
  oakBrown: "rgb(71, 41, 18)", // 0.28, 0.16, 0.07
  woodLight: "rgb(115, 71, 31)", // 0.45, 0.28, 0.12
  woodDark: "rgb(56, 31, 13)", // 0.22, 0.12, 0.05
  woodMid: "rgb(89, 51, 20)", // 0.35, 0.20, 0.08
} as const;

export const fonts = {
  typewriter:
    'var(--font-typewriter-stack), "American Typewriter", "Courier New", Courier, monospace',
  handwriting:
    'var(--font-handwriting-stack), "Bradley Hand", Caveat, cursive',
  serif: 'Georgia, "Times New Roman", Times, serif',
} as const;

export const ROW_COUNT = 16;
export const ROW_H = 40;
export const LEFT_W = 72;
export const RIGHT_W = 46;
export const GAP = 3;
export const RULED_AREA_TOP = 128;
