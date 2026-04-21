import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { SongItem as SongCard } from "@/components/SongSearch/SongItem";
import { ArtistItem } from "@/components/SongSearch/ArtistItem";
import SearchingBanner from "@/components/SearchingBanner";
import usePresentationMode from "@/hooks/usePresentationMode";
import HeroCarouselModal from "@/components/Carousel/HeroCarouselModal";
import SongSwipeCard from "@/components/Carousel/SongSwipeCard";
import ArtistSwipeCard from "@/components/Carousel/ArtistSwipeCard";
import SongStripCard from "@/components/Carousel/SongStripCard";
import ArtistStripCard from "@/components/Carousel/ArtistStripCard";
import OverlappingCarousel from "@/components/Carousel/OverlappingCarousel";
import ChoiceSwipeCard from "@/components/Carousel/ChoiceSwipeCard";
import PresentationModeToggle from "@/components/PresentationModeToggle";
import { SearchHeader } from "@/components/SongSearch/SearchHeader";
import ChoiceListCard from "@/components/Carousel/ChoiceListCard";
import { buildSongDetailParams } from "@/utils/songNav";

export default function DecadeSearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedDecade, setSelectedDecade] = useState(null);
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [gotoInput, setGotoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState("artists"); // "artists" or "songs"
  const [sortBy, setSortBy] = useState("fame"); // fame | alpha | year | hits
  const [sortDir, setSortDir] = useState("desc"); // for year sorting

  const decades = [
    { value: "1950s", label: "1950s", description: "Birth of Rock & Roll" },
    {
      value: "1960s",
      label: "1960s",
      description: "British Invasion & Psychedelic",
    },
    {
      value: "1970s",
      label: "1970s",
      description: "Disco, Punk & Progressive Rock",
    },
    {
      value: "1980s",
      label: "1980s",
      description: "New Wave, MTV Era & Synth-Pop",
    },
    {
      value: "1990s",
      label: "1990s",
      description: "Grunge, Hip-Hop & Alternative",
    },
    {
      value: "2000s",
      label: "2000s",
      description: "Digital Revolution & Pop Punk",
    },
    {
      value: "2010s",
      label: "2010s",
      description: "Streaming Era & EDM Explosion",
    },
    {
      value: "2020s",
      label: "2020s",
      description: "TikTok Influence & Genre Blending",
    },
  ];

  // GLOBAL presentation ("everywhere")
  const {
    globalMode,
    effective,
    setMode,
    hydrated: presentationHydrated,
  } = usePresentationMode();

  const decadeChoiceMode = effective; // 'list' | 'carousel1' | 'carousel2'
  const setDecadeChoiceMode = setMode;
  const isCarousel1 = effective === "carousel1";

  const [heroDismissed, setHeroDismissed] = useState(false);

  const loadDecadeData = useCallback(
    async (decade, nextPage = page) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/music/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "decade",
            decade,
            type: viewType,
            page: nextPage,
            pageSize,
            sortBy,
            sortDir,
          }),
        });

        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }

        const data = await response.json();
        let list = data.results || [];
        if (viewType === "artists") {
          const seen = new Set();
          list = list.filter((a) => {
            const k = (a.name || "")
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, "")
              .trim();
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
        }
        setResults(list);
        setTotalCount(
          typeof data.totalCount === "number" ? data.totalCount : null,
        );
      } catch (err) {
        console.error("Decade search error:", err);
        setError("Failed to load decade data. Please try again.");
        setResults([]);
        setTotalCount(null);
      } finally {
        setLoading(false);
      }
    },
    [viewType, page, pageSize, sortBy, sortDir],
  );

  useEffect(() => {
    if (selectedDecade) {
      setHeroDismissed(false);
      loadDecadeData(selectedDecade, page);
    }
  }, [selectedDecade, loadDecadeData, page]);

  // Reset page when switching view type or sort
  useEffect(() => {
    setPage(1);
    setHeroDismissed(false);
  }, [viewType, sortBy, sortDir]);

  const handleItemPress = useCallback(
    (item) => {
      if (viewType === "artists") {
        router.push({
          pathname: "/details/artist",
          params: {
            artistId: item.id,
            artistName: item.name,
          },
        });
      } else {
<<<<<<< ours
        const navParams = buildSongDetailParams(
          item,
          item?.artist || item?.artistName || item?.artist_name || "",
        );
        if (!navParams.songId && !navParams.songTitle) {
          console.error("DecadeSearch song press missing identity", item);
          return;
        }
=======
        const fallbackArtist = item?.artist || item?.artistName || "";
        const songParams = buildSongDetailParams(item, fallbackArtist);
        if (!songParams.songId && !songParams.songTitle) {
          console.error("Decade search song press missing identity", item);
          return;
        }

>>>>>>> theirs
        router.push({
          pathname: "/details/song",
<<<<<<< ours
          params: navParams,
=======
          params: songParams,
>>>>>>> theirs
        });
      }
    },
    [router, viewType],
  );

  const handleAlbumPress = useCallback(
    (albumName, artistName, songTitle) => {
      if (!songTitle) return;
      router.push({
        pathname: "/details/song-albums",
        params: { songTitle, artistName },
      });
    },
    [router],
  );

  const goHomeOrBack = () => {
    try {
      const canGoBack =
        typeof router.canGoBack === "function" ? router.canGoBack() : false;
      if (canGoBack) {
        router.back();
      } else {
        router.replace("/");
      }
    } catch (e) {
      router.replace("/");
    }
  };

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize));
  const showPager = totalCount && totalCount > pageSize; // both tabs now

  const Pager = ({ position = "bottom" }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: position === "bottom" ? 8 : 0,
        marginBottom: position === "top" ? 8 : 0,
        gap: 8,
      }}
    >
      <TouchableOpacity
        onPress={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page <= 1}
        style={{
          opacity: page <= 1 ? 0.5 : 1,
          backgroundColor: "#1A1A2E",
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <ChevronLeft size={16} color="#ffffff" />
        <Text style={{ color: "#ffffff" }}>Prev {pageSize}</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
          Page {page} of {totalPages}
        </Text>
        {/* Go to page control */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#1A1A2E",
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#9CA3AF", fontSize: 12 }}>Go to</Text>
          <TextInput
            value={gotoInput}
            onChangeText={setGotoInput}
            keyboardType="number-pad"
            placeholder="#"
            placeholderTextColor="#6B7280"
            style={{
              width: 48,
              height: 28,
              backgroundColor: "#111827",
              color: "#E5E7EB",
              borderRadius: 6,
              paddingHorizontal: 6,
              fontSize: 12,
              textAlign: "center",
            }}
          />
          <TouchableOpacity
            onPress={() => {
              const n = parseInt(gotoInput, 10);
              if (Number.isFinite(n)) {
                const clamped = Math.max(1, Math.min(totalPages, n));
                setPage(clamped);
              }
            }}
            style={{
              backgroundColor: "#4ECDC4",
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: "#0F0F23", fontWeight: "700", fontSize: 12 }}>
              Go
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => setPage((p) => (p + 1 <= totalPages ? p + 1 : p))}
        disabled={page >= totalPages}
        style={{
          opacity: page >= totalPages ? 0.5 : 1,
          backgroundColor: "#1A1A2E",
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Text style={{ color: "#ffffff" }}>Next {pageSize}</Text>
        <ChevronRight size={16} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  const SortBar = () => (
    <View
      style={{
        flexDirection: "row",
        gap: 8,
        marginBottom: 10,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <TouchableOpacity
        onPress={() => setSortBy("fame")}
        style={{
          backgroundColor: sortBy === "fame" ? "#4ECDC4" : "#1A1A2E",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
        }}
      >
        <Text
          style={{
            color: sortBy === "fame" ? "#0F0F23" : "#9CA3AF",
            fontWeight: "700",
          }}
        >
          Fame
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setSortBy("alpha")}
        style={{
          backgroundColor: sortBy === "alpha" ? "#4ECDC4" : "#1A1A2E",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
        }}
      >
        <Text
          style={{
            color: sortBy === "alpha" ? "#0F0F23" : "#9CA3AF",
            fontWeight: "700",
          }}
        >
          A–Z
        </Text>
      </TouchableOpacity>
      {viewType === "songs" ? (
        <>
          <TouchableOpacity
            onPress={() => setSortBy("year")}
            style={{
              backgroundColor: sortBy === "year" ? "#4ECDC4" : "#1A1A2E",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                color: sortBy === "year" ? "#0F0F23" : "#9CA3AF",
                fontWeight: "700",
              }}
            >
              Year
            </Text>
          </TouchableOpacity>
          {sortBy === "year" && (
            <View style={{ flexDirection: "row", gap: 6 }}>
              <TouchableOpacity
                onPress={() => setSortDir("asc")}
                style={{
                  backgroundColor: sortDir === "asc" ? "#FFEAA7" : "#1A1A2E",
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: sortDir === "asc" ? "#0F0F23" : "#9CA3AF",
                    fontWeight: "700",
                  }}
                >
                  ↑ Asc
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSortDir("desc")}
                style={{
                  backgroundColor: sortDir === "desc" ? "#FFEAA7" : "#1A1A2E",
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: sortDir === "desc" ? "#0F0F23" : "#9CA3AF",
                    fontWeight: "700",
                  }}
                >
                  ↓ Desc
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <TouchableOpacity
          onPress={() => setSortBy("hits")}
          style={{
            backgroundColor: sortBy === "hits" ? "#4ECDC4" : "#1A1A2E",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: sortBy === "hits" ? "#0F0F23" : "#9CA3AF",
              fontWeight: "700",
            }}
          >
            Hits
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const showCarouselModal =
    Boolean(selectedDecade) &&
    globalMode === "cards" &&
    !heroDismissed &&
    !loading &&
    !error &&
    results.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F23" }}>
      <StatusBar style="light" />

      {showCarouselModal ? (
        <HeroCarouselModal
          visible
          type={viewType === "artists" ? "artist" : "song"}
          data={results}
          title={viewType === "artists" ? "Browse artists" : "Browse songs"}
          subtitle={`${selectedDecade} • ${
            isCarousel1 ? "scroll the strip" : "swipe to browse"
          }`}
          initialIndex={0}
          onRequestClose={() => {
            setHeroDismissed(true);
          }}
          renderCard={({ item, media, isActive, width, height }) => {
            if (viewType === "artists") {
              const handleOpen = () => {
                setHeroDismissed(true);
                setTimeout(() => {
                  handleItemPress(item);
                }, 0);
              };

              if (isCarousel1) {
                return (
                  <ArtistStripCard
                    artist={item}
                    media={media}
                    width={width}
                    height={height}
                    onOpen={handleOpen}
                  />
                );
              }

              return (
                <ArtistSwipeCard
                  artist={item}
                  media={media}
                  isActive={Boolean(isActive)}
                  onOpen={handleOpen}
                />
              );
            }

            const albumName = item?.album;
            const artistName = item?.artist;
            const songTitle = item?.title;
            const canOpenAlbums =
              Boolean(albumName && String(albumName).trim()) &&
              typeof handleAlbumPress === "function";

            const handleOpen = () => {
              setHeroDismissed(true);
              setTimeout(() => {
                handleItemPress(item);
              }, 0);
            };

            const handleAlbums = canOpenAlbums
              ? () => {
                  setHeroDismissed(true);
                  setTimeout(() => {
                    handleAlbumPress(albumName, artistName, songTitle);
                  }, 0);
                }
              : null;

            if (isCarousel1) {
              return (
                <SongStripCard
                  song={item}
                  media={media}
                  width={width}
                  height={height}
                  onOpen={handleOpen}
                  onAlbums={handleAlbums}
                />
              );
            }

            return (
              <SongSwipeCard
                song={item}
                media={media}
                isActive={isActive}
                onOpen={handleOpen}
                onAlbums={handleAlbums}
              />
            );
          }}
        />
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          // Top safe-area is handled by the global PresentationTopPane in app/_layout.jsx
          paddingTop: 10,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <SearchHeader
          onBack={goHomeOrBack}
          onHome={() => router.replace("/")}
          title="Decades"
          subtitle="Pick a decade • browse top artists or hit songs"
          compact
        />

        {/* Decade Selection */}
        {!selectedDecade && (
          <View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "white",
                marginBottom: 16,
              }}
            >
              Choose a Decade
            </Text>

            {/* GLOBAL 3-way toggle (List / Carousel 1 / Carousel 2) */}
            {presentationHydrated ? <PresentationModeToggle /> : null}

            {decadeChoiceMode !== "list" ? (
              <View style={{ marginTop: 12 }}>
                <OverlappingCarousel
                  data={decades}
                  variant="stage"
                  height={null}
                  // IMPORTANT: let Carousel 2 compute a narrower width (Spain-style gutters)
                  width={decadeChoiceMode === "carousel1" ? 360 : null}
                  showIndex={false}
                  showDots={decadeChoiceMode === "carousel2"}
                  initialIndex={0}
                  renderCard={({ item, width, height, isActive }) => (
                    <ChoiceSwipeCard
                      choice={{
                        value: item.value,
                        label: item.label,
                        description: item.description,
                        accentColor: "#96CEB4",
                      }}
                      showcaseKind="decade"
                      showcaseValue={item.value}
                      width={width}
                      height={height}
                      isActive={isActive}
                      onSelect={() => {
                        setSelectedDecade(item.value);
                        setPage(1);
                        setSortBy("fame");
                        setSortDir("desc");
                      }}
                    />
                  )}
                />
              </View>
            ) : (
              <View>
                {decades.map((decade) => (
                  <ChoiceListCard
                    key={decade.value}
                    kind="decade"
                    value={decade.value}
                    title={decade.label}
                    subtitle={decade.description}
                    pill="DECADE"
                    accent="#96CEB4"
                    Icon={Calendar}
                    cardId="CS0010"
                    onPress={() => {
                      setSelectedDecade(decade.value);
                      setPage(1);
                      setSortBy("fame");
                      setSortDir("desc");
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Results */}
        {selectedDecade && (
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => setSelectedDecade(null)}
                style={{
                  backgroundColor: "#1A1A2E",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginRight: 12,
                }}
              >
                <Text style={{ color: "#8B8B8B", fontSize: 14 }}>
                  ← Back to Decades
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "white",
                  flex: 1,
                }}
              >
                {selectedDecade} Music
              </Text>
            </View>

            {/* View Type Toggle */}
            <View style={{ flexDirection: "row", marginBottom: 10, gap: 8 }}>
              <TouchableOpacity
                onPress={() => setViewType("artists")}
                style={{
                  backgroundColor:
                    viewType === "artists" ? "#96CEB4" : "#1A1A2E",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: viewType === "artists" ? "black" : "#8B8B8B",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Top Artists
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewType("songs")}
                style={{
                  backgroundColor: viewType === "songs" ? "#FF6B6B" : "#1A1A2E",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: viewType === "songs" ? "white" : "#8B8B8B",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Hit Songs
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sort bar */}
            <SortBar />

            {/* GLOBAL 3-way toggle (List / Carousel 1 / Carousel 2) */}
            {!loading && results.length > 0 ? <PresentationModeToggle /> : null}

            {loading && (
              <View style={{ alignItems: "center", paddingVertical: 16 }}>
                <SearchingBanner />
                <ActivityIndicator size="large" color="#96CEB4" />
                <Text style={{ color: "#8B8B8B", marginTop: 12 }}>
                  Loading {selectedDecade} music...
                </Text>
              </View>
            )}

            {error && (
              <View
                style={{
                  backgroundColor: "#FF6B6B20",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 20,
                  borderLeftWidth: 3,
                  borderLeftColor: "#FF6B6B",
                }}
              >
                <Text style={{ color: "#FF6B6B", fontSize: 14 }}>{error}</Text>
              </View>
            )}

            {!loading && results.length > 0 && (
              <View>
                <Text
                  style={{ fontSize: 16, color: "#8B8B8B", marginBottom: 12 }}
                >
                  {totalCount != null ? `${totalCount} ` : ""}
                  {viewType === "artists" ? "artists" : "songs"} found
                </Text>

                {/* Top pager for both */}
                {showPager && <Pager position="top" />}

                {viewType === "artists"
                  ? results.map((artist, index) => (
                      <ArtistItem
                        key={artist.id || index}
                        artist={artist}
                        index={(page - 1) * pageSize + index}
                        onPress={() => handleItemPress(artist)}
                      />
                    ))
                  : results.map((song, index) => (
                      <SongCard
                        key={song.id || index}
                        song={song}
                        index={(page - 1) * pageSize + index}
                        onPress={() => handleItemPress(song)}
                        onAlbumPress={(albumName, artistName) =>
                          handleAlbumPress(albumName, artistName, song.title)
                        }
                      />
                    ))}

                {/* Bottom pager for both */}
                {showPager && <Pager position="bottom" />}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
