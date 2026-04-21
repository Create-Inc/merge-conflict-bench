import { useCallback, useEffect, useMemo, useState } from "react";
import { Link2, LogOut, CheckCircle2, AlertTriangle } from "lucide-react";
import { useMetaConnection } from "../../../../hooks/useMetaConnection";
import {
  useDisconnectMeta,
  useSelectMetaPage,
} from "../../../../hooks/useMetaActions";

export function MetaConnectSection({ businessId, setError, setSuccess }) {
  const [selectedPageId, setSelectedPageId] = useState("");
  const [inlineMessage, setInlineMessage] = useState(null);
  const [inlineMessageTone, setInlineMessageTone] = useState("info");

  const metaQuery = useMetaConnection(businessId);
  const meta = metaQuery.data;

  const selectPageMutation = useSelectMetaPage(businessId);
  const disconnectMutation = useDisconnectMeta(businessId);

  const connected = Boolean(meta?.connected);
  const pageName = typeof meta?.pageName === "string" ? meta.pageName : "";
  const instagramConnected = Boolean(meta?.instagramConnected);
  const instagramUsername =
    typeof meta?.instagramUsername === "string" ? meta.instagramUsername : "";

  const connectedAsName =
    typeof meta?.connectedAsName === "string" ? meta.connectedAsName : "";

  const pages = useMemo(() => {
    const list = meta?.pages;
    return Array.isArray(list) ? list : [];
  }, [meta?.pages]);

  const needsPageSelection =
    Boolean(meta?.needsPageSelection) && pages.length > 0;

  useEffect(() => {
    if (needsPageSelection && !selectedPageId) {
      setSelectedPageId(pages[0]?.id || "");
    }
  }, [needsPageSelection, pages, selectedPageId]);

  useEffect(() => {
    // keep the inline message short-lived so it doesn't clutter the page
    if (!inlineMessage) {
      return;
    }
    const t = setTimeout(() => setInlineMessage(null), 3500);
    return () => clearTimeout(t);
  }, [inlineMessage]);

  useEffect(() => {
    // After redirect back from OAuth, show a quick helpful message.
    if (typeof window === "undefined") {
      return;
    }

    const sp = new URLSearchParams(window.location.search);
    const metaParam = sp.get("meta");

    if (!metaParam) {
      return;
    }

    if (metaParam === "connected") {
      setInlineMessageTone("success");
      setInlineMessage("Meta connected.");
    } else if (metaParam === "pick_page") {
      setInlineMessageTone("success");
      setInlineMessage(
        "Meta connected — now pick the Facebook Page to post from.",
      );
<<<<<<< ours
    } else if (metaParam === "forbidden") {
      setInlineMessageTone("error");
      setInlineMessage(
        "You don’t have access to connect Meta for this dashboard. Make sure you’re signed in with the same email used for this business.",
      );
    } else if (metaParam === "config_error") {
      setInlineMessageTone("error");
      setInlineMessage(
        "Meta connect isn’t configured yet (missing Meta App settings). Please reach out and we’ll fix it.",
      );
=======
    } else if (metaParam === "signin_required") {
      setInlineMessageTone("error");
      setInlineMessage("Please sign in to connect Meta.");
    } else if (metaParam === "forbidden") {
      setInlineMessageTone("error");
      setInlineMessage(
        "You don't have access to connect Meta for this business. Check you're signed in with the right email.",
      );
    } else if (metaParam === "config_error") {
      setInlineMessageTone("error");
      setInlineMessage(
        "Meta connect isn't configured on the server yet. Please try again in a moment.",
      );
>>>>>>> theirs
    } else if (metaParam === "error") {
      setInlineMessageTone("error");
      setInlineMessage("Meta connect failed. Please try again.");
    }

    // Clean URL so refresh doesn't re-show the message
    sp.delete("meta");
    const next = sp.toString();
    const nextUrl = `${window.location.pathname}${next ? `?${next}` : ""}`;
    window.history.replaceState({}, "", nextUrl);
  }, []);

  const statusLabel = useMemo(() => {
    if (!connected) {
      return "Not connected";
    }
    if (needsPageSelection) {
      return "Connected — pick a Page";
    }
    if (connected && pageName) {
      return `Connected to ${pageName}`;
    }
    return "Connected";
  }, [connected, needsPageSelection, pageName]);

  const onSelectPage = useCallback(async () => {
    if (!businessId) {
      setInlineMessageTone("error");
      setInlineMessage("Missing business id — please refresh this page.");
      setError("Missing business id — please refresh this page.");
      return;
    }

    if (!selectedPageId) {
      setInlineMessageTone("error");
      setInlineMessage("Pick a Facebook Page.");
      setError("Pick a Facebook Page.");
      return;
    }

    setError(null);
    setSuccess(null);
    setInlineMessage(null);

    try {
      await selectPageMutation.mutateAsync({ pageId: selectedPageId });
      setSelectedPageId("");
      setInlineMessageTone("success");
      setInlineMessage("Meta Page selected.");
      setSuccess("Meta Page selected.");
    } catch (e) {
      console.error(e);
      const msg = e?.message || "Could not select Page";
      setInlineMessageTone("error");
      setInlineMessage(msg);
      setError(msg);
    }
  }, [businessId, selectedPageId, selectPageMutation, setError, setSuccess]);

  const onDisconnect = useCallback(async () => {
    if (!businessId) {
      setInlineMessageTone("error");
      setInlineMessage("Missing business id — please refresh this page.");
      setError("Missing business id — please refresh this page.");
      return;
    }

    setError(null);
    setSuccess(null);
    setInlineMessage(null);

    try {
      await disconnectMutation.mutateAsync();
      setSelectedPageId("");
      setInlineMessageTone("success");
      setInlineMessage("Disconnected Meta.");
      setSuccess("Disconnected Meta.");
    } catch (e) {
      console.error(e);
      const msg = e?.message || "Could not disconnect";
      setInlineMessageTone("error");
      setInlineMessage(msg);
      setError(msg);
    }
  }, [businessId, disconnectMutation, setError, setSuccess]);

  const disconnectDisabled =
    disconnectMutation.isPending || selectPageMutation.isPending;

  const instagramStatus = instagramConnected
    ? instagramUsername
      ? `Instagram connected (@${instagramUsername})`
      : "Instagram connected"
    : "Instagram not detected (must be a Business/Creator account linked to your Facebook Page)";

  const inlineMessageClasses =
    inlineMessageTone === "success"
      ? "mt-4 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800/30 text-teal-800 dark:text-teal-200"
      : inlineMessageTone === "error"
        ? "mt-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300"
        : "mt-4 bg-[#F7F8FA] dark:bg-white/5 border border-[#E9EAEC] dark:border-white/10 text-[#111418] dark:text-white/80";

  const oauthHref = businessId
    ? `/api/meta/oauth/start?businessId=${encodeURIComponent(String(businessId))}`
    : "";

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-[#E9EAEC] dark:border-white/10 rounded-2xl p-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#E8FAFF] dark:bg-[#30BAD8]/15 border border-[#30BAD8]/20 flex items-center justify-center">
          <Link2 size={18} className="text-[#30BAD8] dark:text-[#9FEAFF]" />
        </div>
        <div className="flex-1">
          <div className="font-extrabold text-[#111418] dark:text-white/85">
            Connect Meta (Facebook + Instagram)
          </div>
          <div className="text-sm text-[#60646C] dark:text-white/65">
            One-click connect. This lets Content Studio publish directly to your
            Facebook Page — and Instagram if your IG Business account is linked.
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3 flex-col sm:flex-row">
        <div>
          <div className="text-xs font-semibold text-[#60646C] dark:text-white/60">
            Status
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#111418] dark:text-white/80">
            {connected && !needsPageSelection ? (
              <CheckCircle2 size={16} className="text-teal-600" />
            ) : (
              <AlertTriangle size={16} className="text-amber-600" />
            )}
            <span>{statusLabel}</span>
          </div>

          {connectedAsName ? (
            <div className="mt-1 text-xs text-[#60646C] dark:text-white/60">
              Connected as {connectedAsName}
            </div>
          ) : null}

          {connected ? (
            <div className="mt-1 text-xs text-[#60646C] dark:text-white/60">
              {instagramStatus}
            </div>
          ) : null}
        </div>

        {connected ? (
          <button
            type="button"
            onClick={onDisconnect}
            disabled={disconnectDisabled}
            className="inline-flex items-center justify-center gap-2 bg-white dark:bg-[#1E1E1E] border border-[#E9EAEC] dark:border-white/15 hover:bg-[#F5F5F5] dark:hover:bg-white/10 text-[#111418] dark:text-white/80 font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LogOut size={16} />
            {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect"}
          </button>
        ) : null}
      </div>

      {!connected ? (
        <div className="mt-5">
          <a
            href={oauthHref}
            className={`inline-flex items-center justify-center gap-2 bg-[#30BAD8] hover:bg-[#2799B8] text-white font-bold px-5 py-3 rounded-xl transition-colors ${
              !oauthHref ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            Connect with Facebook
          </a>

          <div className="mt-3 text-xs text-[#60646C] dark:text-white/60">
            You’ll be asked to sign in and approve access. Then we’ll bring you
            right back here.
          </div>
        </div>
      ) : null}

      {needsPageSelection ? (
        <div className="mt-4 border border-[#E9EAEC] dark:border-white/10 rounded-2xl p-4 bg-[#F7F8FA] dark:bg-white/5">
          <div className="text-sm font-bold text-[#111418] dark:text-white/85">
            Pick the Page you want to post from
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              className="sm:col-span-2 w-full px-4 py-3 bg-white dark:bg-[#2D2D2D] border border-[#E9EAEC] dark:border-white/20 rounded-xl text-[#111418] dark:text-white/85 focus:outline-none"
            >
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onSelectPage}
              disabled={selectPageMutation.isPending || !selectedPageId}
              className="inline-flex items-center justify-center bg-white dark:bg-[#1E1E1E] border border-[#E9EAEC] dark:border-white/15 hover:bg-[#FFFFFF] dark:hover:bg-white/10 text-[#111418] dark:text-white/80 font-semibold px-4 py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {selectPageMutation.isPending ? "Saving…" : "Use this Page"}
            </button>
          </div>
        </div>
      ) : null}

      {inlineMessage ? (
        <div className={`${inlineMessageClasses} rounded-xl p-4 text-sm`}>
          {inlineMessage}
        </div>
      ) : null}

      {metaQuery.isLoading ? (
        <div className="mt-4 text-sm text-[#60646C] dark:text-white/65">
          Loading Meta status…
        </div>
      ) : null}
    </div>
  );
}
