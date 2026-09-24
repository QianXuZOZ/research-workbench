export type ThemeMode = "light" | "dark" | "system";

export const themeOverrideKeys = ["accent", "title", "body", "muted", "background", "surface", "sidebar", "sidebarText", "sidebarMuted"] as const;
export type ThemeOverrideKey = typeof themeOverrideKeys[number];
export type ThemeOverrides = Partial<Record<ThemeOverrideKey, string>>;

export type ThemeConfig = {
  preset: ThemePresetId;
  mode: ThemeMode;
  overrides: ThemeOverrides;
};

type Palette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceStrong: string;
  text: string;
  text2: string;
  text3: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentBright: string;
  accentSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  sidebar: string;
  sidebarText: string;
  sidebarMuted: string;
  sidebarActive: string;
  hero: string;
  heroText: string;
  heroMuted: string;
};

type ThemePreset = {
  name: string;
  description: string;
  light: Palette;
  dark: Palette;
};

const p = (value: Palette) => value;

export const themePresets = {
  codex: {
    name: "Codex",
    description: "克制的中性色与清晰蓝色强调",
    light: p({ background:"#f7f7f5",surface:"#ffffff",surfaceAlt:"#f1f1ef",surfaceStrong:"#e8e8e5",text:"#202123",text2:"#5f6368",text3:"#8a8d91",border:"#e2e2de",borderStrong:"#cfcfca",accent:"#1769e0",accentBright:"#2d7df0",accentSoft:"#e7f0ff",success:"#16835b",successSoft:"#e1f3ea",warning:"#9a6700",warningSoft:"#fff2cc",danger:"#c43b46",dangerSoft:"#fae7e9",sidebar:"#fafaf8",sidebarText:"#27282a",sidebarMuted:"#777a7e",sidebarActive:"#e9f1fd",hero:"#22262d",heroText:"#f6f7f9",heroMuted:"#aeb5bf" }),
    dark: p({ background:"#171717",surface:"#1f1f1f",surfaceAlt:"#272727",surfaceStrong:"#303030",text:"#ececec",text2:"#b9b9b9",text3:"#858585",border:"#343434",borderStrong:"#484848",accent:"#6ea8ff",accentBright:"#8bbaff",accentSoft:"#24344d",success:"#68c79b",successSoft:"#213b31",warning:"#e6b85c",warningSoft:"#40351f",danger:"#f18b93",dangerSoft:"#47272c",sidebar:"#1b1b1b",sidebarText:"#efefef",sidebarMuted:"#999999",sidebarActive:"#26364f",hero:"#111317",heroText:"#f6f7f9",heroMuted:"#9ea6b1" }),
  },
  github: {
    name: "GitHub",
    description: "GitHub 风格的冷灰与链接蓝",
    light: p({ background:"#f6f8fa",surface:"#ffffff",surfaceAlt:"#f6f8fa",surfaceStrong:"#eaeef2",text:"#1f2328",text2:"#59636e",text3:"#818b98",border:"#d0d7de",borderStrong:"#afb8c1",accent:"#0969da",accentBright:"#218bff",accentSoft:"#ddf4ff",success:"#1a7f37",successSoft:"#dafbe1",warning:"#9a6700",warningSoft:"#fff8c5",danger:"#cf222e",dangerSoft:"#ffebe9",sidebar:"#f6f8fa",sidebarText:"#24292f",sidebarMuted:"#6e7781",sidebarActive:"#ddf4ff",hero:"#24292f",heroText:"#ffffff",heroMuted:"#afb8c1" }),
    dark: p({ background:"#0d1117",surface:"#161b22",surfaceAlt:"#21262d",surfaceStrong:"#30363d",text:"#f0f6fc",text2:"#b1bac4",text3:"#7d8590",border:"#30363d",borderStrong:"#484f58",accent:"#58a6ff",accentBright:"#79c0ff",accentSoft:"#1f3b57",success:"#3fb950",successSoft:"#173b24",warning:"#d29922",warningSoft:"#3d2f12",danger:"#f85149",dangerSoft:"#4b2425",sidebar:"#0d1117",sidebarText:"#f0f6fc",sidebarMuted:"#8b949e",sidebarActive:"#1f3b57",hero:"#161b22",heroText:"#f0f6fc",heroMuted:"#8b949e" }),
  },
  gruvbox: {
    name: "Gruvbox",
    description: "复古暖色与低饱和绿色",
    light: p({ background:"#fbf1c7",surface:"#f9f5d7",surfaceAlt:"#ebdbb2",surfaceStrong:"#d5c4a1",text:"#3c3836",text2:"#665c54",text3:"#928374",border:"#d5c4a1",borderStrong:"#bdae93",accent:"#79740e",accentBright:"#98971a",accentSoft:"#e9e1a5",success:"#79740e",successSoft:"#e8e2b0",warning:"#b57614",warningSoft:"#f4dfb1",danger:"#9d0006",dangerSoft:"#f0c4b7",sidebar:"#f2e5bc",sidebarText:"#3c3836",sidebarMuted:"#7c6f64",sidebarActive:"#e5dd9f",hero:"#504945",heroText:"#fbf1c7",heroMuted:"#d5c4a1" }),
    dark: p({ background:"#282828",surface:"#32302f",surfaceAlt:"#3c3836",surfaceStrong:"#504945",text:"#ebdbb2",text2:"#d5c4a1",text3:"#a89984",border:"#504945",borderStrong:"#665c54",accent:"#b8bb26",accentBright:"#d8db48",accentSoft:"#41451f",success:"#b8bb26",successSoft:"#39421e",warning:"#fabd2f",warningSoft:"#4a3b16",danger:"#fb4934",dangerSoft:"#4d2924",sidebar:"#1d2021",sidebarText:"#ebdbb2",sidebarMuted:"#a89984",sidebarActive:"#3d4322",hero:"#1d2021",heroText:"#fbf1c7",heroMuted:"#bdae93" }),
  },
  catppuccin: {
    name: "Catppuccin",
    description: "柔和粉彩与蓝紫强调",
    light: p({ background:"#eff1f5",surface:"#ffffff",surfaceAlt:"#e6e9ef",surfaceStrong:"#dce0e8",text:"#4c4f69",text2:"#6c6f85",text3:"#8c8fa1",border:"#ccd0da",borderStrong:"#bcc0cc",accent:"#1e66f5",accentBright:"#8839ef",accentSoft:"#dce6ff",success:"#40a02b",successSoft:"#e1f1dc",warning:"#df8e1d",warningSoft:"#f9e7c6",danger:"#d20f39",dangerSoft:"#f7dce2",sidebar:"#e6e9ef",sidebarText:"#4c4f69",sidebarMuted:"#7c7f93",sidebarActive:"#dce6ff",hero:"#4c4f69",heroText:"#eff1f5",heroMuted:"#c6c8d1" }),
    dark: p({ background:"#1e1e2e",surface:"#252536",surfaceAlt:"#313244",surfaceStrong:"#45475a",text:"#cdd6f4",text2:"#bac2de",text3:"#9399b2",border:"#45475a",borderStrong:"#585b70",accent:"#89b4fa",accentBright:"#cba6f7",accentSoft:"#273a5a",success:"#a6e3a1",successSoft:"#2e4637",warning:"#f9e2af",warningSoft:"#4a402c",danger:"#f38ba8",dangerSoft:"#4c2d3a",sidebar:"#181825",sidebarText:"#cdd6f4",sidebarMuted:"#9399b2",sidebarActive:"#273a5a",hero:"#181825",heroText:"#cdd6f4",heroMuted:"#9399b2" }),
  },
  everforest: {
    name: "Everforest",
    description: "自然灰绿与柔和护眼背景",
    light: p({ background:"#fdf6e3",surface:"#f8f0dc",surfaceAlt:"#efebd4",surfaceStrong:"#e4dfc8",text:"#5c6a72",text2:"#708089",text3:"#939f91",border:"#d8d5bd",borderStrong:"#c8c2a7",accent:"#8da101",accentBright:"#a7b84b",accentSoft:"#e7ebc8",success:"#8da101",successSoft:"#e4ebc9",warning:"#dfa000",warningSoft:"#f5e4ba",danger:"#f85552",dangerSoft:"#f5d3ca",sidebar:"#f4eed9",sidebarText:"#56635f",sidebarMuted:"#879686",sidebarActive:"#e5e9c7",hero:"#4f5b58",heroText:"#fdf6e3",heroMuted:"#c5c9b6" }),
    dark: p({ background:"#2d353b",surface:"#343f44",surfaceAlt:"#3d484d",surfaceStrong:"#475258",text:"#d3c6aa",text2:"#b9c0ab",text3:"#859289",border:"#475258",borderStrong:"#56635f",accent:"#a7c080",accentBright:"#83c092",accentSoft:"#354a3b",success:"#a7c080",successSoft:"#35483a",warning:"#dbbc7f",warningSoft:"#4a412d",danger:"#e67e80",dangerSoft:"#4c3032",sidebar:"#272e33",sidebarText:"#d3c6aa",sidebarMuted:"#859289",sidebarActive:"#354a3b",hero:"#232a2e",heroText:"#d3c6aa",heroMuted:"#9da9a0" }),
  },
  linear: {
    name: "Linear",
    description: "极简灰阶与高识别度靛蓝",
    light: p({ background:"#f7f7f8",surface:"#ffffff",surfaceAlt:"#f1f1f3",surfaceStrong:"#e7e7ea",text:"#17171a",text2:"#5e5e66",text3:"#929299",border:"#dedee3",borderStrong:"#c9c9d0",accent:"#5e6ad2",accentBright:"#6f7be8",accentSoft:"#e7e9fb",success:"#238b57",successSoft:"#e0f2e8",warning:"#a36600",warningSoft:"#fff0cf",danger:"#c13e51",dangerSoft:"#fae6e9",sidebar:"#f3f3f5",sidebarText:"#202024",sidebarMuted:"#797980",sidebarActive:"#e7e9fb",hero:"#202024",heroText:"#fafafa",heroMuted:"#b5b5bd" }),
    dark: p({ background:"#191a23",surface:"#20212b",surfaceAlt:"#282a36",surfaceStrong:"#333542",text:"#f4f4f5",text2:"#c5c5ca",text3:"#8d8e98",border:"#333542",borderStrong:"#444654",accent:"#8b93ff",accentBright:"#a4aaff",accentSoft:"#303459",success:"#5dc58a",successSoft:"#263d31",warning:"#e6b95f",warningSoft:"#44391f",danger:"#f07f91",dangerSoft:"#472a31",sidebar:"#15161e",sidebarText:"#f4f4f5",sidebarMuted:"#8d8e98",sidebarActive:"#303459",hero:"#15161e",heroText:"#f4f4f5",heroMuted:"#9b9ca6" }),
  },
  notion: {
    name: "Notion",
    description: "温和纸张感与低对比黑灰",
    light: p({ background:"#f7f6f3",surface:"#ffffff",surfaceAlt:"#f1f1ef",surfaceStrong:"#e7e7e4",text:"#37352f",text2:"#6f6e69",text3:"#9b9a97",border:"#deddd9",borderStrong:"#c8c7c2",accent:"#0b6e99",accentBright:"#2f80a8",accentSoft:"#dceef5",success:"#448361",successSoft:"#e3eee6",warning:"#cb912f",warningSoft:"#f7edcf",danger:"#d44c47",dangerSoft:"#f7e3e2",sidebar:"#f7f6f3",sidebarText:"#37352f",sidebarMuted:"#787774",sidebarActive:"#e8eef1",hero:"#37352f",heroText:"#ffffff",heroMuted:"#c9c8c3" }),
    dark: p({ background:"#191919",surface:"#202020",surfaceAlt:"#2a2a2a",surfaceStrong:"#343434",text:"#f1f1ef",text2:"#c7c7c5",text3:"#8e8e8b",border:"#343434",borderStrong:"#464646",accent:"#529cca",accentBright:"#67b4df",accentSoft:"#243b48",success:"#6eb88d",successSoft:"#263b2e",warning:"#d9a75b",warningSoft:"#43371f",danger:"#e06b66",dangerSoft:"#482b29",sidebar:"#171717",sidebarText:"#f1f1ef",sidebarMuted:"#8e8e8b",sidebarActive:"#243b48",hero:"#101010",heroText:"#f1f1ef",heroMuted:"#9a9a96" }),
  },
  one: {
    name: "One",
    description: "One Light / One Dark 编辑器风格",
    light: p({ background:"#fafafa",surface:"#ffffff",surfaceAlt:"#f0f0f0",surfaceStrong:"#e5e5e6",text:"#383a42",text2:"#5c6370",text3:"#9a9ca1",border:"#d9d9db",borderStrong:"#c5c5c8",accent:"#4078f2",accentBright:"#a626a4",accentSoft:"#e3ebfd",success:"#50a14f",successSoft:"#e0efe0",warning:"#c18401",warningSoft:"#f7ebc8",danger:"#e45649",dangerSoft:"#f8e1df",sidebar:"#f2f2f2",sidebarText:"#383a42",sidebarMuted:"#81838a",sidebarActive:"#e3ebfd",hero:"#383a42",heroText:"#fafafa",heroMuted:"#b8bac1" }),
    dark: p({ background:"#282c34",surface:"#2f333d",surfaceAlt:"#353b45",surfaceStrong:"#3e4451",text:"#abb2bf",text2:"#9da5b4",text3:"#7f848e",border:"#3e4451",borderStrong:"#4b5263",accent:"#61afef",accentBright:"#c678dd",accentSoft:"#263e55",success:"#98c379",successSoft:"#304233",warning:"#e5c07b",warningSoft:"#463c27",danger:"#e06c75",dangerSoft:"#482d32",sidebar:"#21252b",sidebarText:"#abb2bf",sidebarMuted:"#7f848e",sidebarActive:"#263e55",hero:"#21252b",heroText:"#abb2bf",heroMuted:"#7f848e" }),
  },
  nord: {
    name: "Nord",
    description: "北欧冷色与低刺激蓝绿",
    light: p({ background:"#eceff4",surface:"#ffffff",surfaceAlt:"#e5e9f0",surfaceStrong:"#d8dee9",text:"#2e3440",text2:"#4c566a",text3:"#7b8494",border:"#d8dee9",borderStrong:"#c4cbd6",accent:"#5e81ac",accentBright:"#5e81ac",accentSoft:"#dbe4ef",success:"#8fbc8f",successSoft:"#e2eee2",warning:"#d08770",warningSoft:"#f2e3dc",danger:"#bf616a",dangerSoft:"#f0dcdf",sidebar:"#e5e9f0",sidebarText:"#2e3440",sidebarMuted:"#667085",sidebarActive:"#dbe4ef",hero:"#3b4252",heroText:"#eceff4",heroMuted:"#b5bfce" }),
    dark: p({ background:"#2e3440",surface:"#343b49",surfaceAlt:"#3b4252",surfaceStrong:"#434c5e",text:"#eceff4",text2:"#d8dee9",text3:"#9aa6b6",border:"#434c5e",borderStrong:"#4c566a",accent:"#88c0d0",accentBright:"#81a1c1",accentSoft:"#334d59",success:"#a3be8c",successSoft:"#354438",warning:"#ebcb8b",warningSoft:"#4b422c",danger:"#bf616a",dangerSoft:"#4a2f36",sidebar:"#272c36",sidebarText:"#eceff4",sidebarMuted:"#9aa6b6",sidebarActive:"#334d59",hero:"#242933",heroText:"#eceff4",heroMuted:"#9aa6b6" }),
  },
  "tokyo-night": {
    name: "Tokyo Night",
    description: "深邃夜蓝与电光蓝紫",
    light: p({ background:"#d5d6db",surface:"#e1e2e7",surfaceAlt:"#cbccd1",surfaceStrong:"#bfc0c5",text:"#343b58",text2:"#4c5674",text3:"#757ca3",border:"#c1c2c7",borderStrong:"#a9abb2",accent:"#34548a",accentBright:"#5a4a78",accentSoft:"#c3cee5",success:"#485e30",successSoft:"#d0d9c4",warning:"#8f5e15",warningSoft:"#e2d2ae",danger:"#8c4351",dangerSoft:"#dfc3c8",sidebar:"#c9cad0",sidebarText:"#343b58",sidebarMuted:"#6c7395",sidebarActive:"#c3cee5",hero:"#343b58",heroText:"#e1e2e7",heroMuted:"#a9b1ca" }),
    dark: p({ background:"#1a1b26",surface:"#202330",surfaceAlt:"#24283b",surfaceStrong:"#2f3549",text:"#c0caf5",text2:"#a9b1d6",text3:"#737aa2",border:"#2f3549",borderStrong:"#414868",accent:"#7aa2f7",accentBright:"#bb9af7",accentSoft:"#253a60",success:"#9ece6a",successSoft:"#30432d",warning:"#e0af68",warningSoft:"#443822",danger:"#f7768e",dangerSoft:"#482b36",sidebar:"#16161e",sidebarText:"#c0caf5",sidebarMuted:"#737aa2",sidebarActive:"#253a60",hero:"#16161e",heroText:"#c0caf5",heroMuted:"#737aa2" }),
  },
  solarized: {
    name: "Solarized",
    description: "经典低对比蓝青编辑器主题",
    light: p({ background:"#fdf6e3",surface:"#eee8d5",surfaceAlt:"#e7e1cf",surfaceStrong:"#d9d2bd",text:"#586e75",text2:"#657b83",text3:"#93a1a1",border:"#d8d2bd",borderStrong:"#c7c0aa",accent:"#268bd2",accentBright:"#2aa198",accentSoft:"#d7e9ef",success:"#859900",successSoft:"#e4e8c2",warning:"#b58900",warningSoft:"#f1e5b9",danger:"#dc322f",dangerSoft:"#f2d1ca",sidebar:"#eee8d5",sidebarText:"#586e75",sidebarMuted:"#839496",sidebarActive:"#d7e9ef",hero:"#073642",heroText:"#fdf6e3",heroMuted:"#93a1a1" }),
    dark: p({ background:"#002b36",surface:"#073642",surfaceAlt:"#0c414d",surfaceStrong:"#164e59",text:"#839496",text2:"#93a1a1",text3:"#657b83",border:"#164e59",borderStrong:"#205a64",accent:"#268bd2",accentBright:"#2aa198",accentSoft:"#123f56",success:"#859900",successSoft:"#31421d",warning:"#b58900",warningSoft:"#453916",danger:"#dc322f",dangerSoft:"#4d2624",sidebar:"#00252e",sidebarText:"#93a1a1",sidebarMuted:"#657b83",sidebarActive:"#123f56",hero:"#001f27",heroText:"#eee8d5",heroMuted:"#657b83" }),
  },
} satisfies Record<string, ThemePreset>;

