import { Upload, Sparkles } from "lucide-react";

export function CreateMapForm({
  createTitle,
  setCreateTitle,
  createGridEnabled,
  setCreateGridEnabled,
  createGridSize,
  setCreateGridSize,
  createGridOpacity,
  setCreateGridOpacity,
  createGridColor,
  setCreateGridColor,
<<<<<<< ours
  createBackgroundColor,
  setCreateBackgroundColor,
=======
  createBackgroundColor,
  setCreateBackgroundColor,
  createSortOrder,
  setCreateSortOrder,
  createSetDefault,
  setCreateSetDefault,
>>>>>>> theirs
  onUploadBackground,
  onCreateBlankMap,
  uploadLoading,
  createMapPending,
}) {
  return (
    <div className="bg-[#121212] border border-gray-700 rounded p-6 space-y-4">
      <div>
        <div className="text-white font-bold">Create your first map</div>
        <div className="text-gray-400 text-sm mt-1">
          You can add multiple maps per campaign.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-gray-400 text-xs mb-1">Map title</label>
          <input
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            className="w-full bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
            placeholder="Main Map"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">
            Make active
          </label>
          <button
            onClick={() => setCreateSetDefault((v) => !v)}
            type="button"
            className={`w-full px-3 py-2 rounded border font-bold transition-colors ${
              createSetDefault
                ? "bg-purple-900/20 border-purple-500/40 text-purple-200"
                : "bg-[#1E1E1E] border-gray-700 text-gray-300 hover:border-gray-600"
            }`}
            title="If ON, this map becomes the default/active map"
          >
            {createSetDefault ? "ON" : "OFF"}
          </button>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Map order</label>
          <input
            type="number"
            value={createSortOrder}
            onChange={(e) => setCreateSortOrder(Number(e.target.value) || 0)}
            className="w-full bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
            min={0}
            max={100000}
          />
          <div className="text-gray-500 text-xs mt-1">
            Lower numbers show first.
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Grid</label>
          <button
            onClick={() => setCreateGridEnabled((v) => !v)}
            type="button"
            className={`w-full px-3 py-2 rounded border font-bold transition-colors ${
              createGridEnabled
                ? "bg-purple-900/20 border-purple-500/40 text-purple-200"
                : "bg-[#1E1E1E] border-gray-700 text-gray-300 hover:border-gray-600"
            }`}
          >
            {createGridEnabled ? "ON" : "OFF"}
          </button>
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">Grid size</label>
          <input
            type="number"
            value={createGridSize}
            onChange={(e) => setCreateGridSize(Number(e.target.value) || 32)}
            className="w-full bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
            min={8}
            max={200}
          />
        </div>

        <div>
          <label className="block text-gray-400 text-xs mb-1">
            Grid opacity
          </label>
          <input
            type="number"
            step="0.01"
            value={createGridOpacity}
            onChange={(e) =>
              setCreateGridOpacity(Number(e.target.value) || 0.06)
            }
            className="w-full bg-[#1E1E1E] border border-gray-700 text-white px-3 py-2 rounded"
            min={0}
            max={0.5}
          />
        </div>

<<<<<<< ours
        <div className="md:col-span-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-gray-400 text-xs">Map background</div>
            <input
              type="color"
              value={createBackgroundColor}
              onChange={(e) => setCreateBackgroundColor(e.target.value)}
              className="w-10 h-10 bg-transparent"
              title="Map background color"
            />
          </div>
          <div className="text-gray-500 text-xs">
            Used when you don’t upload an image.
          </div>
        </div>

        <div className="md:col-span-2 flex items-center gap-3">
          <div className="text-gray-400 text-xs">Grid color</div>
          <input
            type="color"
            value={createGridColor}
            onChange={(e) => setCreateGridColor(e.target.value)}
            className="w-10 h-10 bg-transparent"
          />
=======
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
          <div className="flex items-center gap-3">
            <div className="text-gray-400 text-xs">Grid color</div>
            <input
              type="color"
              value={createGridColor}
              onChange={(e) => setCreateGridColor(e.target.value)}
              className="w-10 h-10 bg-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-gray-400 text-xs">Background</div>
            <input
              type="color"
              value={createBackgroundColor}
              onChange={(e) => setCreateBackgroundColor(e.target.value)}
              className="w-10 h-10 bg-transparent"
              title="Blank map background color"
            />
            <div className="text-gray-500 text-xs">
              Used when no image is set.
            </div>
          </div>
>>>>>>> theirs
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 items-start">
        <label className="px-4 py-2 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors inline-flex items-center gap-2 cursor-pointer">
          <Upload size={16} />
          {uploadLoading ? "Uploading…" : "Upload background"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onUploadBackground(e.target.files?.[0])}
            disabled={createMapPending || uploadLoading}
          />
        </label>

        <button
          onClick={onCreateBlankMap}
          disabled={createMapPending}
          className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10 transition-colors font-bold inline-flex items-center gap-2"
        >
          <Sparkles size={16} />
          Create blank map
        </button>
      </div>
    </div>
  );
}
