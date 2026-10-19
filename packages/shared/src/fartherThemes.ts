import type { ThemeDefinition } from "./themePalettes.ts";

// Farther's built-in themes live in this file so syncing upstream's
// themePalettes.ts only ever conflicts on the one line that registers them.

type DarkPalette = Readonly<{
  bg: string;
  bgDark: string;
  bgHighlight: string;
  surface: string;
  selection: string;
  rowHover: string;
  border: string;
  borderStrong: string;
  fg: string;
  comment: string;
  muted: string;
  blue: string;
  blueHover: string;
  cyan: string;
  red: string;
  orange: string;
  yellow: string;
  errorSurface: string;
  warningSurface: string;
  updateSurface: string;
  searchMatch: string;
}>;

function fartherDarkTheme(id: string, label: string, p: DarkPalette): ThemeDefinition {
  return {
    id,
    label,
    appearance: "dark",
    colors: {
      canvas: p.bg,
      chrome: p.bgDark,
      toolbar: p.bg,
      toolbarForeground: p.fg,
      toolbarBorder: p.border,
      toolbarControl: p.surface,
      toolbarControlForeground: p.fg,
      toolbarControlHover: p.bgHighlight,
      surface: p.bg,
      surfaceRaised: p.surface,
      surfaceOverlay: p.surface,
      text: p.fg,
      textMuted: p.muted,
      border: p.border,
      input: p.borderStrong,
      focus: p.blue,
      accent: p.blue,
      accentForeground: p.bgDark,
      secondary: p.surface,
      secondaryForeground: p.fg,
      muted: p.surface,
      mutedForeground: p.muted,
      placeholder: p.comment,
      secondaryLabel: p.muted,
      iconMuted: p.muted,
      error: p.red,
      errorForeground: p.red,
      errorSurface: p.errorSurface,
      warning: p.orange,
      warningForeground: p.yellow,
      warningSurface: p.warningSurface,
      update: p.blue,
      updateForeground: p.cyan,
      updateSurface: p.updateSurface,
      accentSurface: p.selection,
      accentSurfaceForeground: p.fg,
      messageSurface: p.bgHighlight,
      messageForeground: p.fg,
      messageAction: p.blue,
      messageActionForeground: p.bgDark,
      messageActionHover: p.blueHover,
      codeBackground: p.bgDark,
      codeForeground: p.fg,
      searchMatchBackground: p.searchMatch,
      searchMatchForeground: p.fg,
      searchMatchActiveBackground: p.yellow,
      searchMatchActiveForeground: p.bgDark,
      sidebar: p.bgDark,
      sidebarForeground: p.fg,
      sidebarMutedForeground: p.comment,
      sidebarControlSurface: p.surface,
      sidebarRowHover: p.rowHover,
      sidebarRowActive: p.selection,
      sidebarRowSelected: p.selection,
      sidebarBorder: p.border,
      terminalBackground: p.bgDark,
      terminalForeground: p.fg,
      terminalCursor: p.fg,
      terminalSelection: p.selection,
      terminalScrollbar: p.bgHighlight,
      terminalScrollbarHover: p.borderStrong,
    },
  };
}

export const TOKYO_NIGHT_THEME = fartherDarkTheme("tokyo-night", "Tokyo Night", {
  bg: "#1a1b26",
  bgDark: "#16161e",
  bgHighlight: "#292e42",
  surface: "#1f2335",
  selection: "#283457",
  rowHover: "#1f2233",
  border: "#292e42",
  borderStrong: "#3b4261",
  fg: "#c0caf5",
  comment: "#565f89",
  muted: "#737aa2",
  blue: "#7aa2f7",
  blueHover: "#89b4fa",
  cyan: "#7dcfff",
  red: "#f7768e",
  orange: "#ff9e64",
  yellow: "#e0af68",
  errorSurface: "#2d202a",
  warningSurface: "#2e2a2d",
  updateSurface: "#202640",
  searchMatch: "#3d59a1",
});

// cyberdream.nvim's dark palette: near-black greys with saturated neon accents.
export const CYBERDREAM_THEME = fartherDarkTheme("cyberdream", "Cyberdream", {
  bg: "#16181a",
  bgDark: "#121315",
  bgHighlight: "#3c4048",
  surface: "#1e2124",
  selection: "#2b3038",
  rowHover: "#1e2124",
  border: "#2a2d32",
  borderStrong: "#3c4048",
  fg: "#ffffff",
  comment: "#7b8496",
  muted: "#a0a8b8",
  blue: "#5ea1ff",
  blueHover: "#7fb4ff",
  cyan: "#5ef1ff",
  red: "#ff6e5e",
  orange: "#ffbd5e",
  yellow: "#f1ff5e",
  errorSurface: "#2a1c1c",
  warningSurface: "#2a2519",
  updateSurface: "#18243a",
  searchMatch: "#3c4f6e",
});

export const FARTHER_THEMES: ReadonlyArray<ThemeDefinition> = [TOKYO_NIGHT_THEME, CYBERDREAM_THEME];