export type ThemePresetId = keyof typeof themePresets;

export const defaultThemeConfig: ThemeConfig = { preset: "codex", mode: "system", overrides: {} };

export function isThemePreset(value: string): value is ThemePresetId {
  return value in themePresets;
}

export function isThemeMode(value: string): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;
  return { r: parseInt(value.slice(0,2),16), g: parseInt(value.slice(2,4),16), b: parseInt(value.slice(4,6),16) };
}
function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r,g,b].map((v) => Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,"0")).join("");
}
function mix(a: string, b: string, weight: number) {
  const A=hexToRgb(a), B=hexToRgb(b); if(!A || !B) return a;
  return rgbToHex(A.r*(1-weight)+B.r*weight, A.g*(1-weight)+B.g*weight, A.b*(1-weight)+B.b*weight);
}

export function resolveThemePalette(config: ThemeConfig, mode: "light" | "dark") {
  const preset = themePresets[config.preset] ?? themePresets.codex;
  const base = { ...preset[mode] };
  const o = config.overrides ?? {};
  if (o.accent) {
    base.accent = o.accent;
    base.accentBright = mix(o.accent, mode === "dark" ? "#ffffff" : "#000000", mode === "dark" ? .18 : .08);
    base.accentSoft = mix(o.accent, base.surface, .82);
    base.sidebarActive = mix(o.accent, base.sidebar, .84);
  }
  if (o.title) base.text = o.title;
  if (o.body) base.text2 = o.body;
  if (o.muted) base.text3 = o.muted;
  if (o.background) base.background = o.background;
  if (o.surface) {
    base.surface = o.surface;
    base.surfaceAlt = mix(o.surface, mode === "dark" ? "#ffffff" : "#000000", mode === "dark" ? .06 : .04);
  }
  if (o.sidebar) base.sidebar = o.sidebar;
  if (o.sidebarText) base.sidebarText = o.sidebarText;
  if (o.sidebarMuted) base.sidebarMuted = o.sidebarMuted;
  return base;
}

