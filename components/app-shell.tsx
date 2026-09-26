"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Award, Beaker, BookMarked, BookOpenText, BriefcaseBusiness, CalendarCheck2, CalendarRange, ChevronRight, ClipboardCheck, FileBadge2, GraduationCap, Inbox, LayoutDashboard, LogOut, Menu, Moon, Plus, Search, Settings, Sun, X, Zap } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { WebMcpTools } from "@/components/webmcp-tools";
import { applyThemeConfig, readStoredThemeConfig } from "@/lib/theme-client";
import type { ThemeConfig } from "@/lib/theme-presets";
import { QuickCaptureDialog } from "@/components/quick-capture-dialog";

const navGroups = [
  { label: "工作", items: [["/dashboard","总览",LayoutDashboard],["/focus","今日",CalendarRange],["/inbox","收集箱",Inbox],["/tasks","任务中心",CalendarCheck2],["/projects","项目管理",BriefcaseBusiness]] },
  { label: "研究", items: [["/research","科研过程",Beaker],["/papers","论文成果",BookOpenText],["/literature","文献库",BookMarked],["/patents","专利管理",FileBadge2]] },
  { label: "成长", items: [["/growth","个人成长",GraduationCap],["/promotion","晋升管理",Award],["/reviews","复盘中心",ClipboardCheck]] },
  { label: "系统", items: [["/settings","系统设置",Settings]] },
] as const;
const nav = navGroups.flatMap((group) => group.items);

const entityPath: Record<string, string> = { projects: "projects", papers: "papers", literature: "literature", questions: "questions", hypotheses: "hypotheses", experiments: "experiments", runs: "runs", findings: "findings", artifacts: "artifacts", patents: "patents", growth: "growth", tasks: "tasks" };

