"use client";

import { useMemo, useState } from "react";
import { ArenaTopBar } from "@/components/Arena/ArenaTopBar";
import { BattleHeader } from "@/components/Arena/BattleHeader";
import { ChatFeed } from "@/components/Arena/ChatFeed";
import { MessageInput } from "@/components/Arena/MessageInput";
import { SponsorRing } from "@/components/Arena/SponsorRing";
import { TeamStands } from "@/components/Arena/TeamStands";
import { SeatingMap } from "@/components/Arena/SeatingMap";
import { ArenaStyles } from "@/components/Arena/ArenaStyles";
import { calculateGlow } from "@/utils/arenaHelpers";

export default function ArenaPreviewPage() {
  const [message, setMessage] = useState("");
  const [userSeat, setUserSeat] = useState(null);

  // A stable local identity for the preview (no DB writes, no auth required)
  const userId = "preview-user";
  const userName = "Preview Fan";
  const selectedAvatar = "adventurer";

  const game = useMemo(() => {
    return {
      sport: "basketball",
      status: "PREVIEW",
      network: "(Preview)",
      period: 1,
      clock: "12:00",
      homeTeam: {
        name: "Home Team",
        primary_color: "#4DA3FF",
        logo_url:
          "https://upload.wikimedia.org/wikipedia/commons/3/31/Basketball.png",
      },
      awayTeam: {
        name: "Away Team",
        primary_color: "#FF5252",
        logo_url:
          "https://upload.wikimedia.org/wikipedia/commons/3/31/Basketball.png",
      },
      home_score: 0,
      away_score: 0,
    };
  }, []);

  const sideA = useMemo(() => {
    return {
      name: "HOME",
      sub: "The upper bowl",
      color: "#4DA3FF",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/3/31/Basketball.png",
      joinText: "Join Home",
    };
  }, []);

  const sideB = useMemo(() => {
    return {
      name: "AWAY",
      sub: "The lower bowl",
      color: "#FF5252",
      image:
        "https://upload.wikimedia.org/wikipedia/commons/3/31/Basketball.png",
      joinText: "Join Away",
    };
  }, []);

  const sponsors = useMemo(() => {
    return [
      {
        id: "s1",
        name: "Title Sponsor",
        logo_url:
          "https://ucarecdn.com/59661f64-d99f-423e-a26f-b7284aaa7420/-/format/auto/",
      },
      {
        id: "s2",
        name: "Energy Drink",
        logo_url:
          "https://upload.wikimedia.org/wikipedia/commons/5/59/Empty.png",
      },
      {
        id: "s3",
        name: "Sports Bar",
        logo_url:
          "https://upload.wikimedia.org/wikipedia/commons/5/59/Empty.png",
      },
      {
        id: "s4",
        name: "Streaming App",
        logo_url:
          "https://upload.wikimedia.org/wikipedia/commons/5/59/Empty.png",
      },
    ];
  }, []);

  const seats = useMemo(() => {
    const makeSeats = (teamSide, count, startId) => {
      const out = [];
      for (let i = 0; i < count; i += 1) {
        const seatNumber = i + 1;

        // Roughly 1/4 seats occupied so the bowl looks alive in preview.
        const occupied = i % 4 === 0;

        const seatUserId = occupied ? `demo-${teamSide}-${seatNumber}` : null;
        const seatUserName = occupied
          ? teamSide === "home"
            ? `HomeFan ${seatNumber}`
            : `AwayFan ${seatNumber}`
          : null;

        out.push({
          id: startId + i,
          stadium_id: "preview",
          battle_id: "preview",
          seat_number: seatNumber,
          team_side: teamSide,
          user_id: seatUserId,
          user_name: seatUserName,
        });
      }
      return out;
    };

    const homeSeats = makeSeats("home", 64, 1000);
    const awaySeats = makeSeats("away", 64, 2000);

    // If the user "joins", we just pick a seat for them locally.
    if (userSeat?.team_side && typeof userSeat?.seat_number === "number") {
      const list = userSeat.team_side === "home" ? homeSeats : awaySeats;
      const idx = Math.max(
        0,
        Math.min(list.length - 1, userSeat.seat_number - 1),
      );
      const target = list[idx];
      list[idx] = {
        ...target,
        user_id: userId,
        user_name: userName,
      };
    }

    return [...homeSeats, ...awaySeats];
  }, [userSeat, userId, userName]);

  const homeSeats = useMemo(
    () => seats.filter((s) => s.team_side === "home"),
    [seats],
  );
  const awaySeats = useMemo(
    () => seats.filter((s) => s.team_side === "away"),
    [seats],
  );

  const messages = useMemo(() => {
    const now = Date.now();
    return [
      {
        id: "m1",
        user_id: "demo-home-5",
        user_name: "HomeFan 005",
        message:
          "This is the Arena layout preview. Imagine this chat live during the game.",
        created_at: new Date(now - 1000 * 60 * 6).toISOString(),
        team_side: "home",
        seat_number: 5,
        likes_count: 2,
        user_has_liked: false,
      },
      {
        id: "m2",
        user_id: "demo-away-2",
        user_name: "AwayFan 002",
        message:
          "Pressure bar + seat heatmap + sponsor strip all run right here.",
        created_at: new Date(now - 1000 * 60 * 4).toISOString(),
        team_side: "away",
        seat_number: 2,
        likes_count: 1,
        user_has_liked: false,
      },
      {
        id: "m3",
        user_id: "demo-home-9",
        user_name: "HomeFan 009",
        message:
          "Join buttons are in the header. Once you join, the message box unlocks.",
        created_at: new Date(now - 1000 * 60 * 2).toISOString(),
        team_side: "home",
        seat_number: 9,
        likes_count: 0,
        user_has_liked: false,
      },
    ];
  }, []);

  const energyByUserId = useMemo(() => {
    // Map<user_id, 0..1> — used by seat heatmap
    const map = new Map();
    for (const s of seats) {
      if (!s.user_id) continue;
      const n = Number(s.seat_number || 0);
      const base = (n % 10) / 10;
      const t = s.user_id === userId ? 0.95 : Math.max(0.1, base);
      map.set(s.user_id, t);
    }
    return map;
  }, [seats, userId]);

  const pressure = useMemo(() => {
    // For the preview we keep this simple & stable.
    return {
      home: userSeat?.team_side === "home" ? 0.58 : 0.52,
      away: userSeat?.team_side === "away" ? 0.58 : 0.48,
    };
  }, [userSeat?.team_side]);

  const homeGlow = useMemo(
    () => calculateGlow(sideA.color, { lead: "home", strength: 0.52 }, "home"),
    [sideA.color],
  );
  const awayGlow = useMemo(
    () => calculateGlow(sideB.color, { lead: "away", strength: 0.48 }, "away"),
    [sideB.color],
  );

  const homePressureText = useMemo(
    () => `${Math.round(pressure.home * 100)}%`,
    [pressure.home],
  );
  const awayPressureText = useMemo(
    () => `${Math.round(pressure.away * 100)}%`,
    [pressure.away],
  );

  const showJoinButtons = !userSeat;

  const joinSeatMutation = useMemo(() => {
    return {
      isPending: false,
      mutate: (teamSide) => {
        const safeTeamSide = teamSide === "away" ? "away" : "home";
        setUserSeat({ team_side: safeTeamSide, seat_number: 12 });
      },
    };
  }, []);

  const leaveSeatMutation = useMemo(() => {
    return {
      isPending: false,
      mutate: () => {
        setUserSeat(null);
        setMessage("");
      },
    };
  }, []);

  const canSendMessage = useMemo(() => {
    const trimmed = message.trim();
    if (!trimmed) return false;
    return true;
  }, [message]);

  const handleToggleLike = () => {
    // No-op for preview
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    // No DB writes in preview; we just clear the field to show the UX.
    setMessage("");
  };

  const seatingCapacity = useMemo(() => {
    // Preview uses a bigger capacity so you can see the "full bowl" look.
    return 800;
  }, []);

  // Note: the bowl map is section-based (not a dot-per-seat map),
  // so we only need the occupied seats + total capacity.

  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      style={{ backgroundColor: "#0B0F19", color: "#FFFFFF" }}
    >
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 60,
          padding: "8px 10px",
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          color: "#AAB1C3",
          fontSize: 12,
        }}
      >
        Arena Preview (no live game)
      </div>

      {/* Full-screen arena map */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <SeatingMap
          seats={allSeatsForMap}
          capacity={seatingCapacity}
          homeColor={sideA.color}
          awayColor={sideB.color}
          energyByUserId={energyByUserId}
          userSeatId={userSeat?.id || null}
          variant="fullscreen"
        />
      </div>

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
        <ArenaTopBar game={game} presentedBy={sponsors[0]} />
        <BattleHeader
          sideA={sideA}
          sideB={sideB}
          showJoinButtons={showJoinButtons}
          joinSeatMutation={joinSeatMutation}
          leaveSeatMutation={leaveSeatMutation}
          onCashDrop={() => {}}
          onBonanza={() => {}}
          isGameOver={false}
          prizePoolText={"Preview"}
        />
      </div>

<<<<<<< ours
      {/* Sponsor ring inside arena */}
      <div
        className="hidden md:block absolute left-1/2 -translate-x-1/2 bottom-2 w-[720px]"
        style={{ zIndex: 22 }}
      >
=======
        {/* 🧨 FLOOR */}
        <div
          className="floor"
          style={{
            position: "relative",
            overflow: "hidden",
            borderTop: "1px solid #1E2538",
            borderBottom: "1px solid #1E2538",
            backgroundColor: "#121826",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <BattleHeader
            sideA={sideA}
            sideB={sideB}
            showJoinButtons={showJoinButtons}
            joinSeatMutation={joinSeatMutation}
            leaveSeatMutation={leaveSeatMutation}
            onCashDrop={() => {}}
            onBonanza={() => {}}
            isGameOver={false}
            prizePoolText={"Preview"}
          />

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

          <ChatFeed
            messages={messages}
            handleToggleLike={handleToggleLike}
            userId={userId}
            selectedAvatar={selectedAvatar}
            seatLabelMode="team"
            sideAColor={sideA.color}
            sideBColor={sideB.color}
          />

          <MessageInput
            message={message}
            setMessage={setMessage}
            handleSendMessage={handleSendMessage}
            userSeat={userSeat}
            canSendMessage={canSendMessage}
          />
        </div>

        {/* 🧾 SPONSOR RING */}
>>>>>>> theirs
        <SponsorRing sponsors={sponsors} flashSponsorName={null} />
      </div>

      {/* Chat overlay */}
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
          seatLabelMode="team"
          sideAColor={sideA.color}
          sideBColor={sideB.color}
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
