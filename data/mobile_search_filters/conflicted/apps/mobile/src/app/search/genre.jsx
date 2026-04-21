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
  Music,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { SongItem as SongCard } from "@/components/SongSearch/SongItem";
import { ArtistItem } from "@/components/SongSearch/ArtistItem";
import SearchingBanner from "@/components/SearchingBanner";
import HeroCarouselModal from "@/components/Carousel/HeroCarouselModal";
import SongSwipeCard from "@/components/Carousel/SongSwipeCard";
import ArtistSwipeCard from "@/components/Carousel/ArtistSwipeCard";
import SongStripCard from "@/components/Carousel/SongStripCard";
import ArtistStripCard from "@/components/Carousel/ArtistStripCard";
import OverlappingCarousel from "@/components/Carousel/OverlappingCarousel";
import ChoiceSwipeCard from "@/components/Carousel/ChoiceSwipeCard";
import ChoiceListCard from "@/components/Carousel/ChoiceListCard";
import { usePresentationStore } from "@/utils/presentationStore";
import { SearchHeader } from "@/components/SongSearch/SearchHeader";
import { buildSongDetailParams } from "@/utils/songNav";

export default function GenreSearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const handledIncomingGenreRef = useRef(null);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const [error, setError] = useState(null);

  // new: tabs + paging + sorting
  const [viewType, setViewType] = useState("songs"); // "songs" | "artists"
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [gotoInput, setGotoInput] = useState("");
  const [sortBy, setSortBy] = useState("fame"); // fame | alpha | year | hits
  const [sortDir, setSortDir] = useState("desc"); // for year sort only

  // GLOBAL presentation
  const globalMode = usePresentationStore((s) => s.globalMode);
  const globalCarouselStyle = usePresentationStore(
    (s) => s.globalCarouselStyle,
  );
  const setGlobalMode = usePresentationStore((s) => s.setGlobalMode);

  const displayMode = globalMode === "cards" ? "cards" : "list";
  const genreChoiceMode = globalMode === "list" ? "list" : globalCarouselStyle;
  const isCarousel1 = globalCarouselStyle === "carousel1";

  const showCarouselModal =
    Boolean(selectedGenre) &&
    displayMode === "cards" &&
    !loading &&
    !error &&
    results.length > 0;

  // Load genres list on mount
  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = useCallback(async () => {
    setLoadingGenres(true);
    setError(null);
    try {
      const response = await fetch("/api/music/genres");
      if (!response.ok) throw new Error("Failed to load genres");

      const data = await response.json();
      setGenres(data.genres || []);
    } catch (err) {
      console.error("Genre list error:", err);
      setError("Failed to load genres");
    } finally {
      setLoadingGenres(false);
    }
  }, []);

  const searchGenre = useCallback(
    async (genreName, nextPage = page) => {
      setLoading(true);
      setError(null);
      setSelectedGenre(genreName);

      try {
        const response = await fetch("/api/music/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "genre",
            genre: genreName,
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
        // Final client-side guard to avoid duped artists on this tab
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
        console.error("Genre search error:", err);
        setError("Failed to search genre. Please try again.");
        setResults([]);
        setTotalCount(null);
      } finally {
        setLoading(false);
      }
    },
    [viewType, page, pageSize, sortBy, sortDir],
  );

  // NEW: allow main-menu thumbnails to deep-link into a genre
  useEffect(() => {
    const raw = params?.genre;
    const g = Array.isArray(raw) ? raw[0] : raw;
    const genreName = String(g ?? "").trim();

    if (!genreName) return;
    if (handledIncomingGenreRef.current === genreName) return;

    handledIncomingGenreRef.current = genreName;

    setPage(1);
    setViewType("songs");
    setSortBy("fame");
    setSortDir("desc");
    searchGenre(genreName, 1);
  }, [params?.genre, searchGenre]);

  // refetch when switching tab or sort
  useEffect(() => {
    setPage(1);
    if (selectedGenre) {
      searchGenre(selectedGenre, 1);
    }
  }, [viewType, sortBy, sortDir]);

  // refetch on page change
  useEffect(() => {
    if (selectedGenre) {
      searchGenre(selectedGenre, page);
    }
  }, [page]);

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
          console.error("GenreSearch song press missing identity", item);
          return;
        }
