export default function RadioInput({
  checked,
  onChange,
  disabled = false,
  id,
  name,
  value,
  className = "",
  ...rest
}) {
  return (
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={Boolean(checked)}
      disabled={disabled}
      onChange={onChange}
      className={`h-4 w-4 border-gray-300 text-orange-600 accent-orange-600 focus:outline-none ${
        disabled ? "opacity-60" : ""
      } ${className}`}
      {...rest}
    />
  );
}