export function resolveThemeVariables(config: ThemeConfig, mode: "light" | "dark") {
  const x = resolveThemePalette(config, mode);
  return {
    "--ink":x.text, "--body-text":x.text, "--ink-2":x.text2, "--ink-3":x.text3,
    "--paper":x.background, "--surface":x.surface, "--surface-2":x.surfaceAlt, "--surface-3":x.surfaceStrong,
    "--line":x.border, "--line-strong":x.borderStrong,
    "--navy":x.accent, "--navy-2":x.accentBright, "--cyan":x.accent, "--cyan-bright":x.accentBright, "--cyan-soft":x.accentSoft,
    "--success":x.success, "--success-soft":x.successSoft, "--warning":x.warning, "--warning-soft":x.warningSoft, "--danger":x.danger, "--danger-soft":x.dangerSoft,
    "--sidebar-bg":x.sidebar, "--sidebar-fg":x.sidebarText, "--sidebar-muted":x.sidebarMuted, "--sidebar-active-bg":x.sidebarActive,
    "--hero-bg":x.hero, "--hero-fg":x.heroText, "--hero-muted":x.heroMuted,
  } as Record<string,string>;
}

export function normalizeThemeConfig(value: Partial<ThemeConfig> | null | undefined): ThemeConfig {
  const preset = value?.preset && isThemePreset(String(value.preset)) ? value.preset as ThemePresetId : defaultThemeConfig.preset;
  const mode = value?.mode && isThemeMode(String(value.mode)) ? value.mode as ThemeMode : defaultThemeConfig.mode;
  const overrides: ThemeOverrides = {};
  for (const key of themeOverrideKeys) {
    const color = value?.overrides?.[key];
    if (typeof color === "string" && /^#[0-9a-fA-F]{6}$/.test(color)) overrides[key] = color;
  }
  return { preset, mode, overrides };
}
