import FormLabel from "./FormLabel";

const baseTextAreaClassName =
  "w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-medium focus:outline-none shadow-sm hover:border-orange-300 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";

export default function TextArea({
  id,
  name,
  label,
  required = false,
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  helpText,
  error,
  className = "",
}) {
  const hasKey = Boolean(id || name);
  const describedBy = !hasKey
    ? undefined
    : error
      ? `${id || name}-error`
      : helpText
        ? `${id || name}-help`
        : undefined;

  const inputClassName = `${baseTextAreaClassName} ${
    error ? "border-red-300 hover:border-red-400" : ""
  } ${className}`;

  return (
    <div>
      <FormLabel label={label} required={required} htmlFor={id} />
      <textarea
        id={id}
        name={name}
        className={inputClassName}
        style={{ fontFamily: "Poppins, sans-serif" }}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-describedby={describedBy}
      />
      {hasKey && error ? (
        <div id={`${id || name}-error`} className="text-xs text-red-600 mt-1">
          {error}
        </div>
      ) : hasKey && helpText ? (
        <div id={`${id || name}-help`} className="text-xs text-gray-500 mt-1">
          {helpText}
        </div>
      ) : !hasKey && helpText ? (
        <div className="text-xs text-gray-500 mt-1">{helpText}</div>
      ) : !hasKey && error ? (
        <div className="text-xs text-red-600 mt-1">{error}</div>
      ) : null}
    </div>
  );
}
