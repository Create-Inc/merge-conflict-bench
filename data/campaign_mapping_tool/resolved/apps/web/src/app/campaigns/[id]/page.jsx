import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  ScrollText,
  Gem,
  Users,
  Video,
  Lock,
  Map,
  Music,
  Dice5,
  Shield,
} from "lucide-react";
import useUser from "@/utils/useUser";
import CampaignCallPanel from "@/components/ProfilePage/CampaignsTab/CampaignCallPanel";
import CampaignWhispersPanel from "@/components/ProfilePage/CampaignsTab/CampaignWhispersPanel";
import CampaignMapPanel from "@/components/ProfilePage/CampaignsTab/CampaignMapPanel";
import CampaignSoundboardPanel from "@/components/ProfilePage/CampaignsTab/CampaignSoundboardPanel";
import CampaignDicePanel from "@/components/ProfilePage/CampaignsTab/CampaignDicePanel";
import CampaignCharactersPanel from "@/components/ProfilePage/CampaignsTab/CampaignCharactersPanel";

function Tabs({ active, onChange }) {
  const tabs = [
    { id: "map", label: "Map", icon: Map },
    { id: "chat", label: "Chat", icon: Lock },
    { id: "call", label: "Call", icon: Video },
    { id: "sound", label: "Sounds", icon: Music },
    { id: "dice", label: "Dice", icon: Dice5 },
    { id: "characters", label: "Characters", icon: Shield },
    { id: "sessions", label: "Sessions", icon: CalendarClock },
    { id: "npcs", label: "NPCs", icon: ScrollText },
    { id: "loot", label: "Loot", icon: Gem },
    { id: "members", label: "Members", icon: Users },
  ];

  return (
    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        const btnClass = isActive
          ? "bg-purple-600 text-white border-purple-500"
          : "bg-[#121212] text-gray-300 border-gray-700 hover:border-gray-600";

        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`px-3 py-2 rounded border text-sm font-bold inline-flex items-center gap-2 whitespace-nowrap ${btnClass}`}
          >
            <Icon size={16} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default function CampaignPage({ params }) {
  const rawId = params?.id;
  const numericId = Number(rawId);

  const { data: user, loading } = useUser();

  const [activeTab, setActiveTab] = useState("map");

  const { data, isLoading, error } = useQuery({
    queryKey: ["campaignDetail", numericId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${numericId}/detail`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Could not load campaign");
      }
      return res.json();
    },
    enabled: Number.isFinite(numericId),
  });

  const { data: membersData } = useQuery({
    queryKey: ["campaignMembers", numericId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${numericId}/members`);
      if (!res.ok) {
        throw new Error(
          `When fetching /api/campaigns/${numericId}/members, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
    enabled: Number.isFinite(numericId),
  });

  const campaign = data?.campaign || null;
  const sessions = data?.sessions || [];
  const npcs = data?.npcs || [];
  const loot = data?.loot || [];
  const myMembership = data?.myMembership || null;

  const members = membersData?.members || [];

  const isAccepted = myMembership?.status === "accepted";
  const isOwner = myMembership?.role === "owner" && isAccepted;

  const title = campaign?.title || "Campaign";

  const content = useMemo(() => {
    if (!campaign || !isAccepted) return null;

    if (activeTab === "call") {
      return (
        <CampaignCallPanel
          campaignId={numericId}
          campaignTitle={campaign.title}
          isOwner={isOwner}
          maxPlayers={campaign.max_players}
        />
      );
    }

    if (activeTab === "chat") {
      return (
        <CampaignWhispersPanel
          campaignId={numericId}
          members={members}
          myMembership={myMembership}
          currentUserId={user?.id}
        />
      );
    }

    if (activeTab === "map") {
      return (
        <CampaignMapPanel
          campaignId={numericId}
          members={members}
          myMembership={myMembership}
        />
      );
    }

    if (activeTab === "sound") {
      return <CampaignSoundboardPanel campaignId={numericId} isOwner={isOwner} />;
    }

    if (activeTab === "dice") {
      return <CampaignDicePanel campaignId={numericId} />;
    }

    if (activeTab === "characters") {
      return (
        <CampaignCharactersPanel
          campaignId={numericId}
          isOwner={isOwner}
          members={members}
        />
      );
    }

    if (activeTab === "sessions") {
      return (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="bg-[#121212] border border-gray-700 p-6 rounded text-center text-gray-400 text-sm">
              No sessions yet.
            </div>
          ) : (
            sessions.map((s) => {
              const date = s.created_at
                ? new Date(s.created_at).toLocaleDateString()
                : "";
              return (
                <div
                  key={s.id}
                  className="bg-[#121212] border border-gray-700 rounded p-4"
                >
                  <div className="text-gray-400 text-xs">{date}</div>
                  <div className="text-white font-bold mt-1">Session</div>
                  {s.summary && (
                    <div className="text-gray-200 text-sm mt-2 whitespace-pre-wrap">
                      {s.summary}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      );
    }

    if (activeTab === "npcs") {
      return (
        <div className="space-y-3">
          {npcs.length === 0 ? (
            <div className="bg-[#121212] border border-gray-700 p-6 rounded text-center text-gray-400 text-sm">
              No NPCs yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {npcs.map((n) => (
                <div
                  key={n.id}
                  className="bg-[#121212] border border-gray-700 rounded p-4"
                >
                  <div className="text-white font-bold">{n.name}</div>
                  {n.description && (
                    <div className="text-gray-300 text-sm mt-2 whitespace-pre-wrap">
                      {n.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "loot") {
      return (
        <div className="space-y-2">
          {loot.length === 0 ? (
            <div className="bg-[#121212] border border-gray-700 p-6 rounded text-center text-gray-400 text-sm">
              No loot yet.
            </div>
          ) : (
            loot.map((li) => (
              <div
                key={li.id}
                className="bg-[#121212] border border-gray-700 rounded p-3"
              >
                <div className="text-white font-bold">{li.item_name}</div>
                {li.details && (
                  <div className="text-gray-300 text-sm mt-1">{li.details}</div>
                )}
                <div className="text-gray-500 text-xs mt-2">
                  {li.claimed_by ? `Claimed by ${li.claimed_by_name}` : "Unclaimed"}
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {members.length === 0 ? (
          <div className="bg-[#121212] border border-gray-700 p-6 rounded text-center text-gray-400 text-sm">
            No members.
          </div>
        ) : (
          members.map((m) => (
            <div
              key={m.user_id}
              className="bg-[#121212] border border-gray-700 rounded p-3 flex items-center gap-3"
            >
              {m.avatar_url ? (
                <img
                  src={m.avatar_url}
                  alt={m.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-white font-bold truncate">{m.display_name}</div>
                <div className="text-gray-500 text-xs">{m.role}</div>
              </div>
              <div className="text-xs text-gray-400">{m.status}</div>
            </div>
          ))
        )}
      </div>
    );
  }, [
    activeTab,
    campaign,
    isAccepted,
    numericId,
    isOwner,
    members,
    myMembership,
    sessions,
    npcs,
    loot,
    user?.id,
  ]);

  const showLoading = loading || isLoading;

  if (showLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="text-[#FFD700] font-bold" style={{ fontFamily: "Cinzel, serif" }}>
          LOADING...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6">
        <div className="bg-red-900/20 border border-red-900 p-4 rounded max-w-lg w-full">
          <div className="text-red-300 font-bold">Could not load campaign</div>
          <div className="text-red-200 text-sm mt-1">{error.message}</div>
          <button
            className="mt-4 px-4 py-2 rounded bg-white/5 border border-white/10 text-gray-200"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-gray-400">
        Not found.
      </div>
    );
  }

  if (!isAccepted) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-6">
        <div className="bg-[#121212] border border-gray-700 p-6 rounded max-w-lg w-full text-center">
          <div className="text-white font-bold text-lg">Invite not accepted</div>
          <div className="text-gray-400 text-sm mt-2">
            Accept the campaign invite from your profile first.
          </div>
          <a
            href="/profile"
            className="inline-flex mt-4 px-4 py-2 rounded bg-purple-600 text-white font-bold"
          >
            Back to Profile
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0F0F0F] flex flex-col">
      {/* Top bar */}
      <div className="px-4 py-4 border-b border-white/10 bg-[#0F0F0F]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.history.back();
                }
              }}
              className="p-2 rounded bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BookOpen className="text-[#FFD700]" size={20} />
                <h1 className="text-white text-2xl font-bold truncate" style={{ fontFamily: "Cinzel, serif" }}>
                  {title}
                </h1>
              </div>
              {campaign.description && (
                <div className="text-gray-400 text-sm truncate">{campaign.description}</div>
              )}
            </div>
          </div>

          <div className="text-gray-400 text-xs">{isOwner ? "DM" : "Player"}</div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="lg:w-[240px] border-b lg:border-b-0 lg:border-r border-white/10 p-3 bg-[#0F0F0F]">
          <Tabs active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 lg:p-6 w-full">{content}</div>
        </div>
      </div>
    </div>
  );
}