export function AppShell({ children, workbenchName, email, displayName, avatarUrl, csrf, timeZone, initialTheme }: { children: React.ReactNode; workbenchName: string; email: string; displayName: string; avatarUrl: string | null; csrf: string; timeZone: string; initialTheme: ThemeConfig }) {
  const pathname = usePathname(); const router = useRouter(); const [mobileOpen, setMobileOpen] = useState(false); const [pendingHref, setPendingHref] = useState<string | null>(null); const [quickOpen, setQuickOpen] = useState(false); const [dark, setDark] = useState(false); const [themeConfig, setThemeConfig] = useState<ThemeConfig>(initialTheme); const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(avatarUrl);
  const [searchOpen, setSearchOpen] = useState(false); const [query, setQuery] = useState(""); const [results, setResults] = useState<{ entityType: string; entityId: string; title: string; snippet: string }[]>([]); const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const config = readStoredThemeConfig(initialTheme); const applied = applyThemeConfig(config, true); setThemeConfig(applied.config); setDark(applied.mode === "dark"); const media = window.matchMedia("(prefers-color-scheme: dark)"); const onSystem = () => { if (config.mode === "system") { const next = applyThemeConfig(config, false); setDark(next.mode === "dark"); } }; media.addEventListener("change", onSystem); return () => media.removeEventListener("change", onSystem); }, [initialTheme]);
  useEffect(() => { const handler = (event: Event) => { const config = (event as CustomEvent<ThemeConfig>).detail; const applied = applyThemeConfig(config, true); setThemeConfig(applied.config); setDark(applied.mode === "dark"); }; window.addEventListener("workbench-theme-change", handler); return () => window.removeEventListener("workbench-theme-change", handler); }, []);
  useEffect(() => { setPendingHref(null); }, [pathname]);
  useEffect(() => {
    const timers: number[] = [];
    const prefetch = () => nav.forEach(([href], index) => timers.push(window.setTimeout(() => router.prefetch(href), index * 90)));
    const idleWindow = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(prefetch, { timeout: 1800 });
      return () => { idleWindow.cancelIdleCallback?.(handle); timers.forEach((timer) => window.clearTimeout(timer)); };
    }
    const handle = window.setTimeout(prefetch, 900);
    return () => { window.clearTimeout(handle); timers.forEach((timer) => window.clearTimeout(timer)); };
  }, [router]);
  useEffect(() => { if (!searchOpen || query.trim().length < 2) { setResults([]); return; } const timer = setTimeout(() => { apiFetch<{ items: typeof results }>(`/api/search?q=${encodeURIComponent(query)}`).then((data) => setResults(data.items)).catch(() => setResults([])); }, 220); return () => clearTimeout(timer); }, [query, searchOpen]);
  useEffect(() => { const avatarHandler = (event: Event) => setCurrentAvatarUrl((event as CustomEvent<{ url: string | null }>).detail.url); window.addEventListener("profile-avatar-changed", avatarHandler); return () => window.removeEventListener("profile-avatar-changed", avatarHandler); }, []);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "n") { event.preventDefault(); setSearchOpen(false); setQuickOpen(true); return; } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setQuickOpen(false); setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 0); } if (event.key === "Escape") { setSearchOpen(false); setQuickOpen(false); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);
  function toggleTheme() { const next = { ...themeConfig, mode: dark ? "light" : "dark" } as ThemeConfig; const applied = applyThemeConfig(next, true); setThemeConfig(applied.config); setDark(applied.mode === "dark"); window.dispatchEvent(new CustomEvent("workbench-theme-change", { detail: applied.config })); }
  async function logout() { await apiFetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }
  function beginNavigation(href: string) {
    if (!pathname.startsWith(href)) setPendingHref(href);
    setMobileOpen(false);
  }
  const navPath = pendingHref ?? pathname;
  const initials = (displayName || email).slice(0, 1).toUpperCase();
  return (
    <div className="app-shell" data-csrf={csrf} data-timezone={timeZone}>
      <WebMcpTools />
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-head"><Link href="/dashboard" className="brand-lockup"><span className="brand-mark"><Zap size={18} /></span><span>{workbenchName}</span></Link><button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label="关闭导航"><X size={20} /></button></div>
        <nav className="main-nav" aria-label="主导航">
          {navGroups.map((group) => <div className="nav-group" key={group.label}><span className="nav-group-label">{group.label}</span>{group.items.map(([href,label,Icon]) => <Link key={href} href={href} prefetch onMouseEnter={() => router.prefetch(href)} onFocus={() => router.prefetch(href)} className={`${navPath.startsWith(href) ? "active" : ""} ${pendingHref === href ? "pending" : ""}`.trim()} onClick={() => beginNavigation(href)}><Icon size={18}/><span>{label}</span>{navPath.startsWith(href)&&<span className="nav-current"/>}</Link>)}</div>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="user-chip">{currentAvatarUrl ? <img className="avatar avatar-image" src={currentAvatarUrl} alt={displayName} onError={() => setCurrentAvatarUrl(null)} /> : <span className="avatar">{initials}</span>}<div><strong>{displayName}</strong><span>{email}</span></div><Link className="icon-button" href="/settings" aria-label="个人设置" title="个人设置"><Settings size={16} /></Link><button className="icon-button" onClick={logout} aria-label="退出登录" title="退出登录"><LogOut size={17} /></button></div>
      </aside>
      {mobileOpen && <button className="nav-scrim" aria-label="关闭导航" onClick={() => setMobileOpen(false)} />}
      {pendingHref && <div className="navigation-progress" role="progressbar" aria-label="正在切换页面"><i /></div>}
      <div className="workspace" aria-busy={Boolean(pendingHref)}>
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(true)} aria-label="打开导航"><Menu size={21} /></button><Link href="/dashboard" className="mobile-top-brand mobile-only">{workbenchName}</Link>
          <button className="quick-capture-trigger" onClick={() => { setSearchOpen(false); setQuickOpen(true); }} title="Ctrl + Shift + N"><Plus size={17}/><span>快速记录</span></button><button className="global-search" onClick={() => { setQuickOpen(false); setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 0); }}><Search size={18} /><span>搜索项目、科研过程、论文成果、文献、专利或任务</span><kbd>Ctrl K</kbd></button>
          <div className="topbar-actions"><span className="today-label">{new Intl.DateTimeFormat("zh-CN", { timeZone, month: "long", day: "numeric", weekday: "short" }).format(new Date())}</span><button className="icon-button" onClick={toggleTheme} aria-label={dark ? "切换浅色模式" : "切换深色模式"}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button></div>
        </header>
        <div className="page-stage">{children}</div>
      </div>
      <QuickCaptureDialog open={quickOpen} onClose={() => setQuickOpen(false)} onSaved={() => { router.refresh(); window.dispatchEvent(new Event("workbench-data-changed")); }} />
      {searchOpen && <div className="command-overlay" role="dialog" aria-modal="true" aria-label="全局搜索" onMouseDown={(e) => e.target === e.currentTarget && setSearchOpen(false)}>
        <div className="command-panel"><div className="command-input"><Search size={20} /><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="输入至少两个字符…" /><button className="icon-button" onClick={() => setSearchOpen(false)} aria-label="关闭"><X size={18} /></button></div>
          <div className="command-results">{query.length < 2 ? <div className="command-hint"><Zap size={22} /><p>输入标题、编号、关键词或研究方向</p></div> : results.length ? results.map((item) => <Link key={`${item.entityType}-${item.entityId}`} href={item.entityType === "tasks" ? "/tasks" : `/${entityPath[item.entityType] ?? item.entityType}/${item.entityId}`} onClick={() => setSearchOpen(false)}><span className="result-type">{item.entityType}</span><div><strong>{item.title}</strong><p dangerouslySetInnerHTML={{ __html: item.snippet }} /></div><ChevronRight size={17} /></Link>) : <div className="command-hint"><Search size={22} /><p>未找到匹配记录</p></div>}</div>
        </div>
      </div>}
    </div>
  );
}
