---
name: 电研工作台
description: Professional scientific personal power-systems workbench for action-first research tracking and promotion evidence.
colors:
  ink: "#10233f"
  ink-muted: "#51647d"
  ink-subtle: "#5f6f82"
  paper: "#f4f7fa"
  surface: "#ffffff"
  surface-2: "#edf2f6"
  surface-3: "#e4ebf1"
  line: "#d9e2e9"
  line-strong: "#c4d1db"
  on-navy: "#ffffff"
  shell-navy: "#071d3b"
  navy: "#082b55"
  navy-2: "#0c3c70"
  panel-navy: "#0a315d"
  cyan: "#06727a"
  cyan-bright: "#26c3c0"
  cyan-soft: "#d9f1f0"
  danger: "#c73f4b"
  danger-soft: "#fae8e9"
  warning: "#955900"
  warning-soft: "#fff0d5"
  success: "#158261"
  success-soft: "#dcf3e9"
  dark-ink: "#e9f2fa"
  dark-ink-muted: "#a7b7ca"
  dark-ink-subtle: "#8da0b5"
  dark-paper: "#071321"
  dark-surface: "#0c1c2d"
  dark-surface-2: "#11263a"
  dark-surface-3: "#173047"
  dark-line: "#21384e"
  dark-line-strong: "#31506b"
  dark-navy: "#dcecff"
  dark-navy-2: "#9ac7ee"
  dark-cyan: "#42cfca"
  dark-cyan-bright: "#52e1db"
  dark-cyan-soft: "#113a42"
  dark-danger: "#ff8f98"
  dark-danger-soft: "#44232d"
  dark-warning: "#f4bd61"
  dark-warning-soft: "#3b2e19"
  dark-success: "#62d6aa"
  dark-success-soft: "#173a31"
typography:
  display:
    fontFamily: "Manrope Variable, Noto Sans SC Variable, sans-serif"
    fontSize: "clamp(40px, 5vw, 72px)"
    fontWeight: 650
    lineHeight: 1.06
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Manrope Variable, Noto Sans SC Variable, sans-serif"
    fontSize: "clamp(25px, 2.3vw, 36px)"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Manrope Variable, Noto Sans SC Variable, sans-serif"
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Noto Sans SC Variable, Microsoft YaHei, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Manrope Variable, Noto Sans SC Variable, sans-serif"
    fontSize: "12px"
    fontWeight: 650
    lineHeight: 1.4
rounded:
  chip: "6px"
  small: "8px"
  control: "10px"
  card: "12px"
  panel: "14px"
  dialog: "16px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  page-inline: "clamp(20px, 3vw, 44px)"
  page-top: "31px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 15px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.navy}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 15px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 15px"
    height: "40px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "9px"
    width: "36px"
    height: "36px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "42px"
  panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "22px"
  status-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    typography: "{typography.label}"
    rounded: "7px"
    padding: "3px 8px"
  status-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    typography: "{typography.label}"
    rounded: "7px"
    padding: "3px 8px"
  status-danger:
    backgroundColor: "{colors.danger-soft}"
    textColor: "{colors.danger}"
    typography: "{typography.label}"
    rounded: "7px"
    padding: "3px 8px"
---

# Design System: 电研工作台

## Overview

**Creative North Star: “The Signal Console”**

电研工作台 is a calm, precise operating surface for a power-systems researcher. The visual language treats attention like an engineering signal: deep navy establishes a stable frame, electric cyan marks the live path, and cool paper surfaces keep dense records readable. It is a working dashboard, not a promotional page; hierarchy and evidence outrank decoration.

The default light theme uses tonal layering, compact controls, and restrained borders to make deadlines, risk, progress, and linked evidence easy to scan. Dark mode keeps the same information architecture while shifting the paper and surfaces into a blue-black range with brighter text and cyan. No photographic or illustrative imagery is part of the system: icons, signal bars, progress tracks, and CSS geometry are sufficient for this operational data UI.

**Key Characteristics:**

- Action before analytics: deadlines and risk lead aggregate output counts.
- Deep navy structure with an electric cyan signal accent.
- Cool, low-contrast surfaces and thin dividers instead of ornamental decoration.
- Chinese-first readability with Manrope numerals and compact metadata.
- Zero-image interface: represent research state with data, icons, and geometry.

## Colors

The palette is a scientific control-room pairing: stable navy for authority, cyan for active signal, cool neutrals for data density, and semantic status colors for risk and completion.

### Primary

- **Deep Research Navy** (`#082b55`): primary actions, detail heroes, promotion headers, and high-priority dashboard surfaces.
- **Shell Navy** (`#071d3b`): persistent navigation rail and login context; it remains the visual anchor across themes.

### Secondary

