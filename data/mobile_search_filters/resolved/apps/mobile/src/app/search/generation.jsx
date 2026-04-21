import React, { useState, useCallback, useEffect, useRef } from "react";
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
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Users,
  Music,
  User,
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

export default function GenerationSearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const handledIncomingGenRef = useRef(null);
  const [selectedGeneration, setSelectedGeneration] = useState(null);
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [gotoInput, setGotoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState("artists"); // "artists" or "songs"
  const [sortBy, setSortBy] = useState("fame"); // fame | alpha | year(hits)
  const [sortDir, setSortDir] = useState("desc"); // for year sort

  const generations = [
    {
      value: "silent",
      label: "Silent Generation",
      description: "Born 1928-1945 • Jazz, Big Band, Early Rock",
      years: "1928-1945",
      musicStyle: "Jazz, Swing, Early Rock & Roll",
    },
    {
      value: "boomer",
      label: "Baby Boomers",
      description: "Born 1946-1964 • Rock Revolution Era",
      years: "1946-1964",
      musicStyle: "Rock, Folk, Psychedelic, Classic Rock",
    },
    {
      value: "genx",
      label: "Generation X",
      description: "Born 1965-1980 • Grunge & Alternative",
      years: "1965-1980",
      musicStyle: "Grunge, Alternative, Punk, New Wave",
    },
    {
      value: "millennial",
      label: "Millennials",
      description: "Born 1981-1996 • Pop & Hip-Hop Era",
      years: "1981-1996",
      musicStyle: "Pop, Hip-Hop, Electronic, Indie",
    },
    {
      value: "genz",
      label: "Generation Z",
      description: "Born 1997-2012 • Streaming & Viral",
      years: "1997-2012",
      musicStyle: "Viral Pop, Trap, Hyperpop, TikTok Hits",
    },
    {
      value: "genalpha",
      label: "Generation Alpha",
      description: "Born 2013+ • AI & Global Fusion",
      years: "2013+",
      musicStyle: "AI-Generated, Global Fusion, Micro-Songs",
    },
  ];

  // NEW: allow main-menu thumbnails to deep-link into a generation
  useEffect(() => {
    const raw = params?.generation;
    const g = Array.isArray(raw) ? raw[0] : raw;
    const genKey = String(g ?? "").trim();

    if (!genKey) return;
    if (handledIncomingGenRef.current === genKey) return;

    handledIncomingGenRef.current = genKey;

    setSelectedGeneration(genKey);
    setPage(1);
    setViewType("artists");
    setSortBy("fame");
    setSortDir("desc");
  }, [params?.generation]);

  // GLOBAL presentation ("everywhere")
  const {
    globalMode,
    effective: generationChoiceMode,
    setMode: setGenerationChoiceMode,
    hydrated: presentationHydrated,
  } = usePresentationMode();

  const isCarousel1 = generationChoiceMode === "carousel1";

  const loadGenerationData = useCallback(
    async (generation, nextPage = page) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/music/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "generation",
            generation,
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
        setResults(data.results || []);
        setTotalCount(
          typeof data.totalCount === "number" ? data.totalCount : null,
        );
      } catch (err) {
        console.error("Generation search error:", err);
        setError(
          viewType === "artists"
            ? "Failed to load generation data. Please try again."
            : "Failed to load anthem songs. Please try again.",
        );
        setResults([]);
        setTotalCount(null);
      } finally {
        setLoading(false);
      }
    },
    [viewType, page, pageSize, sortBy, sortDir],
  );

  useEffect(() => {
    if (selectedGeneration) {
      loadGenerationData(selectedGeneration, page);
    }
  }, [selectedGeneration, loadGenerationData, page]);

  // Reset page on view or sort switch
  useEffect(() => {
    setPage(1);
    if (selectedGeneration) {
      loadGenerationData(selectedGeneration, 1);
    }
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
        const fallbackArtist =
          item?.artist || item?.artistName || item?.artist_name || "";
        const songParams = buildSongDetailParams(item, fallbackArtist);
        if (!songParams.songId && !songParams.songTitle) {
          console.error("Generation search song press missing identity", item);
          return;
        }

        router.push({
          pathname: "/details/song",
          params: songParams,
        });
      }
    },
    [router, viewType],
  );

  const handleAlbumPress = useCallback(
    (albumName, artistName, songTitle) => {
      // Open a list of all albums this song appears on
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

  const getGenerationLabel = (gen) => {
    return (
      generations.find((g) => g.value === selectedGeneration)?.label ||
      selectedGeneration
    );
  };

  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize));
  const showPager = totalCount && totalCount > pageSize; // apply to both tabs now

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

  // Sort controls
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

  // Remove legacy screen-local display mode; use the global setting
  const displayMode = globalMode;
  const setDisplayMode = setGenerationChoiceMode;

  const showCarouselModal =
    Boolean(selectedGeneration) &&
    displayMode === "cards" &&
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
          subtitle={`${getGenerationLabel()} • ${
            isCarousel1 ? "scroll the strip" : "swipe to browse"
          }`}
          initialIndex={0}
          onRequestClose={() => setDisplayMode("list")}
          renderCard={({ item, media, isActive, width, height }) => {
            if (viewType === "artists") {
              const handleOpen = () => {
                setDisplayMode("list");
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
              setDisplayMode("list");
              setTimeout(() => {
                handleItemPress(item);
              }, 0);
            };

            const handleAlbums = canOpenAlbums
              ? () => {
                  setDisplayMode("list");
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
          title="Generations"
          subtitle="Pick a generation • browse defining artists or anthem songs"
          compact
        />

        {/* Error State */}
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

        {/* Generation Selection */}
        {!selectedGeneration && (
          <View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "white",
                marginBottom: 16,
              }}
            >
              Choose a Generation
            </Text>

            {/* GLOBAL 3-way toggle */}
            {presentationHydrated ? <PresentationModeToggle /> : null}

            {generationChoiceMode !== "list" ? (
              <View style={{ marginTop: 12 }}>
                <OverlappingCarousel
                  data={generations}
                  variant="stage"
                  // Let OverlappingCarousel decide its own height based on the chosen global carousel style.
                  // This prevents mismatches that can make cards feel clipped/blank.
                  height={null}
                  // IMPORTANT: let Carousel 2 compute a narrower width (Spain-style gutters)
                  width={generationChoiceMode === "carousel1" ? 360 : null}
                  showIndex={false}
                  showDots={generationChoiceMode === "carousel2"}
                  initialIndex={0}
                  renderCard={({ item, width, height, isActive }) => (
                    <ChoiceSwipeCard
                      choice={{
                        value: item.value,
                        label: item.label,
                        // Use the shorter "Born ..." line for the main description.
                        description: item.description,
                        accentColor: "#FECA57",
                      }}
                      showcaseKind="generation"
                      showcaseValue={item.value}
                      width={width}
                      height={height}
                      isActive={isActive}
                      onSelect={() => {
                        setSelectedGeneration(item.value);
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
                {generations.map((generation) => (
                  <ChoiceListCard
                    key={generation.value}
                    kind="generation"
                    value={generation.value}
                    title={generation.label}
                    subtitle={`${generation.years} • ${generation.musicStyle}`}
                    pill="GENERATION"
                    accent="#FECA57"
                    Icon={Users}
                    cardId="CS0010"
                    onPress={() => {
                      setSelectedGeneration(generation.value);
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
        {selectedGeneration && (
          <View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => setSelectedGeneration(null)}
                style={{
                  backgroundColor: "#1A1A2E",
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginRight: 12,
                }}
              >
                <Text style={{ color: "#8B8B8B", fontSize: 14 }}>
                  ← Back to Generations
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
                {getGenerationLabel()} Music
              </Text>
            </View>

            {/* View Type Toggle */}
            <View style={{ flexDirection: "row", marginBottom: 10, gap: 8 }}>
              <TouchableOpacity
                onPress={() => setViewType("artists")}
                style={{
                  backgroundColor:
                    viewType === "artists" ? "#FECA57" : "#1A1A2E",
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
                  Defining Artists
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
                  Anthem Songs
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sort bar */}
            <SortBar />

            {/* GLOBAL 3-way toggle */}
            {!loading && results.length > 0 ? <PresentationModeToggle /> : null}

            {loading && (
              <View style={{ alignItems: "center", paddingVertical: 16 }}>
                <SearchingBanner />
                <ActivityIndicator size="large" color="#FECA57" />
                <Text style={{ color: "#8B8B8B", marginTop: 12 }}>
                  Loading {getGenerationLabel()} music...
                </Text>
              </View>
            )}

            {!loading && results.length > 0 && (
              <View>
                <Text
                  style={{ fontSize: 16, color: "#8B8B8B", marginBottom: 16 }}
                >
                  {totalCount != null ? `${totalCount} ` : ""}
                  {viewType === "artists" ? "defining artists" : "anthem songs"}{" "}
                  found
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
