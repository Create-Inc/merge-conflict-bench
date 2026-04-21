<<<<<<< ours
import { useCallback, useMemo } from "react";
import { Target, ZoomIn, ZoomOut, RefreshCcw } from "lucide-react";
=======
import { Target, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
>>>>>>> theirs
import { Token } from "./Token";
import { clamp } from "./utils";

export function MapCanvas({
  selectedMap,
  tokens,
  selectedTokenId,
  zoom,
  setZoom,
  onSelect,
  onPointerDown,
  mapViewportRef,
  gridStyle,
  canDragToken,
}) {
<<<<<<< ours
  const zoomPercent = useMemo(() => Math.round(zoom * 100), [zoom]);

  const zoomOut = useCallback(() => {
    setZoom((z) => clamp(Number((z - 0.1).toFixed(2)), 0.5, 2.5));
  }, [setZoom]);

  const zoomIn = useCallback(() => {
    setZoom((z) => clamp(Number((z + 0.1).toFixed(2)), 0.5, 2.5));
  }, [setZoom]);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, [setZoom]);

=======
  const onWheel = (e) => {
    // ctrl/cmd+wheel is typically browser zoom; don't fight it
    if (e.ctrlKey || e.metaKey) return;

    e.preventDefault();
    const delta = e.deltaY;
    const nextStep = delta > 0 ? -0.08 : 0.08;
    setZoom((z) => clamp(Number((z + nextStep).toFixed(2)), 0.5, 2.5));
  };

>>>>>>> theirs
  return (
    <div className="lg:col-span-2 bg-[#121212] border border-gray-700 rounded overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <div className="text-white font-bold inline-flex items-center gap-2">
          <Target size={16} className="text-purple-300" />
          {selectedMap.title}
        </div>

        <div className="flex items-center gap-2">
          <button
<<<<<<< ours
            onClick={zoomOut}
=======
            onClick={() => setZoom(1)}
            className="p-2 rounded bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
            title="Reset zoom"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() =>
              setZoom((z) => clamp(Number((z - 0.1).toFixed(2)), 0.5, 2.5))
            }
>>>>>>> theirs
            className="p-2 rounded bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <div className="text-gray-400 text-xs w-[56px] text-center">
            {zoomPercent}%
          </div>
          <button
            onClick={zoomIn}
            className="p-2 rounded bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={resetZoom}
            className="p-2 rounded bg-white/5 border border-white/10 text-gray-200 hover:bg-white/10"
            title="Reset zoom"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>

      <div
        ref={mapViewportRef}
<<<<<<< ours
        className="relative w-full select-none overflow-hidden"
        style={{ height: "calc(100vh - 320px)", minHeight: 520 }}
=======
        className="relative w-full h-[70vh] min-h-[520px] max-h-[860px] select-none overflow-hidden"
>>>>>>> theirs
        onClick={() => onSelect(null)}
<<<<<<< ours
        onDoubleClick={resetZoom}
        onWheel={(e) => {
          // Natural zoom: wheel up zooms in, wheel down zooms out.
          // Use ctrlKey trackpad zoom too.
          e.preventDefault();
          const direction = e.deltaY > 0 ? -1 : 1;
          const step = e.ctrlKey ? 0.06 : 0.1;
          setZoom((z) =>
            clamp(Number((z + direction * step).toFixed(2)), 0.5, 2.5),
          );
        }}
=======
        onWheel={onWheel}
>>>>>>> theirs
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            ...gridStyle,
          }}
        >
          {tokens.map((t) => {
            const canDrag = canDragToken ? canDragToken(t) : true;
            return (
              <Token
                key={t.id}
                token={t}
                selected={String(t.id) === String(selectedTokenId)}
                onSelect={onSelect}
                onPointerDown={onPointerDown}
                canDrag={canDrag}
              />
            );
          })}
        </div>
      </div>

      <div className="px-3 py-2 border-t border-gray-700 text-gray-500 text-xs">
        Tip: mouse wheel zooms. Double-click resets.
      </div>
    </div>
  );
}
