"use client";

import { useState } from "react";
import { Activity, ArrowRight, LockKeyhole, Mail, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const payload = await response.json().catch(() => null);
    if (!response.ok) { setError(payload?.error?.message ?? "登录失败，请重试"); setBusy(false); return; }
    router.replace("/dashboard"); router.refresh();
  }
  return (
    <main className="login-page">
      <section className="login-context" aria-label="产品介绍">
        <div className="brand-lockup"><span className="brand-mark"><Zap size={20} /></span><span>电研工作台</span></div>
        <div className="login-copy">
          <p className="login-date">RESEARCH CONTROL · PRIVATE</p>
          <h1>把今天的行动，接入长期的科研轨迹。</h1>
          <p>项目、论文、专利、成长与晋升证据在同一条工作线上更新。你先看到风险，再看到数字。</p>
        </div>
        <div className="signal-strip" aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span />
        </div>
        <div className="login-proof">
          <Activity size={18} />
          <div><strong>本地私有部署</strong><span>数据与材料留在你的服务器</span></div>
        </div>
      </section>
      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <div><h2>欢迎回来</h2><p>登录后继续今天的研究工作。</p></div>
          <label><span>管理员邮箱</span><div className="input-with-icon"><Mail size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus placeholder="researcher@example.com" /></div></label>
          <label><span>密码</span><div className="input-with-icon"><LockKeyhole size={17} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required placeholder="输入密码" /></div></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button primary wide" type="submit" disabled={busy}>{busy ? "正在验证…" : <>进入工作台 <ArrowRight size={17} /></>}</button>
          <p className="login-help">首次部署的账号来自服务器环境配置；初次登录后请立即修改密码。</p>
        </form>
      </section>
    </main>
  );
}
