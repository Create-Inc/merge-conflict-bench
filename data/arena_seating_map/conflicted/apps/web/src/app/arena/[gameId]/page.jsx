"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArenaTopBar } from "@/components/Arena/ArenaTopBar";
import { CashDropOverlay } from "@/components/Arena/CashDropOverlay";
import { BattleHeader } from "@/components/Arena/BattleHeader";
import { ChatFeed } from "@/components/Arena/ChatFeed";
import { SeatingMap } from "@/components/Arena/SeatingMap";
import { MessageInput } from "@/components/Arena/MessageInput";
import { SponsorRing } from "@/components/Arena/SponsorRing";
import { TeamStands } from "@/components/Arena/TeamStands";
import { ArenaStyles } from "@/components/Arena/ArenaStyles";
import { LoadingState } from "@/components/Arena/LoadingState";
import { ErrorState } from "@/components/Arena/ErrorState";
import { useArenaData } from "@/hooks/useArenaData";
import {
  useArenaMessages,
  useLikeMessage,
  useSendMessage,
} from "@/hooks/useArenaMessages";
import { useJoinSeat, useLeaveSeat } from "@/hooks/useArenaSeat";
import { useSponsors } from "@/hooks/useSponsors";
import { useCashDropQueue, useCashDrops } from "@/hooks/useCashDrops";
import {
  normalizeSideData,
  calculateEnergyByUserId,
  calculatePressure,
  calculateMomentum,
  calculateGlow,
} from "@/utils/arenaHelpers";
import soundManager from "@/utils/soundManager";
import { useGuestUser } from "@/hooks/useGuestUser";

