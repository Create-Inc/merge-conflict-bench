import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Copy,
  Shield,
  Users,
  Eye,
  X,
} from "lucide-react";
import useUser from "@/utils/useUser";

function safeRoomName(campaignId, title) {
  const base = title ? String(title) : "campaign";
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `anything-${campaignId}-${slug || "room"}`;
}

async function ensureJitsiScript() {
  if (typeof window === "undefined") return;
  if (window.JitsiMeetExternalAPI) return;

  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-jitsi="1"]');
    if (existing) {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }

    const s = document.createElement("script");
    s.src = "https://meet.jit.si/external_api.js";
    s.async = true;
    s.dataset.jitsi = "1";
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

export default function CampaignCallPanel({
  campaignId,
  campaignTitle,
  isOwner,
  maxPlayers,
  compact = false,
  showRoster = true,
  rosterMode = "full", // "full" | "speaker_only"
}) {
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);
  const [joinRole, setJoinRole] = useState(null); // 'player' | 'viewer'
  const [speakingName, setSpeakingName] = useState(null);

  const roomName = useMemo(
    () => safeRoomName(campaignId, campaignTitle),
    [campaignId, campaignTitle],
  );

  const roomUrl = useMemo(
    () => `https://meet.jit.si/${encodeURIComponent(roomName)}`,
    [roomName],
  );

  const { data: presenceData } = useQuery({
    queryKey: ["campaignCallPresence", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/call-presence`);
      if (!res.ok) {
        throw new Error(
          `When fetching /api/campaigns/${campaignId}/call-presence, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    enabled: !!campaignId,
    refetchInterval: joined ? 5000 : 12000,
  });

  const presence = presenceData?.presence || [];
  const playerCount = presence.filter(
    (p) => p.presence_role === "player",
  ).length;
  const viewerCount = presence.filter(
    (p) => p.presence_role === "viewer",
  ).length;

  const maxPlayersNumber = Number.isFinite(Number(maxPlayers))
    ? Number(maxPlayers)
    : null;
  const isPlayerFull =
    maxPlayersNumber !== null && maxPlayersNumber > 0
      ? playerCount >= maxPlayersNumber
      : false;

  const presenceMutation = useMutation({
    mutationFn: async ({ role }) => {
      const res = await fetch(`/api/campaigns/${campaignId}/call-presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Could not update presence");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["campaignCallPresence", campaignId],
      });
    },
    onError: (e) => {
      console.error(e);
    },
  });

  const leavePresenceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}/call-presence`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Could not leave");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["campaignCallPresence", campaignId],
      });
    },
    onError: (e) => {
      console.error(e);
    },
  });

  const kickMutation = useMutation({
    mutationFn: async (targetUserId) => {
      const res = await fetch(
        `/api/campaigns/${campaignId}/call-presence?targetUserId=${targetUserId}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Could not remove");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["campaignCallPresence", campaignId],
      });
    },
    onError: (e) => {
      console.error(e);
    },
  });

  const clearPresenceMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/campaigns/${campaignId}/call-presence?all=1`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Could not clear");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["campaignCallPresence", campaignId],
      });
    },
    onError: (e) => {
      console.error(e);
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({ targetUserId, role }) => {
      const res = await fetch(`/api/campaigns/${campaignId}/call-presence`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, role }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Could not update role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["campaignCallPresence", campaignId],
      });
    },
    onError: (e) => {
      console.error(e);
    },
  });

  useEffect(() => {
    return () => {
      try {
        if (apiRef.current) {
          apiRef.current.dispose();
          apiRef.current = null;
        }
      } catch {
        // ignore
      }
      // best-effort cleanup
      if (campaignId) {
        leavePresenceMutation.mutate();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSpeakingFromParticipantId = (participantId) => {
    try {
      if (!apiRef.current) return;
      const participants = apiRef.current.getParticipantsInfo?.() || [];
      const match = participants.find((p) => p.participantId === participantId);
      const name = match?.displayName || null;
      setSpeakingName(name);
    } catch (e) {
      console.error(e);
    }
  };

  const join = async (role) => {
    if (joined) return;
    setError(null);

    if (!isOwner && role === "player" && isPlayerFull) {
      setError("Player slots are full. Join as a viewer instead.");
      return;
    }

    try {
      await ensureJitsiScript();
      if (!containerRef.current) return;

      // Mark presence first (so GM can see you in the in-app roster)
      setJoinRole(role);
      presenceMutation.mutate({ role });

      // Clear any prior iframe
      containerRef.current.innerHTML = "";

      const domain = "meet.jit.si";
      const baseName = user?.name || user?.email || "Player";
      const displayName = role === "viewer" ? `${baseName} (Viewer)` : baseName;

      const viewerDefaults = role === "viewer";

      const options = {
        roomName,
        parentNode: containerRef.current,
        userInfo: { displayName },
        configOverwrite: {
          prejoinPageEnabled: true,
          disableDeepLinking: true,
          startWithAudioMuted: viewerDefaults,
          startWithVideoMuted: viewerDefaults,
        },
        interfaceConfigOverwrite: {
          // keep defaults
        },
      };

      // eslint-disable-next-line no-undef
      const api = new window.JitsiMeetExternalAPI(domain, options);
      apiRef.current = api;
      setJoined(true);
      setSpeakingName(null);

      api.addListener("dominantSpeakerChanged", (participantId) => {
        updateSpeakingFromParticipantId(participantId);
      });

      api.addListener("readyToClose", () => {
        setJoined(false);
        setJoinRole(null);
        setSpeakingName(null);
        leavePresenceMutation.mutate();
      });
    } catch (e) {
      console.error(e);
      setError("Could not start the call. Please try again.");
      setJoinRole(null);
      setSpeakingName(null);
      leavePresenceMutation.mutate();
    }
  };

  const leave = () => {
    try {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    } catch {
      // ignore
    }
    setJoined(false);
    setJoinRole(null);
    leavePresenceMutation.mutate();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
    } catch {
      // ignore
    }
  };

  const execute = (command) => {
    try {
      if (!apiRef.current) return;
      apiRef.current.executeCommand(command);
    } catch (e) {
      console.error(e);
    }
  };

  const maxLabel = maxPlayersNumber ? `${maxPlayersNumber}` : "∞";
  const speakingLabel = speakingName ? speakingName : joined ? "—" : null;

<<<<<<< ours
  // in the sidebar/compact call panel, only show who is speaking + viewer count
  const showCountsInHeader = !compact;
=======
  const iframeHeightClass = compact ? "h-[160px]" : "h-[540px]";
>>>>>>> theirs

<<<<<<< ours
  const iframeHeightClass = compact ? "h-[180px]" : "h-[540px]";

=======
  const normalizeDisplayName = (name) => {
    if (!name) return "";
    return String(name)
      .replace(/\s*\(Viewer\)\s*$/i, "")
      .trim();
  };

  const speakingPresence = useMemo(() => {
    if (!speakingName) return null;
    const normalized = normalizeDisplayName(speakingName).toLowerCase();
    if (!normalized) return null;
    return (
      presence.find(
        (p) => String(p.display_name || "").toLowerCase() === normalized,
      ) || null
    );
  }, [presence, speakingName]);

  const shouldShowRosterList = showRoster && !compact && rosterMode === "full";
  const shouldShowSpeakerCard = rosterMode === "speaker_only";

  const viewerCountLabel = viewerCount > 0 ? `${viewerCount}` : null;
  const viewerInline = viewerCountLabel
    ? ` • Viewers: ${viewerCountLabel}`
    : "";
  const countsLine = `Players: ${playerCount}/${maxLabel}${viewerInline}`;

  const speakerViewersLine = viewerCount > 0 ? `Viewers: ${viewerCount}` : "";
  const fallbackSpeakerLine = speakingName
    ? `Speaking: ${speakingName}`
    : "No one yet.";
  const fallbackSpeakerWithViewers =
    viewerCount > 0
      ? `${fallbackSpeakerLine} • Viewers: ${viewerCount}`
      : fallbackSpeakerLine;

>>>>>>> theirs
  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="bg-[#121212] border border-gray-700 rounded p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="min-w-0">
<<<<<<< ours
            <div className="text-white font-bold">
              {compact ? "Call" : "Voice + Video Room"}
            </div>

            {!compact ? (
=======
            <div className="text-white font-bold">Voice + Video Room</div>
            {!compact && rosterMode === "full" ? (
>>>>>>> theirs
              <div className="text-gray-400 text-sm mt-1">
                Room: <span className="text-gray-200">{roomName}</span>
              </div>
            ) : null}

<<<<<<< ours
            {showCountsInHeader ? (
              <div className="text-gray-500 text-xs mt-1">
                Players: {playerCount}/{maxLabel}
                {showViewerCountOnly ? ` • Viewers: ${viewerCount}` : ""}
              </div>
            ) : null}
=======
            <div className="text-gray-500 text-xs mt-1">{countsLine}</div>
>>>>>>> theirs

            {/* In compact/sidebar mode, only show viewer count (no names) */}
            {!showCountsInHeader && showViewerCountOnly ? (
              <div className="text-gray-500 text-xs mt-1">
                Viewers: <span className="text-gray-200">{viewerCount}</span>
              </div>
            ) : null}

            {/* Only show who is speaking (when joined) */}
            {joined ? (
              <div className="text-gray-500 text-xs mt-1">
                Speaking: <span className="text-gray-200">{speakingLabel}</span>
              </div>
            ) : null}

            {!compact && rosterMode === "full" ? (
              <div className="text-gray-500 text-xs mt-1">
                Tip: viewers join muted by default.
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {!compact && rosterMode === "full" ? (
              <>
                <button
                  onClick={copyLink}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors inline-flex items-center gap-2"
                  title="Copy invite link"
                >
                  <Copy size={16} />
                  Copy link
                </button>

                <a
                  href={roomUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors inline-flex items-center gap-2"
                  title="Open in new tab"
                >
                  <ExternalLink size={16} />
                  Open
                </a>
              </>
            ) : null}

            {!joined ? (
              <>
                <button
                  onClick={() => join("player")}
                  disabled={!isOwner && isPlayerFull}
                  className="px-3 py-2 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  title={
                    !isOwner && isPlayerFull
                      ? "Player slots full"
                      : "Join as player"
                  }
                >
                  <Users size={16} />
                  {compact ? "Player" : "Join (Player)"}
                </button>
                <button
                  onClick={() => join("viewer")}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors font-bold inline-flex items-center gap-2"
                  title="Join as viewer (muted)"
                >
                  <Eye size={16} />
                  {compact ? "Viewer" : "Join (Viewer)"}
                </button>
              </>
            ) : (
              <button
                onClick={leave}
                className="px-3 py-2 rounded-lg bg-gray-700 text-white font-bold hover:bg-gray-600 transition-colors"
              >
                Leave
              </button>
            )}
          </div>
        </div>

        {!compact && isOwner && rosterMode === "full" ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="text-xs text-gray-500 w-full mb-1 inline-flex items-center gap-2">
              <Shield size={14} />
              GM tools
            </div>
            <button
              onClick={() => execute("toggleAudio")}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors inline-flex items-center gap-2"
            >
              <Mic size={16} />
              Toggle mic
            </button>
            <button
              onClick={() => execute("toggleVideo")}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors inline-flex items-center gap-2"
            >
              <Video size={16} />
              Toggle cam
            </button>
            <button
              onClick={() => execute("muteEveryone")}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              title="Mutes everyone (if supported)"
            >
              <MicOff size={16} />
              Mute all
            </button>
            <button
              onClick={() => execute("stopVideo")}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors inline-flex items-center gap-2"
              title="Stops your video"
            >
              <VideoOff size={16} />
              Stop video
            </button>
            <button
              onClick={() => clearPresenceMutation.mutate()}
              disabled={clearPresenceMutation.isPending}
              className="px-3 py-2 rounded-lg bg-red-900/20 border border-red-900 text-red-300 hover:bg-red-900/30 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
              title="Clears the in-app presence list (does not force-close the room)"
            >
              <X size={16} />
              Clear presence
            </button>
          </div>
        ) : null}

        {error && (
          <div className="mt-3 bg-red-900/20 border border-red-900 p-3 rounded">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
      </div>

      <div
        className={
          shouldShowRosterList
            ? "grid grid-cols-1 lg:grid-cols-3 gap-4"
            : "grid grid-cols-1 gap-4"
        }
      >
        <div
          className={
            shouldShowRosterList
              ? "lg:col-span-2 bg-black rounded-lg border border-gray-800 overflow-hidden"
              : "bg-black rounded-lg border border-gray-800 overflow-hidden"
          }
        >
          {!joined ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              Join the call to load the room here.
            </div>
          ) : (
            <div ref={containerRef} className={`w-full ${iframeHeightClass}`} />
          )}
        </div>

        {shouldShowRosterList ? (
          <div className="bg-[#121212] border border-gray-700 rounded p-4">
            <div className="text-white font-bold mb-2 inline-flex items-center gap-2">
              <Users size={16} className="text-purple-300" />
              In-room list
            </div>
            <div className="text-gray-500 text-xs mb-3">
              This is your app’s presence list (players vs viewers).
            </div>

            {presence.length === 0 ? (
              <div className="text-gray-500 text-sm">
                No one in the call yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto">
                {presence.map((p) => {
                  const isMe = String(p.user_id) === String(user?.id);
                  const roleBadge =
                    p.presence_role === "player"
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                      : "bg-white/5 border-white/10 text-gray-300";

                  return (
                    <div
                      key={p.user_id}
                      className="flex items-center justify-between gap-2 bg-[#1E1E1E] border border-gray-700 rounded p-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt={p.display_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10" />
                        )}
                        <div className="min-w-0">
                          <div className="text-gray-200 text-sm font-bold truncate">
                            {p.display_name}
                            {isMe ? " (You)" : ""}
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold ${roleBadge}`}
                          >
                            {p.presence_role}
                          </span>
                        </div>
                      </div>

                      {isOwner && !isMe ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setRoleMutation.mutate({
                                targetUserId: p.user_id,
                                role: "player",
                              })
                            }
                            disabled={setRoleMutation.isPending}
                            className="px-2 py-1 rounded border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 text-xs font-bold disabled:opacity-50"
                            title="Mark as player"
                          >
                            Player
                          </button>
                          <button
                            onClick={() =>
                              setRoleMutation.mutate({
                                targetUserId: p.user_id,
                                role: "viewer",
                              })
                            }
                            disabled={setRoleMutation.isPending}
                            className="px-2 py-1 rounded border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 text-xs font-bold disabled:opacity-50"
                            title="Mark as viewer"
                          >
                            Viewer
                          </button>
                          <button
                            onClick={() => kickMutation.mutate(p.user_id)}
                            disabled={kickMutation.isPending}
                            className="px-2 py-1 rounded border border-red-900 bg-red-900/20 text-red-300 hover:bg-red-900/30 text-xs font-bold disabled:opacity-50"
                            title="Remove from presence list"
                          >
                            Kick
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {shouldShowSpeakerCard ? (
        <div className="bg-[#121212] border border-gray-700 rounded p-4">
          <div className="text-white font-bold mb-2">Who’s speaking</div>
          {!joined ? (
            <div className="text-gray-500 text-sm">
              Join the call to see this.
            </div>
          ) : speakingPresence ? (
            <div className="flex items-center gap-3">
              {speakingPresence.avatar_url ? (
                <img
                  src={speakingPresence.avatar_url}
                  alt={speakingPresence.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10" />
              )}
              <div className="min-w-0">
                <div className="text-gray-200 font-bold truncate">
                  {speakingPresence.display_name}
                </div>
                {speakerViewersLine ? (
                  <div className="text-gray-500 text-xs">
                    {speakerViewersLine}
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              {fallbackSpeakerWithViewers}
            </div>
          )}
        </div>
      ) : null}

      {!compact && rosterMode === "full" ? (
        <div className="text-gray-500 text-xs">
          This uses Jitsi Meet for a quick built-in voice/video room. GM can
          keep player count small while still allowing unlimited viewers.
        </div>
      ) : null}
    </div>
  );
}
