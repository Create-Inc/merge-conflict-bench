import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useUpload from "@/utils/useUpload";
import useUser from "@/utils/useUser";
import { MapSelector } from "./CampaignMapPanel/MapSelector";
import { CreateMapForm } from "./CampaignMapPanel/CreateMapForm";
import { MapCanvas } from "./CampaignMapPanel/MapCanvas";
import { ToolPanel } from "./CampaignMapPanel/ToolPanel";
import { useCampaignMaps } from "./CampaignMapPanel/useCampaignMaps";
import { useCampaignTokens } from "./CampaignMapPanel/useCampaignTokens";
import { useMapMutations } from "./CampaignMapPanel/useMapMutations";
import { useTokenMutations } from "./CampaignMapPanel/useTokenMutations";
import { useTokenDrag } from "./CampaignMapPanel/useTokenDrag";
import { useGridStyle } from "./CampaignMapPanel/useGridStyle";

export default function CampaignMapPanel({ campaignId, members, myMembership }) {
  const [upload, { loading: uploadLoading }] = useUpload();
  const { data: user } = useUser();
  const currentUserId = user?.id;

  const isOwner =
    myMembership?.role === "owner" && myMembership?.status === "accepted";

  const mapViewportRef = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [selectedMapId, setSelectedMapId] = useState(null);

  // Create-map form state (only shown when no maps exist yet)
  const [createTitle, setCreateTitle] = useState("Main Map");
  const [createGridEnabled, setCreateGridEnabled] = useState(true);
  const [createGridSize, setCreateGridSize] = useState(32);
  const [createGridOpacity, setCreateGridOpacity] = useState(0.06);
  const [createGridColor, setCreateGridColor] = useState("#ffffff");
  const [createBackgroundColor, setCreateBackgroundColor] = useState("#111827");
  const [createSortOrder, setCreateSortOrder] = useState(0);
  const [createSetDefault, setCreateSetDefault] = useState(true);

  // Add token state
  const [addKind, setAddKind] = useState("monster");
  const [addLabel, setAddLabel] = useState("");
  const [addColor, setAddColor] = useState("#1f2937");
  const [addSize, setAddSize] = useState(56);

  const [error, setError] = useState(null);

  const { maps, activeMapId, mapsLoading } = useCampaignMaps(campaignId);

  useEffect(() => {
    if (!selectedMapId && activeMapId) {
      setSelectedMapId(activeMapId);
    }
  }, [activeMapId, selectedMapId]);

  const selectedMap = useMemo(() => {
    return (
      maps.find((m) => String(m.id) === String(selectedMapId)) ||
      maps.find((m) => m.is_default) ||
      maps[0] ||
      null
    );
  }, [maps, selectedMapId]);

  const mapIdForTokens = selectedMap?.id || null;

  const { tokens, tokensLoading } = useCampaignTokens(campaignId, mapIdForTokens);

  const selectedToken = useMemo(() => {
    return tokens.find((t) => String(t.id) === String(selectedTokenId)) || null;
  }, [tokens, selectedTokenId]);

  const { createMapMutation, updateMapMutation, deleteMapMutation } =
    useMapMutations(campaignId, setSelectedMapId, setError);

  const { addTokenMutation, updateTokenMutation, deleteTokenMutation } =
    useTokenMutations(
      campaignId,
      mapIdForTokens,
      setSelectedTokenId,
      setError,
      setAddLabel,
    );

  const onSelect = useCallback((t) => {
    setSelectedTokenId(t?.id || null);
    setError(null);
  }, []);

  const canDragToken = useCallback(
    (t) => {
      if (isOwner) return true;
      if (!currentUserId) return false;
      const isPc = String(t.token_kind) === "pc";
      const isMine = String(t.created_by) === String(currentUserId);
      return isPc && isMine;
    },
    [isOwner, currentUserId],
  );

  const { onPointerDown } = useTokenDrag(
    campaignId,
    mapIdForTokens,
    zoom,
    updateTokenMutation,
    setSelectedTokenId,
    mapViewportRef,
    canDragToken,
  );

  const onUploadBackground = useCallback(
    async (file) => {
      if (!file) return;
      setError(null);

      const { url, error: uploadError } = await upload({ file });
      if (uploadError) {
        setError(uploadError);
        return;
      }

      createMapMutation.mutate({
        backgroundUrl: url,
        title: createTitle,
        gridEnabled: createGridEnabled,
        gridSize: createGridSize,
        gridOpacity: createGridOpacity,
        gridColor: createGridColor,
        backgroundColor: createBackgroundColor,
        sortOrder: createSortOrder,
        setDefault: createSetDefault,
      });
    },
    [
      upload,
      createMapMutation,
      createTitle,
      createGridEnabled,
      createGridSize,
      createGridOpacity,
      createGridColor,
      createBackgroundColor,
      createSortOrder,
      createSetDefault,
    ],
  );

  const onUploadSelectedMapBackground = useCallback(
    async (file) => {
      if (!file || !selectedMap) return;
      setError(null);

      const { url, error: uploadError } = await upload({ file });
      if (uploadError) {
        setError(uploadError);
        return;
      }

      updateMapMutation.mutate({ mapId: selectedMap.id, backgroundUrl: url });
    },
    [selectedMap, updateMapMutation, upload],
  );

  const onClearSelectedMapBackground = useCallback(() => {
    if (!selectedMap) return;
    updateMapMutation.mutate({ mapId: selectedMap.id, backgroundUrl: null });
  }, [selectedMap, updateMapMutation]);

  const addPcTokens = useCallback(() => {
    const accepted = (members || []).filter((m) => m.status === "accepted");
    const pcs = accepted.filter((m) => m.role !== "owner");

    let i = 0;
    for (const p of pcs) {
      const offset = i * 70;
      addTokenMutation.mutate({
        mapId: mapIdForTokens,
        tokenKind: "pc",
        label: p.display_name,
        color: "#111827",
        size: 56,
        x: 80 + offset,
        y: 80,
      });
      i++;
    }
  }, [addTokenMutation, mapIdForTokens, members]);

  const gridStyle = useGridStyle(selectedMap);

  const hasAnyMaps = maps.length > 0;

  const handleMapChange = (newMapId) => {
    setSelectedTokenId(null);
    setSelectedMapId(newMapId);
  };

  const handleSetDefault = (mapId) => {
    updateMapMutation.mutate({ mapId, setDefault: true });
  };

  const handleDeleteMap = (mapId) => {
    const ok = confirm("Delete this map? Tokens on it will be deleted too.");
    if (!ok) return;
    deleteMapMutation.mutate(mapId);
  };

  const handleAddToken = () => {
    addTokenMutation.mutate({
      mapId: mapIdForTokens,
      tokenKind: addKind,
      label: addLabel || null,
      color: addColor || null,
      size: addSize,
      x: 80,
      y: 80,
    });
  };

  const handleCreateBlankMap = () => {
    const nextTitle = "New Map";
    const nextGridEnabled = true;
    const nextGridSize = 32;
    const nextGridOpacity = 0.06;
    const nextGridColor = "#ffffff";
    const nextBg = "#111827";

    setCreateTitle(nextTitle);
    setCreateGridEnabled(nextGridEnabled);
    setCreateGridSize(nextGridSize);
    setCreateGridOpacity(nextGridOpacity);
    setCreateGridColor(nextGridColor);
    setCreateBackgroundColor(nextBg);
    setCreateSortOrder(0);
    setCreateSetDefault(true);

    createMapMutation.mutate({
      backgroundUrl: null,
      title: nextTitle,
      gridEnabled: nextGridEnabled,
      gridSize: nextGridSize,
      gridOpacity: nextGridOpacity,
      gridColor: nextGridColor,
      backgroundColor: nextBg,
      sortOrder: 0,
      setDefault: true,
    });
  };

  const handleCreateBlankMapInitial = () => {
    createMapMutation.mutate({
      backgroundUrl: null,
      title: createTitle,
      gridEnabled: createGridEnabled,
      gridSize: createGridSize,
      gridOpacity: createGridOpacity,
      gridColor: createGridColor,
      backgroundColor: createBackgroundColor,
      sortOrder: createSortOrder,
      setDefault: createSetDefault,
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900/20 border border-red-900 p-3 rounded">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <MapSelector
        maps={maps}
        selectedMapId={selectedMapId}
        selectedMap={selectedMap}
        isOwner={isOwner}
        onMapChange={handleMapChange}
        onSetDefault={handleSetDefault}
        onDeleteMap={handleDeleteMap}
        updateMapPending={updateMapMutation.isPending}
        deleteMapPending={deleteMapMutation.isPending}
      />

      {!isOwner && !hasAnyMaps && !mapsLoading ? (
        <div className="bg-[#121212] border border-gray-700 p-6 rounded text-center text-gray-400 text-sm">
          The DM hasn’t created a map yet.
        </div>
      ) : null}

      {isOwner && !hasAnyMaps && !mapsLoading ? (
        <CreateMapForm
          createTitle={createTitle}
          setCreateTitle={setCreateTitle}
          createGridEnabled={createGridEnabled}
          setCreateGridEnabled={setCreateGridEnabled}
          createGridSize={createGridSize}
          setCreateGridSize={setCreateGridSize}
          createGridOpacity={createGridOpacity}
          setCreateGridOpacity={setCreateGridOpacity}
          createGridColor={createGridColor}
          setCreateGridColor={setCreateGridColor}
          createBackgroundColor={createBackgroundColor}
          setCreateBackgroundColor={setCreateBackgroundColor}
          createSortOrder={createSortOrder}
          setCreateSortOrder={setCreateSortOrder}
          createSetDefault={createSetDefault}
          setCreateSetDefault={setCreateSetDefault}
          onUploadBackground={onUploadBackground}
          onCreateBlankMap={handleCreateBlankMapInitial}
          uploadLoading={uploadLoading}
          createMapPending={createMapMutation.isPending}
        />
      ) : null}

      {selectedMap ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MapCanvas
            selectedMap={selectedMap}
            tokens={tokens}
            selectedTokenId={selectedTokenId}
            zoom={zoom}
            setZoom={setZoom}
            onSelect={onSelect}
            onPointerDown={onPointerDown}
            mapViewportRef={mapViewportRef}
            gridStyle={gridStyle}
            canDragToken={canDragToken}
          />

          <ToolPanel
            isOwner={isOwner}
            addKind={addKind}
            setAddKind={setAddKind}
            addSize={addSize}
            setAddSize={setAddSize}
            addLabel={addLabel}
            setAddLabel={setAddLabel}
            addColor={addColor}
            setAddColor={setAddColor}
            onAddToken={handleAddToken}
            onAddPcTokens={addPcTokens}
            onCreateBlankMap={handleCreateBlankMap}
            selectedMap={selectedMap}
            selectedToken={selectedToken}
            onUpdateToken={(payload) => {
              if (payload.mapId) {
                updateMapMutation.mutate(payload);
              } else {
                updateTokenMutation.mutate(payload);
              }
            }}
            onDeleteToken={(tokenId) => deleteTokenMutation.mutate(tokenId)}
            mapIdForTokens={mapIdForTokens}
            addTokenPending={addTokenMutation.isPending}
            updateTokenPending={updateTokenMutation.isPending}
            deleteTokenPending={deleteTokenMutation.isPending}
            createMapPending={createMapMutation.isPending}
            mapsLoading={mapsLoading}
            tokensLoading={tokensLoading}
            uploadLoading={uploadLoading}
            onUploadMapBackground={onUploadSelectedMapBackground}
            onClearMapBackground={onClearSelectedMapBackground}
          />
        </div>
      ) : null}

      {!selectedMap && (mapsLoading || tokensLoading) ? (
        <div className="text-gray-500 text-sm">Loading…</div>
      ) : null}
    </div>
  );
}
