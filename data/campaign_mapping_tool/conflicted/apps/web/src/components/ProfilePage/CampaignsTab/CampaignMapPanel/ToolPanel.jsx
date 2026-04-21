import { Sparkles, Plus, Upload, ImageOff } from "lucide-react";
import { TokenEditor } from "./TokenEditor";

export function ToolPanel({
  isOwner,
  addKind,
  setAddKind,
  addSize,
  setAddSize,
  addLabel,
  setAddLabel,
  addColor,
  setAddColor,
  onAddToken,
  onAddPcTokens,
  onCreateBlankMap,
  selectedMap,
  selectedToken,
  onUpdateToken,
  onDeleteToken,
  mapIdForTokens,
  addTokenPending,
  updateTokenPending,
  deleteTokenPending,
  createMapPending,
  mapsLoading,
  tokensLoading,
<<<<<<< ours
  onUploadMapBackground,
  onClearMapBackground,
  uploadLoading,
=======
  uploadLoading,
  onUploadMapBackground,
  onClearMapBackground,
>>>>>>> theirs
}) {
  const hasBackgroundImage = !!selectedMap?.background_url;

  return (
    <div className="bg-[#121212] border border-gray-700 rounded p-4 space-y-4">
      <div>
        <div className="text-white font-bold flex items-center gap-2">
          <Sparkles size={16} className="text-[#FFD700]" />
          Tools
        </div>
        <div className="text-gray-500 text-xs mt-1">
          DM can add tokens, everyone can move their own PC token.
        </div>
      </div>

      {isOwner && (
        <div className="space-y-2">
          <div className="text-gray-300 text-sm font-bold">Add map</div>
          <button
            onClick={onCreateBlankMap}
            disabled={createMapPending}
            className="w-full px-4 py-2 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add blank map
          </button>
        </div>
      )}

      {isOwner && (
        <div className="space-y-2">
          <div className="text-gray-300 text-sm font-bold">Add token</div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={addKind}
              onChange={(e) => setAddKind(e.target.value)}
              className="bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
            >
              <option value="monster">Monster</option>
              <option value="npc">NPC</option>
              <option value="custom">Custom</option>
              <option value="pc">PC</option>
            </select>
            <input
              type="number"
              value={addSize}
              onChange={(e) => setAddSize(Number(e.target.value) || 56)}
              className="bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
              min={24}
              max={180}
            />
          </div>
          <input
            value={addLabel}
            onChange={(e) => setAddLabel(e.target.value)}
            className="w-full bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
            placeholder="Label (e.g., Goblin)"
          />
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={addColor}
              onChange={(e) => setAddColor(e.target.value)}
              className="w-10 h-10 bg-transparent"
              title="Token color"
            />
            <button
              onClick={onAddToken}
              disabled={addTokenPending || !isOwner || !mapIdForTokens}
              className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          <button
            onClick={onAddPcTokens}
            disabled={!mapIdForTokens}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors font-bold disabled:opacity-50"
          >
            Add PC tokens for members
          </button>
<<<<<<< ours

=======
        </div>
      )}

      {isOwner && selectedMap && (
        <div className="border-t border-gray-700 pt-3 space-y-3">
          <div className="text-gray-300 text-sm font-bold">Map settings</div>

          <div>
            <label className="block text-gray-500 text-xs mb-1">Title</label>
            <input
              defaultValue={selectedMap.title}
              onBlur={(e) => {
                const next = String(e.target.value || "").trim();
                if (next && next !== selectedMap.title) {
                  onUpdateToken({ mapId: selectedMap.id, title: next });
                }
                e.target.value = next || selectedMap.title;
              }}
              className="w-full bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-500 text-xs mb-1">Order</label>
              <input
                type="number"
                defaultValue={String(selectedMap.sort_order ?? 0)}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n) || n < 0) {
                    e.target.value = String(selectedMap.sort_order ?? 0);
                    return;
                  }
                  onUpdateToken({
                    mapId: selectedMap.id,
                    sortOrder: Math.floor(n),
                  });
                }}
                className="w-full bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-xs mb-1">
                Background color
              </label>
              <input
                type="color"
                value={selectedMap.background_color || "#0b0b0b"}
                onChange={(e) =>
                  onUpdateToken({
                    mapId: selectedMap.id,
                    backgroundColor: e.target.value,
                  })
                }
                className="w-full h-10 bg-transparent"
                title="Used when no image is set"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors font-bold inline-flex items-center justify-center gap-2 cursor-pointer">
              <Upload size={16} />
              {uploadLoading ? "Uploading…" : "Background"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onUploadMapBackground?.(e.target.files?.[0])}
                disabled={uploadLoading || updateTokenPending}
              />
            </label>

            <button
              onClick={() => onClearMapBackground?.()}
              disabled={updateTokenPending}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
              title="Remove background"
            >
              <ImageOff size={16} />
              Clear
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                onUpdateToken({
                  mapId: selectedMap.id,
                  gridEnabled: !selectedMap.grid_enabled,
                })
              }
              className="px-3 py-2 rounded bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors text-sm font-bold"
            >
              Grid: {selectedMap.grid_enabled ? "ON" : "OFF"}
            </button>
            <input
              type="number"
              value={Number(selectedMap?.grid_size || 32)}
              onChange={(e) =>
                onUpdateToken({
                  mapId: selectedMap.id,
                  gridSize: Number(e.target.value) || 32,
                })
              }
              className="bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
              title="Grid size"
            />
            <input
              type="number"
              step="0.01"
              value={Number(selectedMap?.grid_opacity || 0.06)}
              onChange={(e) =>
                onUpdateToken({
                  mapId: selectedMap.id,
                  gridOpacity: Number(e.target.value) || 0.06,
                })
              }
              className="bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
              title="Grid opacity"
            />
            <input
              type="color"
              value={selectedMap?.grid_color || "#ffffff"}
              onChange={(e) =>
                onUpdateToken({
                  mapId: selectedMap.id,
                  gridColor: e.target.value,
                })
              }
              className="w-full h-10 bg-transparent"
              title="Grid color"
            />
          </div>

          <div className="text-gray-500 text-xs">
            Tip: order controls the map dropdown order. Lower comes first.
          </div>
