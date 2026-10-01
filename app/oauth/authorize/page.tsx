import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck, X } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getWorkbenchName } from "@/lib/app-settings";
import { parseAuthorizationRequest, validateClientMetadata } from "@/lib/oauth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "授权 ChatGPT" };

function toParams(raw: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (typeof value === "string") params.set(key, value);
  }
  return params;
}

function scopeLabel(scope: string) {
  if (scope === "workbench.read") return "读取项目、任务、科研记录、Inbox 与周复盘";
  if (scope === "workbench.write") return "创建和修改研究记录、任务、Inbox 与周复盘";
  if (scope === "offline_access") return "在连接期间刷新访问令牌，避免频繁重新登录";
  return scope;
}

export default async function OAuthAuthorizePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const params = toParams(raw);
  let request;
  try {
    request = parseAuthorizationRequest(params);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid_request";
    return <main className="oauth-page"><section className="oauth-card oauth-error-card"><X size={28}/><h1>无法处理授权请求</h1><p>{message}</p></section></main>;
  }

  const session = await getSession();
  if (!session) {
    const next = "/oauth/authorize?" + params.toString();
    redirect("/login?next=" + encodeURIComponent(next));
  }

  try {
    await validateClientMetadata(request.clientId, request.redirectUri);
  } catch {
    return <main className="oauth-page"><section className="oauth-card oauth-error-card"><X size={28}/><h1>无法验证 ChatGPT OAuth 客户端</h1><p>客户端元数据或回调地址不符合当前授权策略。</p></section></main>;
  }

  const workbenchName = getWorkbenchName();
  return <main className="oauth-page">
    <section className="oauth-card">
      <header className="oauth-card-head"><span><ShieldCheck size={23}/></span><div><strong>连接 ChatGPT</strong><small>{workbenchName}</small></div></header>
      <div className="oauth-copy"><h1>允许 ChatGPT 访问这个工作台？</h1><p>授权后，ChatGPT 可以通过 MCP 在你的 Research Workbench 中读取或执行你允许的操作。</p></div>
      <div className="oauth-account"><span>当前管理员</span><strong>{session.email}</strong></div>
      <div className="oauth-permissions"><strong>本次请求的权限</strong>{request.scopes.map((scope)=><div key={scope}><ShieldCheck size={15}/><span>{scopeLabel(scope)}</span></div>)}</div>
      <p className="oauth-note">访问令牌仅用于这个 MCP 资源；授权可通过失效 OAuth Token 或重新部署密钥来撤销。Codex 的固定 MCP Token 不受此授权影响。</p>
      <form method="post" action="/api/oauth/authorize" className="oauth-actions">
        <input type="hidden" name="csrf" value={session.csrfToken}/>
        <input type="hidden" name="response_type" value="code"/>
        <input type="hidden" name="client_id" value={request.clientId}/>
        <input type="hidden" name="redirect_uri" value={request.redirectUri}/>
        <input type="hidden" name="code_challenge" value={request.codeChallenge}/>
        <input type="hidden" name="code_challenge_method" value="S256"/>
        <input type="hidden" name="resource" value={request.resource}/>
        <input type="hidden" name="scope" value={request.scopes.join(" ")}/>
        {request.state ? <input type="hidden" name="state" value={request.state}/> : null}
        <button className="button ghost" type="submit" name="decision" value="deny">取消</button>
        <button className="button primary" type="submit" name="decision" value="allow">允许连接</button>
      </form>
    </section>
  </main>;
}