- **Electric Cyan** (`#06727a`): links, active navigation, progress, icons, focus, and live data signals.
- **Cyan Bright** (`#26c3c0`): high-contrast signal moments such as brand marks and dark-theme primary actions.

### Neutral

- **Ink** (`#10233f`), **Muted Ink** (`#51647d`), and **Subtle Ink** (`#5f6f82`): headings, body copy, labels, and supporting metadata.
- **Cool Paper** (`#f4f7fa`): default application canvas.
- **Surface White** (`#ffffff`), **Surface 2** (`#edf2f6`), and **Surface 3** (`#e4ebf1`): cards, controls, muted regions, and progress tracks.
- **Line** (`#d9e2e9`) and **Strong Line** (`#c4d1db`): quiet separators and control strokes.
- **Semantic status:** success (`#158261` / `#dcf3e9`), warning (`#955900` / `#fff0d5`), and danger (`#c73f4b` / `#fae8e9`) pair a readable foreground with a pale fill.

### Dark theme

When `data-theme="dark"` is present, the paper/surface ramp becomes dark paper (`#071321`), dark surface (`#0c1c2d`), surface 2 (`#11263a`), and surface 3 (`#173047`); text becomes `#e9f2fa`, `#a7b7ca`, and `#8da0b5`; lines become `#21384e` and `#31506b`; cyan becomes `#42cfca` / `#52e1db` with soft fill `#113a42`; and semantic colors use the brighter dark values captured in the frontmatter. Keep the shell navy rail and white-on-navy hierarchy intact.

**The Signal-First Rule.** Cyan is a signal, not a wallpaper: reserve it for active navigation, links, controls, progress, focus, and meaningful status.

## Typography

**Display Font:** Manrope Variable with Noto Sans SC Variable fallback  
**Body Font:** Noto Sans SC Variable with Microsoft YaHei fallback  
**Label/Number Font:** Manrope Variable for headings, compact labels, keyboard hints, and tabular numerals.

**Character:** The pairing is technical and compact without becoming sterile. Chinese body copy gets generous line height; Manrope supplies crisp hierarchy and stable numerals for counts, dates, and progress.

### Hierarchy

- **Display** (650, `clamp(40px, 5vw, 72px)`, `1.06`): login-context statement or other rare, high-level entry message.
- **Headline** (650, `clamp(25px, 2.3vw, 36px)`, `1.2`): page title and primary record heading.
- **Title** (650, `17px`, `1.35`): section headings and panel titles.
- **Body** (400, `15px`, `1.6`; `14px` on small screens): Chinese descriptions, form content, and supporting explanation.
- **Label** (650, `12px`, `1.4`): navigation, metadata, statuses, and compact actions; use 10–11 px only for secondary table metadata.

**The Numeric Clarity Rule.** Use Manrope for prominent counts and tabular numerals, and never rely on color alone to communicate a deadline, priority, or completion state.

## Layout

The shell is a fixed left rail plus a fluid workspace. The rail is 248 px wide on desktop and 220 px below 1180 px; the sticky top bar is 66 px high. Content is centered inside a 1680 px maximum stage with responsive inline padding, starting at 31 px from the top and ending with 64 px breathing room.

The dashboard hierarchy is deliberately operational: page header and actions → attention deck → near-term timeline beside project risk → three-column research pipeline → metric snapshot beside activity feed. The attention deck gives the current action state a dark navy or danger lead cell, then places three metric cells alongside it. Panels use 24 px gaps, 22 px internal padding, and thin lines to keep the grid legible without visual noise.

Responsive behavior is explicit:

- **≤1180 px:** compact rail; dashboard columns tighten; detail fields reduce to two columns; promotion headers reflow.
- **≤900 px:** rail becomes an off-canvas drawer with scrim and menu button; workspace fills the viewport; dashboard/detail/settings grids collapse to one column; the pipeline becomes one column; login becomes stacked.
- **≤640 px:** body type drops to 14 px; page padding becomes 20 px / 14 px; header actions become full-width; attention metrics stack; panel padding becomes 17 px; forms and detail fields become one column; kanban and wide metric tables scroll horizontally rather than shrink below readability.

## Elevation & Depth

Depth is a restrained hybrid: tonal surfaces and 1 px lines do most of the work, while shadows identify a lifted surface or transient layer. Default panels are flat enough to read as a connected workbench; use the softer shadow for data surfaces and cards, and the larger shadow only for drawers, detail heroes, command search, and saved-state feedback.

### Shadow Vocabulary

- **Ambient surface:** `0 8px 24px rgba(10, 42, 75, 0.07)` in light mode; dark mode uses the equivalent black alpha (`0 8px 24px rgba(0, 0, 0, 0.22)`).
- **Lifted layer:** `0 18px 45px rgba(10, 42, 75, 0.1)` in light mode; dark mode uses `0 18px 45px rgba(0, 0, 0, 0.32)`.
- **Transient overlay:** command search and sheets may use a stronger contextual shadow and a blurred dark scrim; do not apply it to routine list rows.

