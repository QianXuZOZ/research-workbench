"use client";

import { Check, Monitor, Moon, RotateCcw, Sun } from "lucide-react";
import { applyThemeConfig } from "@/lib/theme-client";
import { defaultThemeConfig, normalizeThemeConfig, resolveThemePalette, themeOverrideKeys, themePresets, type ThemeConfig, type ThemeMode, type ThemeOverrideKey, type ThemePresetId } from "@/lib/theme-presets";

const labels: Record<ThemeOverrideKey,string> = {
  accent:"主题强调色", title:"标题 / 关键文字", body:"正文文字", muted:"次级文字", background:"页面背景", surface:"卡片背景", sidebar:"侧栏背景",
};

export function ThemeCenter({ value, onChange, onSave, saving }: { value: ThemeConfig; onChange: (value: ThemeConfig) => void; onSave: () => void; saving: boolean }) {
  const config = normalizeThemeConfig(value);
  const previewMode: "light" | "dark" = config.mode === "dark" ? "dark" : config.mode === "light" ? "light" : (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const palette = resolveThemePalette(config, previewMode);

  function update(next: ThemeConfig) {
    const normalized = normalizeThemeConfig(next);
    onChange(normalized);
    applyThemeConfig(normalized, true);
    window.dispatchEvent(new CustomEvent("workbench-theme-change", { detail: normalized }));
  }
  function choosePreset(preset: ThemePresetId) { update({ ...config, preset, overrides: {} }); }
  function setMode(mode: ThemeMode) { update({ ...config, mode }); }
  function setOverride(key: ThemeOverrideKey, color: string) { update({ ...config, overrides: { ...config.overrides, [key]: color } }); }
  function clearOverride(key: ThemeOverrideKey) { const overrides={...config.overrides}; delete overrides[key]; update({ ...config, overrides }); }
  function reset() { update(defaultThemeConfig); }

  return <section id="appearance" className="settings-section theme-center">
    <header><span><Sun size={19} /></span><div><h2>主题中心</h2><p>选择完整主题，也可以单独覆盖关键文字、强调色和界面背景。</p></div></header>

    <div className="theme-mode-switch" role="group" aria-label="明暗模式">
      <button type="button" className={config.mode==="light"?"active":""} onClick={()=>setMode("light")}><Sun size={15}/>浅色</button>
      <button type="button" className={config.mode==="dark"?"active":""} onClick={()=>setMode("dark")}><Moon size={15}/>深色</button>
      <button type="button" className={config.mode==="system"?"active":""} onClick={()=>setMode("system")}><Monitor size={15}/>跟随系统</button>
    </div>

    <div className="theme-center-layout">
      <div>
        <div className="theme-section-title"><div><strong>主题预设</strong><span>参考常用编辑器与生产力工具的配色语言</span></div></div>
        <div className="theme-preset-grid">{(Object.entries(themePresets) as [ThemePresetId,(typeof themePresets)[ThemePresetId]][]).map(([id,preset]) => {
          const swatch = preset[previewMode];
          return <button type="button" key={id} className={`theme-preset-card ${config.preset===id?"selected":""}`} onClick={()=>choosePreset(id)}>
            <span className="theme-swatch" style={{background:swatch.background}}><i style={{background:swatch.sidebar}}/><b style={{background:swatch.surface}}/><em style={{background:swatch.accent}}/></span>
            <span className="theme-preset-copy"><strong>{preset.name}</strong><small>{preset.description}</small></span>
            {config.preset===id && <span className="theme-selected"><Check size={13}/></span>}
          </button>;
        })}</div>
      </div>

      <aside className="theme-live-preview" style={{background:palette.background,color:palette.text,borderColor:palette.border}}>
        <div className="theme-preview-sidebar" style={{background:palette.sidebar,color:palette.sidebarText}}><b>电研</b><i style={{background:palette.sidebarActive,color:palette.accent}}>总览</i><span>项目</span><span>科研</span><span>论文</span></div>
        <div className="theme-preview-main"><small style={{color:palette.text3}}>主题实时预览</small><h3>科研工作总览</h3><p style={{color:palette.text2}}>关键文字、正文、次级信息和强调色会同时反映在这里。</p><div className="theme-preview-cards"><i style={{background:palette.surface,borderColor:palette.border}}/><i style={{background:palette.surface,borderColor:palette.border}}/><i style={{background:palette.accent}}/></div><button type="button" style={{background:palette.accent,color:previewMode==="dark"?"#111":"#fff"}}>新建记录</button></div>
      </aside>
    </div>

    <div className="theme-customize">
      <div className="theme-section-title"><div><strong>自定义关键颜色</strong><span>修改后立即预览；“跟随主题”表示不覆盖当前预设</span></div><button type="button" className="button ghost" onClick={reset}><RotateCcw size={14}/>恢复 Codex 默认</button></div>
      <div className="theme-color-grid">{themeOverrideKeys.map((key) => {
        const fallback = key==="accent"?palette.accent:key==="title"?palette.text:key==="body"?palette.text2:key==="muted"?palette.text3:key==="background"?palette.background:key==="surface"?palette.surface:palette.sidebar;
        const value = config.overrides[key] ?? fallback;
        return <label className="theme-color-control" key={key}><span>{labels[key]}<small>{config.overrides[key]?"已覆盖":"跟随主题"}</small></span><div><input type="color" value={value} onChange={(e)=>setOverride(key,e.target.value)}/><code>{value.toUpperCase()}</code>{config.overrides[key] && <button type="button" onClick={()=>clearOverride(key)} aria-label={`恢复${labels[key]}`}><RotateCcw size={13}/></button>}</div></label>;
      })}</div>
    </div>
    <div className="settings-actions"><button type="button" className="button primary" onClick={onSave} disabled={saving}><Check size={16}/>保存主题设置</button></div>
  </section>;
}
