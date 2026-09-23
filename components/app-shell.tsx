"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Award, BookMarked, BookOpenText, BriefcaseBusiness, CalendarCheck2, ChevronRight, FileBadge2, GraduationCap, LayoutDashboard, LogOut, Menu, Moon, Search, Settings, Sun, X, Zap } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { WebMcpTools } from "@/components/webmcp-tools";

const nav = [
  ["/dashboard", "驾驶舱", LayoutDashboard], ["/tasks", "任务中心", CalendarCheck2], ["/projects", "项目管理", BriefcaseBusiness], ["/papers", "论文成果", BookOpenText], ["/literature", "文献库", BookMarked],
  ["/patents", "专利管理", FileBadge2], ["/growth", "个人成长", GraduationCap], ["/promotion", "晋升管理", Award], ["/settings", "系统设置", Settings],
] as const;

const entityPath: Record<string, string> = { projects: "projects", papers: "papers", literature: "literature", patents: "patents", growth: "growth", tasks: "tasks" };

export function AppShell({ children, email, displayName, csrf, mustChangePassword, timeZone }: { children: React.ReactNode; email: string; displayName: string; csrf: string; mustChangePassword: boolean; timeZone: string }) {
  const pathname = usePathname(); const router = useRouter(); const [mobileOpen, setMobileOpen] = useState(false); const [dark, setDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); const [query, setQuery] = useState(""); const [results, setResults] = useState<{ entityType: string; entityId: string; title: string; snippet: string }[]>([]); const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const saved = localStorage.getItem("theme"); const enabled = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches); setDark(enabled); document.documentElement.dataset.theme = enabled ? "dark" : "light"; }, []);
  useEffect(() => { if (!searchOpen || query.trim().length < 2) { setResults([]); return; } const timer = setTimeout(() => { apiFetch<{ items: typeof results }>(`/api/search?q=${encodeURIComponent(query)}`).then((data) => setResults(data.items)).catch(() => setResults([])); }, 220); return () => clearTimeout(timer); }, [query, searchOpen]);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 0); } if (event.key === "Escape") setSearchOpen(false); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);
  function toggleTheme() { const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? "dark" : "light"; localStorage.setItem("theme", next ? "dark" : "light"); }
  async function logout() { await apiFetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); router.refresh(); }
  const initials = (displayName || email).slice(0, 1).toUpperCase();
  return (
    <div className="app-shell" data-csrf={csrf}>
      <WebMcpTools />
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="sidebar-head"><Link href="/dashboard" className="brand-lockup"><span className="brand-mark"><Zap size={18} /></span><span>电研工作台</span></Link><button className="icon-button mobile-only" onClick={() => setMobileOpen(false)} aria-label="关闭导航"><X size={20} /></button></div>
        <nav className="main-nav" aria-label="主导航">
          {nav.map(([href, label, Icon]) => <Link key={href} href={href} className={pathname.startsWith(href) ? "active" : ""} onClick={() => setMobileOpen(false)}><Icon size={18} /><span>{label}</span>{pathname.startsWith(href) && <span className="nav-current" />}</Link>)}
        </nav>
        <div className="sidebar-status"><Activity size={16} /><div><strong>数据留在本机</strong><span>SQLite 与私有附件库</span></div></div>
        <div className="user-chip"><span className="avatar">{initials}</span><div><strong>{displayName}</strong><span>{email}</span></div><button className="icon-button" onClick={logout} aria-label="退出登录" title="退出登录"><LogOut size={17} /></button></div>
      </aside>
      {mobileOpen && <button className="nav-scrim" aria-label="关闭导航" onClick={() => setMobileOpen(false)} />}
      <div className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMobileOpen(true)} aria-label="打开导航"><Menu size={21} /></button>
          <button className="global-search" onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 0); }}><Search size={18} /><span>搜索项目、论文成果、文献、专利或任务</span><kbd>Ctrl K</kbd></button>
          <div className="topbar-actions"><span className="today-label">{new Intl.DateTimeFormat("zh-CN", { timeZone, month: "long", day: "numeric", weekday: "short" }).format(new Date())}</span><button className="icon-button" onClick={toggleTheme} aria-label={dark ? "切换浅色模式" : "切换深色模式"}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button></div>
        </header>
        {mustChangePassword && <Link href="/settings" className="security-banner"><span>初始密码仍在使用，请先更新管理员密码。</span><ChevronRight size={17} /></Link>}
        <div className="page-stage">{children}</div>
      </div>
      {searchOpen && <div className="command-overlay" role="dialog" aria-modal="true" aria-label="全局搜索" onMouseDown={(e) => e.target === e.currentTarget && setSearchOpen(false)}>
        <div className="command-panel"><div className="command-input"><Search size={20} /><input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="输入至少两个字符…" /><button className="icon-button" onClick={() => setSearchOpen(false)} aria-label="关闭"><X size={18} /></button></div>
          <div className="command-results">{query.length < 2 ? <div className="command-hint"><Zap size={22} /><p>输入标题、编号、关键词或研究方向</p></div> : results.length ? results.map((item) => <Link key={`${item.entityType}-${item.entityId}`} href={item.entityType === "tasks" ? "/tasks" : `/${entityPath[item.entityType] ?? item.entityType}/${item.entityId}`} onClick={() => setSearchOpen(false)}><span className="result-type">{item.entityType}</span><div><strong>{item.title}</strong><p dangerouslySetInnerHTML={{ __html: item.snippet }} /></div><ChevronRight size={17} /></Link>) : <div className="command-hint"><Search size={22} /><p>未找到匹配记录</p></div>}</div>
        </div>
      </div>}
    </div>
  );
}