export default function ArenaPage({ params }) {
  const { gameId } = params;

  // Routing enforcement: team selection is mandatory before entering the arena.
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamChecked, setTeamChecked] = useState(false);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const team = sp.get("team");
      setSelectedTeamId(team);
      setTeamChecked(true);
    } catch (e) {
      setSelectedTeamId(null);
      setTeamChecked(true);
    }
  }, []);

  const missingTeam = useMemo(() => {
    if (!teamChecked) return false;
    return !selectedTeamId;
  }, [selectedTeamId, teamChecked]);

  // Stable guest identity (no auth)
  const { guestUserId, guestUserName } = useGuestUser();
  const userId = guestUserId;
  const userName = guestUserName;

  // PAN attribution (?aff=CODE) — first wins
  const [affiliateCode, setAffiliateCode] = useState(null);
  const [affiliateTracked, setAffiliateTracked] = useState(false);

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const aff = sp.get("aff");
      setAffiliateCode(aff);
    } catch (e) {
      // ignore
    }
  }, []);

  // Audio is enabled by default.
  // Note: browsers may still require a user gesture before sound can actually play,
  // but we never block the UI behind a prompt.
  const [audioUnlocked] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedAvatar] = useState("adventurer");
  const [flashSponsorName, setFlashSponsorName] = useState(null);

  // Energy decay tick (every 30s)
  const [decayTick, setDecayTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setDecayTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch stadium data
  const {
    data: stadiumData,
    isLoading,
    error: stadiumError,
  } = useArenaData(
    gameId,
    userId,
    audioUnlocked && !!userId && teamChecked && !!selectedTeamId,
  );

  const stadium = stadiumData?.stadium;
  const battle = stadiumData?.battle;
  const game = stadiumData?.game;
  const seats = stadiumData?.seats || [];
  const userSeat = stadiumData?.userSeat;

  // NEW: Channel sponsors (Title + banner tiers)
  const channelSponsorsEnabled = useMemo(() => {
    if (!audioUnlocked) return false;
    if (!game?.sport || !game?.gender || !game?.level) return false;
    return true;
  }, [audioUnlocked, game?.gender, game?.level, game?.sport]);

  const {
    data: channelSponsorsData,
    error: channelSponsorsError,
    isLoading: channelSponsorsLoading,
  } = useQuery({
    queryKey: ["channelSponsors", game?.sport, game?.gender, game?.level],
    queryFn: async () => {
      const url = `/api/channel/sponsors?sport=${encodeURIComponent(
        String(game.sport),
      )}&gender=${encodeURIComponent(String(game.gender))}&level=${encodeURIComponent(
        String(game.level),
      )}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `When fetching ${url}, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
    enabled: channelSponsorsEnabled,
    staleTime: 60 * 1000,
  });

  const titleSponsor = channelSponsorsData?.titleSponsor || null;
  const bannerRotation = channelSponsorsData?.bannerRotation || [];

  const homeBannerSponsor = useMemo(() => {
    if (!bannerRotation || bannerRotation.length === 0) return null;
    return bannerRotation[0] || null;
  }, [bannerRotation]);

  const awayBannerSponsor = useMemo(() => {
    if (!bannerRotation || bannerRotation.length === 0) return null;
    if (bannerRotation.length >= 2) return bannerRotation[1] || null;
    return bannerRotation[0] || null;
  }, [bannerRotation]);

  // PAN attribution (first wins): store locally + tell backend.
  useEffect(() => {
    if (!audioUnlocked) return;
    if (!affiliateCode) return;
    if (!userId) return;
    if (affiliateTracked) return;

    try {
      const key = "user_affiliate_id";
      const existing = window.localStorage.getItem(key);
      if (!existing) {
        window.localStorage.setItem(key, affiliateCode);
      }
    } catch (e) {
      console.error(e);
    }

    const run = async () => {
      try {
        const sport = game?.sport || null;
        const gender = game?.gender || null;
        const level = game?.level || null;

        const qs = new URLSearchParams({
          code: affiliateCode,
          userId,
          source: `arena/${String(gameId)}`,
        });

        if (sport) qs.set("sport", String(sport));
        if (gender) qs.set("gender", String(gender));
        if (level) qs.set("level", String(level));

        const url = `/api/channel/affiliate?${qs.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `When fetching ${url}, the response was [${response.status}] ${response.statusText}`,
          );
        }

        await response.json();
        setAffiliateTracked(true);
      } catch (error) {
        console.error(error);
        setAffiliateTracked(true);
      }
    };

    run();
  }, [affiliateCode, affiliateTracked, audioUnlocked, game, gameId, userId]);

  const isBoxing = useMemo(() => {
    const sport = String(game?.sport || "").toLowerCase();
    return sport === "boxing" || !!game?.fighter_a || !!game?.fighter_b;
  }, [game]);

  const seatLabelMode = useMemo(
    () => (isBoxing ? "boxing" : "team"),
    [isBoxing],
  );

  // --- Side A / Side B normalization (Top / Bottom) ---
  const sideA = useMemo(
    () => normalizeSideData(game, isBoxing, "A"),
    [game, isBoxing],
  );

  const sideB = useMemo(
    () => normalizeSideData(game, isBoxing, "B"),
    [game, isBoxing],
  );

  // Fetch messages (battle chat)
  const { data: messagesData } = useArenaMessages(
    battle?.id,
    userId,
    audioUnlocked,
  );
  const messages = messagesData?.messages || [];

  // Sound: soft tick when a new message arrives (never spammy)
  const lastMessageIdRef = useRef(null);
  useEffect(() => {
    if (!audioUnlocked) return;
    if (!messages || messages.length === 0) return;

    const last = messages[messages.length - 1];
    if (!last?.id) return;

    if (lastMessageIdRef.current && lastMessageIdRef.current !== last.id) {
      // Only tick for other people's messages
      if (last.user_id && last.user_id !== userId) {
        soundManager.play("click");
      }
    }

    lastMessageIdRef.current = last.id;
  }, [audioUnlocked, messages, userId]);

  const likeMessageMutation = useLikeMessage(battle?.id, userId);

  const handleToggleLike = (msg) => {
    if (!msg?.id) return;
    if (msg.user_id === userId) return;

    // Sound: subtle pop
    soundManager.play("swoosh");

    likeMessageMutation.mutate({
      messageId: msg.id,
      currentlyLiked: !!msg.user_has_liked,
    });
  };

  // Sponsors (fallback / default sponsors)
  const { data: sponsorsData } = useSponsors(audioUnlocked);
  const sponsors = sponsorsData?.sponsors || [];

  // Sponsor ring wants a stable list
  const fallbackSponsorTiles = useMemo(() => {
    return sponsors.filter((s) => s && s.name).slice(0, 12);
  }, [sponsors]);

  const sponsorTiles = useMemo(() => {
    if (!bannerRotation || bannerRotation.length === 0) {
      return fallbackSponsorTiles;
    }

    const max = 12;
    const out = [];
    for (let i = 0; i < max; i++) {
      out.push(bannerRotation[i % bannerRotation.length]);
    }
    return out;
  }, [bannerRotation, fallbackSponsorTiles]);

  // Join/Leave seat mutations
  const joinSeatMutation = useJoinSeat(
    stadium?.id,
    gameId,
    userId,
    userName,
    selectedAvatar,
  );
  const leaveSeatMutation = useLeaveSeat(stadium?.id, gameId, userId);

  // Send message mutation
  const sendMessageMutation = useSendMessage(
    battle?.id,
    userId,
    userName,
    userSeat,
  );

  // Cash drops
  const { cashDropQueue, setCashDropQueue, triggerCashDrop, triggerBonanza } =
    useCashDropQueue();
  const activeCashDrop = cashDropQueue.length > 0 ? cashDropQueue[0] : null;

  useCashDrops(activeCashDrop, setFlashSponsorName);

  const handleCashDrop = useMemo(() => {
    return () => triggerCashDrop(battle?.id);
  }, [battle?.id, triggerCashDrop]);

  const handleBonanza = useMemo(() => {
    return () => triggerBonanza(battle?.id);
  }, [battle?.id, triggerBonanza]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    sendMessageMutation.mutate(trimmed);
    setMessage("");

    // Sound: soft tick for send
    soundManager.play("click");
  };

  const homeSeats = useMemo(
    () => seats.filter((s) => s.team_side === "home"),
    [seats],
  );
  const awaySeats = useMemo(
    () => seats.filter((s) => s.team_side === "away"),
    [seats],
  );

  const energyByUserId = useMemo(
    () => calculateEnergyByUserId(messages, seats),
    [messages, seats, decayTick],
  );

  const seatingCapacity = useMemo(() => {
    const c = Number(stadium?.capacity);
    if (Number.isFinite(c) && c > 0) return Math.floor(c);
    return Math.max(0, seats.length);
  }, [seats.length, stadium?.capacity]);

  const pressure = useMemo(
    () => calculatePressure(homeSeats, awaySeats, energyByUserId),
    [awaySeats, energyByUserId, homeSeats],
  );

  const momentum = useMemo(() => calculateMomentum(pressure), [pressure]);

  const homeGlow = useMemo(
    () => calculateGlow(sideA.color, momentum, "home"),
    [momentum, sideA.color],
  );

  const awayGlow = useMemo(
    () => calculateGlow(sideB.color, momentum, "away"),
    [momentum, sideB.color],
  );

  const homePressureText = useMemo(
    () => `${Math.round(pressure.home * 100)}%`,
    [pressure.home],
  );
  const awayPressureText = useMemo(
    () => `${Math.round(pressure.away * 100)}%`,
    [pressure.away],
  );

  const canSendMessage = useMemo(() => {
    const trimmed = message.trim();
    if (!trimmed) return false;
    if (sendMessageMutation.isPending) return false;
    return true;
  }, [message, sendMessageMutation.isPending]);

  const gameStatus = useMemo(
    () => String(game?.status || "").toLowerCase(),
    [game?.status],
  );
  const isGameOver = useMemo(
    () => ["final", "completed", "ended", "finished"].includes(gameStatus),
    [gameStatus],
  );

  const activeCashSeatId = useMemo(() => {
    const d = activeCashDrop?.drop;
    return d?.seat_id ?? d?.winner_seat_id ?? null;
  }, [activeCashDrop?.drop]);

  if (missingTeam) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0B0F16" }}
      >
        <div
          className="max-w-xl w-full p-6 border"
          style={{
            backgroundColor: "#1A1F2E",
            borderColor: "rgba(255,255,255,0.1)",
            color: "#AAB1C3",
          }}
        >
          <div className="text-white font-bold text-xl mb-2">
            Choose a team first
          </div>
          <div className="text-sm">
            You can’t enter the arena directly. The required flow is:
            <br />
            Sport → (Gender if applicable) → Level → Team Selection → Enter Fan
            Battle.
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => (window.location.href = "/sports")}
              className="px-4 py-2 border cursor-pointer bg-transparent"
              style={{
                borderColor: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                borderRadius: 12,
              }}
            >
              Back to Sports
            </button>
            <button
              onClick={() => (window.location.href = "/games")}
              className="px-4 py-2 border cursor-pointer bg-transparent"
              style={{
                borderColor: "rgba(255,255,255,0.15)",
                color: "#AAB1C3",
                borderRadius: 12,
              }}
            >
              Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Wait until we have a stable guest id before rendering the arena.
  if (!userId || !userName) {
    return <LoadingState />;
  }

  if (isLoading || (channelSponsorsEnabled && channelSponsorsLoading)) {
    return <LoadingState />;
  }

  if (stadiumError || !game || !stadium) {
    const errorText = stadiumError?.message || "Could not load arena";
    return <ErrorState errorText={errorText} />;
  }

  if (channelSponsorsError) {
    // Don't hard-fail the arena if sponsor data is down.
    console.error(channelSponsorsError);
  }

  const showJoinButtons = !userSeat;

  // NEW: Arena is now "full screen" — the seating map *is* the arena.
  // Top/bottom stands are no longer rendered as separate sections.
  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      style={{ backgroundColor: "#0B0F19", color: "#FFFFFF" }}
    >
      {/* Full-screen arena (seats wrap the whole screen) */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <SeatingMap
          seats={seatsForMap}
          capacity={seatingCapacity}
          homeColor={sideA.color}
          awayColor={sideB.color}
          energyByUserId={energyByUserId}
          userSeatId={userSeat?.id || null}
          variant="fullscreen"
        />
      </div>

      {/* Soft overlay to keep text readable without hiding the bowl */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 5,
          background:
            "radial-gradient(120% 120% at 50% 0%, rgba(11,15,25,0.10) 0%, rgba(11,15,25,0.38) 55%, rgba(11,15,25,0.72) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Top UI */}
      <div className="absolute top-0 left-0 right-0" style={{ zIndex: 25 }}>
        <ArenaTopBar game={game} presentedBy={titleSponsor} />
        <BattleHeader
          sideA={sideA}
          sideB={sideB}
          showJoinButtons={showJoinButtons}
          joinSeatMutation={joinSeatMutation}
          leaveSeatMutation={leaveSeatMutation}
          onCashDrop={handleCashDrop}
          onBonanza={handleBonanza}
          isGameOver={isGameOver}
          prizePoolText={"Growing…"}
        />
      </div>

<<<<<<< ours
      {/* Sponsor ring sits inside the arena */}
      <div
        className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-2 w-[720px]"
        style={{ zIndex: 22 }}
      >
        <SponsorRing
          sponsors={sponsorTiles}
          flashSponsorName={flashSponsorName}
        />
      </div>
=======
        {/* Arena seating bowl */}
        <div style={{ padding: "0 6px 10px" }}>
          <SeatingMap
            seats={seats}
            capacity={seatingCapacity}
            homeColor={sideA.color}
            awayColor={sideB.color}
            energyByUserId={energyByUserId}
          />
        </div>
>>>>>>> theirs

      {/* Chat overlay: mobile bottom panel, desktop right rail */}
      <div
        className="absolute left-2 right-2 bottom-2 h-[42vh] md:left-auto md:right-2 md:top-[170px] md:bottom-2 md:h-auto md:w-[420px]"
        style={{
          zIndex: 30,
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.10)",
          backgroundColor: "rgba(11,15,25,0.78)",
          backdropFilter: "blur(10px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ChatFeed
          messages={messages}
          handleToggleLike={handleToggleLike}
          userId={userId}
          selectedAvatar={selectedAvatar}
          seatLabelMode={seatLabelMode}
          sideAColor={sideA.color}
          sideBColor={sideB.color}
        />

        <CashDropOverlay
          drop={activeCashDrop?.drop}
          sponsor={activeCashDrop?.sponsor}
          fallbackSponsor={titleSponsor}
          seatLabelMode={seatLabelMode}
          onClose={() => {
            setCashDropQueue((prev) => prev.slice(1));
          }}
        />

        <MessageInput
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleSendMessage}
          userSeat={userSeat}
          canSendMessage={canSendMessage}
        />
      </div>

      <ArenaStyles />
    </div>
  );
}
