export default function CheckboxInput({
  checked,
  onChange,
  disabled = false,
  id,
  name,
  className = "",
  ...rest
}) {
  return (
    <input
      type="checkbox"
      id={id}
      name={name}
      checked={Boolean(checked)}
      disabled={disabled}
      onChange={onChange}
<<<<<<< ours
      className={`h-4 w-4 rounded border-gray-300 text-orange-600 accent-orange-600 focus:outline-none ${
=======
      className={`h-4 w-4 rounded border-gray-300 text-orange-600 accent-orange-600 ${
>>>>>>> theirs
        disabled ? "opacity-60" : ""
      } ${className}`}
      {...rest}
    />
  );
}
