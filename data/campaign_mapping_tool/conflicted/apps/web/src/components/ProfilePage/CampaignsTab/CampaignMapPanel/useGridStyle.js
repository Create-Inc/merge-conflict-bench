import { useMemo } from "react";

export function useGridStyle(selectedMap) {
  return useMemo(() => {
    if (!selectedMap) return {};

<<<<<<< ours
    const backgroundColor = selectedMap?.background_color || "#111827";

=======
    const bgColor = selectedMap?.background_color || "#0b0b0b";

>>>>>>> theirs
    const mapBgStyle = selectedMap?.background_url
      ? {
          backgroundImage: `url(${selectedMap.background_url})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
<<<<<<< ours
          backgroundColor,
=======
          backgroundColor: bgColor,
>>>>>>> theirs
        }
<<<<<<< ours
      : { backgroundColor };
=======
      : { backgroundColor: bgColor };
>>>>>>> theirs

    const gridSize = Number(selectedMap?.grid_size || 32);
    const gridOpacity = Number(selectedMap?.grid_opacity || 0.06);
    const gridColor = selectedMap?.grid_color || "#ffffff";

    const gridRgba = (() => {
      // convert #RRGGBB -> rgba
      const hex = String(gridColor || "#ffffff").replace("#", "");
      if (hex.length !== 6) return `rgba(255,255,255,${gridOpacity})`;
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${gridOpacity})`;
    })();

    const gridStyle = selectedMap?.grid_enabled
      ? {
          backgroundImage: selectedMap?.background_url
            ? `linear-gradient(${gridRgba} 1px, transparent 1px), linear-gradient(90deg, ${gridRgba} 1px, transparent 1px), url(${selectedMap.background_url})`
            : `linear-gradient(${gridRgba} 1px, transparent 1px), linear-gradient(90deg, ${gridRgba} 1px, transparent 1px)`,
          backgroundSize: selectedMap?.background_url
            ? `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, cover`
            : `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px`,
          backgroundPosition: selectedMap?.background_url
            ? "0 0, 0 0, center"
            : "0 0, 0 0",
<<<<<<< ours
          backgroundColor,
=======
          backgroundColor: bgColor,
>>>>>>> theirs
        }
      : mapBgStyle;

    return gridStyle;
  }, [selectedMap]);
}