=======
        const fallbackArtist = item?.artist || item?.artistName || "";
        const songParams = buildSongDetailParams(item, fallbackArtist);
        if (!songParams.songId && !songParams.songTitle) {
          console.error("Genre search song press missing identity", item);
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

  const getPopularityColor = (score) => {
    if (score >= 90) return "#FFD700";
    if (score >= 80) return "#FF6B6B";
    if (score >= 70) return "#4ECDC4";
    if (score >= 60) return "#96CEB4";
    return "#8B8B8B";
  };

  const renderGenreItem = (genre, index) => {
    const accent = genre.color || "#FFEAA7";

    return (
      <ChoiceListCard
        key={genre.id || index}
        kind="genre"
        value={genre.name}
        title={genre.name}
        subtitle={genre.description}
        pill="GENRE"
        accent={accent}
        Icon={Music}
        cardId="CS0010"
        // Only fetch artwork for the first handful to keep list mode fast.
        artworkEnabled={index < 12}
        onPress={() => {
          setPage(1);
          setViewType("songs");
          setSortBy("fame");
          setSortDir("desc");
          searchGenre(genre.name, 1);
        }}
      />
    );
  };

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
  const showPager = totalCount && totalCount > pageSize;

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
        marginBottom: 12,
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

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F23" }}>
      <StatusBar style="light" />

      {showCarouselModal ? (
        <HeroCarouselModal
          visible
          type={viewType === "artists" ? "artist" : "song"}
          data={results}
          title={viewType === "artists" ? "Browse artists" : "Browse songs"}
          subtitle={`${selectedGenre} • ${
            isCarousel1 ? "scroll the strip" : "swipe to browse"
          }`}
          initialIndex={0}
          onRequestClose={() => setGlobalMode("list")}
          renderCard={({ item, media, isActive, width, height }) => {
            if (viewType === "artists") {
              const handleOpen = () => {
                setGlobalMode("list");
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
              setGlobalMode("list");
              setTimeout(() => {
                handleItemPress(item);
              }, 0);
            };

            const handleAlbums = canOpenAlbums
              ? () => {
                  setGlobalMode("list");
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
        {/* NEW: consistent header */}
        <SearchHeader
          onBack={() => {
            if (selectedGenre) {
              setSelectedGenre(null);
              setResults([]);
              setTotalCount(null);
              setPage(1);
              setViewType("songs");
              setSortBy("fame");
              setSortDir("desc");
            } else {
              goHomeOrBack();
            }
          }}
          onHome={() => router.replace("/")}
          title={selectedGenre ? selectedGenre : "Genres"}
          subtitle={
            selectedGenre ? "Browse songs or artists" : "Pick a genre to start"
          }
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

        {/* Loading State for Genres */}
        {loadingGenres && !selectedGenre && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#FFEAA7" />
            <Text style={{ color: "#8B8B8B", marginTop: 12 }}>
              Loading genres...
            </Text>
          </View>
        )}

        {/* Genre Choice */}
        {!selectedGenre && !loadingGenres && genres.length > 0 ? (
          <View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: "white",
                marginBottom: 16,
              }}
            >
              All Genres ({genres.length})
            </Text>

            {genreChoiceMode !== "list" ? (
              <View style={{ marginTop: 12 }}>
                <OverlappingCarousel
                  data={genres}
                  variant="stage"
                  height={null}
                  // IMPORTANT: let Carousel 2 compute a narrower width (Spain-style gutters)
                  width={genreChoiceMode === "carousel1" ? 360 : null}
                  showIndex={false}
                  showDots={genreChoiceMode === "carousel2"}
                  initialIndex={0}
                  renderCard={({ item, width, height, isActive }) => (
                    <ChoiceSwipeCard
                      choice={{
                        value: item.name,
                        label: item.name,
                        description: item.description,
                        accentColor: item.color || "#FFEAA7",
                      }}
                      showcaseKind="genre"
                      showcaseValue={item.name}
                      width={width}
                      height={height}
                      isActive={isActive}
                      onSelect={() => {
                        setPage(1);
                        setViewType("songs");
                        setSortBy("fame");
                        setSortDir("desc");
                        searchGenre(item.name, 1);
                      }}
                    />
                  )}
                />
              </View>
            ) : (
              <View>
                {genres.map((genre, index) => renderGenreItem(genre, index))}
              </View>
            )}
          </View>
        ) : null}

        {/* Selected Genre Results */}
        {selectedGenre && (
          <View>
            {/* Tabs */}
            <View style={{ flexDirection: "row", marginBottom: 12, gap: 8 }}>
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
                  Songs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewType("artists")}
                style={{
                  backgroundColor:
                    viewType === "artists" ? "#4ECDC4" : "#1A1A2E",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: viewType === "artists" ? "#0F0F23" : "#8B8B8B",
                    fontSize: 14,
                    fontWeight: "600",
                  }}
                >
                  Artists
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sort bar */}
            <SortBar />

            {/* Loading */}
            {loading && (
              <View style={{ alignItems: "center", paddingVertical: 16 }}>
                <SearchingBanner />
                <ActivityIndicator size="large" color="#FFEAA7" />
                <Text style={{ color: "#8B8B8B", marginTop: 12 }}>
                  Searching {selectedGenre}...
                </Text>
              </View>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#8B8B8B",
                    marginBottom: 12,
                  }}
                >
                  {totalCount != null ? `${totalCount} ` : ""}
                  {viewType}
                </Text>

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

                {showPager && <Pager position="bottom" />}
              </View>
            )}

            {/* Empty Results */}
            {!loading && results.length === 0 && !error && (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 40,
                }}
              >
                <Music size={48} color="#8B8B8B" />
                <Text
                  style={{
                    fontSize: 18,
                    color: "#8B8B8B",
                    marginTop: 16,
                    textAlign: "center",
                  }}
                >
                  No {viewType} found for {selectedGenre}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