>>>>>>> theirs
        </div>
      )}

      {selectedToken ? (
        <TokenEditor
          selectedToken={selectedToken}
          isOwner={isOwner}
          onUpdateToken={onUpdateToken}
          onDeleteToken={onDeleteToken}
          updateTokenPending={updateTokenPending}
          deleteTokenPending={deleteTokenPending}
        />
      ) : (
        <div className="border-t border-gray-700 pt-4 text-gray-500 text-sm">
          Click a token to edit conditions.
        </div>
      )}

      {isOwner && selectedMap && (
        <div className="border-t border-gray-700 pt-3 space-y-3">
          <div className="text-gray-300 text-sm font-bold">Map settings</div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() =>
                onUpdateToken({
                  mapId: selectedMap.id,
                  gridEnabled: !selectedMap.grid_enabled,
                })
              }
              className="px-3 py-2 rounded bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors text-sm font-bold"
            >
              Grid: {selectedMap.grid_enabled ? "ON" : "OFF"}
            </button>

            <input
              type="number"
              value={Number(selectedMap?.grid_size || 32)}
              onChange={(e) =>
                onUpdateToken({
                  mapId: selectedMap.id,
                  gridSize: Number(e.target.value) || 32,
                })
              }
              className="bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
              title="Grid size"
            />

            <input
              type="number"
              step="0.01"
              value={Number(selectedMap?.grid_opacity || 0.06)}
              onChange={(e) =>
                onUpdateToken({
                  mapId: selectedMap.id,
                  gridOpacity: Number(e.target.value) || 0.06,
                })
              }
              className="bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
              title="Grid opacity"
            />

            <input
              type="color"
              value={selectedMap?.grid_color || "#ffffff"}
              onChange={(e) =>
                onUpdateToken({
                  mapId: selectedMap.id,
                  gridColor: e.target.value,
                })
              }
              className="w-full h-10 bg-transparent"
              title="Grid color"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="text-gray-400 text-xs">Background</div>
              <input
                type="color"
                value={selectedMap?.background_color || "#111827"}
                onChange={(e) =>
                  onUpdateToken({
                    mapId: selectedMap.id,
                    backgroundColor: e.target.value,
                  })
                }
                className="w-10 h-10 bg-transparent"
                title="Background color"
              />
            </div>

            <label className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors font-bold inline-flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              {uploadLoading ? "Uploading…" : "Image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onUploadMapBackground?.(e.target.files?.[0])}
                disabled={uploadLoading || updateTokenPending}
              />
            </label>

            {hasBackgroundImage && (
              <button
                onClick={onClearMapBackground}
                disabled={updateTokenPending}
                className="px-3 py-2 rounded-lg bg-red-900/20 border border-red-900 text-red-300 hover:bg-red-900/30 transition-colors font-bold disabled:opacity-50 inline-flex items-center gap-2"
                title="Remove background image"
              >
                <ImageOff size={16} />
                Clear
              </button>
            )}
          </div>

          <div className="text-gray-500 text-xs">
            Tip: background color shows through wherever your image is
            transparent.
          </div>
        </div>
      )}

      {(mapsLoading || tokensLoading) && (
        <div className="text-gray-500 text-xs">Loading…</div>
      )}
    </div>
  );
}
