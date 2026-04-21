import { useEffect, useMemo, useRef, useState } from "react";
import FormLabel from "./FormLabel";

export default function FileInput({
  id,
  name,
  label,
  required = false,
  accept,
  file,
  onFileChange,
  existingUrl,
  uploading = false,
  helpText,
}) {
  const inputRef = useRef(null);
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!file) {
      setObjectUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setObjectUrl(nextUrl);

    return () => {
      try {
        URL.revokeObjectURL(nextUrl);
      } catch (_) {}
    };
  }, [file]);

  const previewSrc = objectUrl || existingUrl || null;

  const previewNode = useMemo(() => {
    if (!previewSrc) {
      return (
        <div className="w-full h-full rounded-md bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 text-xs">
          No image
        </div>
      );
    }

    return (
      <img
        src={previewSrc}
        alt="Preview"
        className="w-full h-full rounded-md object-cover border border-gray-200"
      />
    );
  }, [previewSrc]);

  const titleNode = useMemo(() => {
    if (file) {
      return file.name;
    }

    if (existingUrl) {
      return (
        <a
          href={existingUrl}
          target="_blank"
          rel="noreferrer"
          className="text-orange-600 hover:underline"
        >
          Current file
        </a>
      );
    }

    return "No file selected";
  }, [file, existingUrl]);

  const subText = uploading ? "Uploading…" : helpText ? helpText : "PNG, JPG, SVG, etc.";

  const onPick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const onRemove = () => {
    if (typeof onFileChange === "function") {
      onFileChange(null);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div>
      <FormLabel label={label} required={required} htmlFor={id} />

      <div
        className="w-full bg-white border border-gray-300 rounded-lg p-3 shadow-sm hover:border-orange-300 transition-colors"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept={accept}
          required={required}
          className="hidden"
          onChange={(e) => {
            const nextFile = e.target.files?.[0] || null;
            if (typeof onFileChange === "function") {
              onFileChange(nextFile);
            }
          }}
        />

        <div className="flex items-center gap-3">
          <div
            className="self-stretch flex-shrink-0"
            style={{
              height: "100%",
              aspectRatio: "1 / 1",
              width: 82,
            }}
          >
            {previewNode}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {titleNode}
            </div>
            <div className="text-xs text-gray-500 mt-1">{subText}</div>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onPick}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 hover:border-orange-300 transition-colors focus:outline-none"
              >
                Choose file
              </button>

              {file ? (
                <button
                  type="button"
                  onClick={onRemove}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 hover:border-orange-300 transition-colors focus:outline-none"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
