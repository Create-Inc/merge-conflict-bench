import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useYearSearch } from "@/hooks/useYearSearch";
import usePresentationMode from "@/hooks/usePresentationMode";
import { SearchHeader } from "@/components/YearSearch/SearchHeader";
import { DecadeButtons } from "@/components/YearSearch/DecadeButtons";
import { CustomYearRange } from "@/components/YearSearch/CustomYearRange";
import { ResultsHeader } from "@/components/YearSearch/ResultsHeader";
import { ViewTypeToggle } from "@/components/YearSearch/ViewTypeToggle";
import { SortBar } from "@/components/YearSearch/SortBar";
import { DisplayModeToggle } from "@/components/YearSearch/DisplayModeToggle";
import { LoadingState } from "@/components/YearSearch/LoadingState";
import { EmptyState } from "@/components/YearSearch/EmptyState";
import { ResultsList } from "@/components/YearSearch/ResultsList";
import { CarouselModal } from "@/components/YearSearch/CarouselModal";
import { buildSongDetailParams } from "@/utils/songNav";

export default function YearSearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const handledIncomingDecadeRef = useRef(null);

  const {
    fromYear,
    setFromYear,
    toYear,
    setToYear,
    selectedRange,
    setSelectedRange,
    results,
    totalCount,
    page,
    setPage,
    pageSize,
    loading,
    error,
    setError,
    viewType,
    setViewType,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    handleDecadePress,
    handleCustomSearch,
  } = useYearSearch();

  // NEW: allow main-menu decade thumbnails to deep-link into a decade search
  useEffect(() => {
    const raw = params?.decade;
    const d = Array.isArray(raw) ? raw[0] : raw;
    const decadeLabel = String(d ?? "").trim();

    if (!decadeLabel) return;
    if (handledIncomingDecadeRef.current === decadeLabel) return;

    // Only auto-run if we're still on the choose-a-range screen
    if (selectedRange) return;

    const m = /^(\d{4})s$/.exec(decadeLabel);
    if (!m) return;

    const from = parseInt(m[1], 10);
    if (!Number.isFinite(from)) return;

    handledIncomingDecadeRef.current = decadeLabel;

    handleDecadePress({ label: decadeLabel, from, to: from + 9 });
  }, [params?.decade, handleDecadePress, selectedRange]);

  // GLOBAL presentation ("everywhere")
  const { globalMode: displayMode, setMode: setDisplayMode } =
    usePresentationMode();

  const showCarouselModal =
    Boolean(selectedRange) &&
    displayMode === "cards" &&
    !loading &&
    !error &&
    results.length > 0;

  const handleItemPress = useCallback(
    (item) => {
      if (viewType === "songs") {
        const fallbackArtist =
          item?.artist || item?.artistName || item?.artist_name || "";
        const songParams = buildSongDetailParams(item, fallbackArtist);
        if (!songParams.songId && !songParams.songTitle) {
          console.error("Year search song press missing identity", item);
          return;
        }

        router.push({
          pathname: "/details/song",
          params: songParams,
        });
      } else {
        router.push({
          pathname: "/details/artist",
          params: {
            artistId: item.id,
            artistName: item.name,
          },
        });
      }
    },
    [router, viewType],
  );

  const handleAlbumPress = useCallback(
    (albumName, artistName) => {
      if (!albumName) return;
      router.push({
        pathname: "/details/album",
        params: { albumName, artistName },
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

  return (
    <View style={{ flex: 1, backgroundColor: "#0F0F23" }}>
      <StatusBar style="light" />

      <CarouselModal
        visible={showCarouselModal}
        viewType={viewType}
        results={results}
        selectedRange={selectedRange}
        onClose={() => setDisplayMode("list")}
        onItemPress={handleItemPress}
        onAlbumPress={handleAlbumPress}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          // Top safe-area is handled by the global PresentationTopPane in app/_layout.jsx
          paddingTop: 10,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SearchHeader
          onBack={goHomeOrBack}
          onHome={() => router.replace("/")}
        />

        {!selectedRange && (
          <View>
            <DecadeButtons onDecadePress={handleDecadePress} />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#2A2A2A" }}
              />
              <Text
                style={{ color: "#8B8B8B", fontSize: 14, marginHorizontal: 12 }}
              >
                OR
              </Text>
              <View
                style={{ flex: 1, height: 1, backgroundColor: "#2A2A2A" }}
              />
            </View>

            <CustomYearRange
              fromYear={fromYear}
              setFromYear={setFromYear}
              toYear={toYear}
              setToYear={setToYear}
              loading={loading}
              onSearch={handleCustomSearch}
            />

            <Text
              style={{
                fontSize: 14,
                color: "#8B8B8B",
                textAlign: "center",
                marginTop: 12,
              }}
            >
              Tap a decade for instant results, or enter a custom range (1950-
              {new Date().getFullYear()})
            </Text>
          </View>
        )}

        {error && !selectedRange && (
          <View
            style={{
              backgroundColor: "#FF6B6B20",
              borderRadius: 8,
              padding: 12,
              marginTop: 12,
              borderLeftWidth: 3,
              borderLeftColor: "#FF6B6B",
            }}
          >
            <Text style={{ color: "#FF6B6B", fontSize: 14 }}>{error}</Text>
          </View>
        )}

        {selectedRange && (
          <View>
            <ResultsHeader
              selectedRange={selectedRange}
              onBack={() => setSelectedRange(null)}
            />

            <ViewTypeToggle viewType={viewType} setViewType={setViewType} />

            <SortBar
              viewType={viewType}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortDir={sortDir}
              setSortDir={setSortDir}
            />

            {!loading && results.length > 0 && (
              <DisplayModeToggle
                displayMode={displayMode}
                setDisplayMode={setDisplayMode}
              />
            )}

            {loading && <LoadingState selectedRange={selectedRange} />}

            {!loading && results.length > 0 && (
              <ResultsList
                viewType={viewType}
                results={results}
                selectedRange={selectedRange}
                totalCount={totalCount}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onItemPress={handleItemPress}
                onAlbumPress={handleAlbumPress}
              />
            )}

            {!loading && results.length === 0 && !error && (
              <EmptyState selectedRange={selectedRange} />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