**The Tonal-Depth Rule.** Establish hierarchy with surface, line, and spacing first; use a shadow only when an element is genuinely lifted or transient.

## Shapes

The form language is gently rounded and engineered rather than pill-heavy. Controls, search, and navigation use 10 px corners; cards use 12 px; primary panels use the shared 14 px radius; command dialogs use 16 px. Status badges use 7 px and small chips use 6 px. Borders are 1 px and quiet; dashed borders are reserved for upload/drop affordances. Progress tracks and signal bars are short rounded rectangles, not decorative charts.

## Components

### Buttons

- **Character:** compact, confident, and keyboard-friendly; all variants share a 40 px minimum height, 8 px vertical / 15 px horizontal padding, 10 px radius, and 8 px icon gap.
- **Primary:** deep navy with white text in light mode; dark mode switches to bright cyan with dark paper text. A restrained navy shadow supports the action.
- **Secondary:** surface fill with strong line and navy text; hover shifts the line and fill toward cyan-soft.
- **Ghost / toggle:** transparent muted text for low-emphasis actions; toggles gain cyan text, border, and soft fill when active.
- **Hover / focus:** buttons lift 1 px on hover; all keyboard focus uses the shared 3 px cyan outline with 2 px offset. Disabled controls reduce opacity to 55% and use a not-allowed cursor.

### Icon buttons

Use 36 × 36 px hit areas with a 9 px radius. They are transparent at rest, gain a surface-2 hover fill, and use danger-soft only for destructive hover. Every icon-only action needs an accessible label or title.

### Inputs / Fields

Inputs, selects, and textareas use surface fill, strong line, 10 px radius, 10 px / 12 px padding, and a 42 px minimum height. Focus changes the line to cyan and adds a 3 px cyan-soft ring; disabled fields use surface-2 and subtle ink. Checkboxes are 17 px and use the cyan accent. Labels are stacked with a 7 px gap and 13 px semibold text.

### Cards / Containers

Data surfaces, timeline panels, risk panels, detail sections, promotion snapshots, and activity feeds share surface fill, 1 px line, 14 px radius, and usually 22 px internal padding. A dark navy footer or header is reserved for output summaries, promotion cycles, attention states, and detail heroes. Empty states stay centered, icon-led, and actionable rather than decorative.

### Status badges and progress

Statuses are compact 25 px minimum-height badges with 3 px / 8 px padding and 7 px radius. Success, warning, danger, and priority variants pair semantic text with the corresponding soft fill. Progress tracks are 4–9 px high with surface-3 backing and cyan or navy fills; always include a textual value or label.

### Navigation and search

The sidebar is a persistent dark navy rail with a cyan brand mark, 43 px navigation rows, 10 px row radius, muted inactive text, and a cyan active indicator. At 900 px it becomes an off-canvas drawer with a scrim. The top bar remains sticky and carries global search, date context, and theme toggle. Global search opens a centered command panel with a 60 px input row, 16 px dialog radius, 4 px blurred scrim, keyboard shortcut hint, and escape-to-close behavior.

### Drawers, dialogs, and task board

Create/edit forms use a right-side sheet up to 610 px wide with an 82 px header, scrollable 2-column form grid, and 74 px footer; at 640 px the form becomes one column. Import uses a wider 760 px sheet and a dashed 280 px drop zone. The task board keeps four readable columns with horizontal overflow; cards use 12 px radius, 14 px padding, 9 px gaps, and short cyan-soft action buttons.

## Do's and Don'ts

### Do:

- **Do** keep the light theme as the default and preserve the same semantic roles when adding dark-mode tokens.
- **Do** lead dashboard surfaces with deadlines, risk, and next actions before aggregate counts.
- **Do** use cyan sparingly for active state, links, progress, focus, and signal-bearing icons.
- **Do** preserve Chinese readability, visible focus, keyboard operation, and 200% text-zoom behavior.
- **Do** use icons, dividers, progress, and CSS geometry to communicate power-systems context; this UI intentionally ships with zero images.
- **Do** respect reduced-motion preferences; transitions and skeleton shimmer must collapse to near-instant motion.

### Don't:

- **Don't** add stock photography, decorative hero illustrations, or image-heavy backgrounds to operational screens.
- **Don't** use cyan as a large decorative fill or as the only distinction between status states.
- **Don't** replace the action-first dashboard hierarchy with a marketing-style hero or oversized visualization.
- **Don't** shrink tables, kanban columns, or form controls below their readable widths; allow the established horizontal scroll behavior.
- **Don't** introduce sharp corners, excessive pills, heavy gradients, or unscoped shadows that compete with the signal hierarchy.
