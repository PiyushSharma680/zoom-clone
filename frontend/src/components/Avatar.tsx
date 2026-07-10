interface AvatarProps {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}

/** Circular avatar showing the user's initials on a colored background. */
export default function Avatar({
  name,
  color = "#2D8CFF",
  size = 36,
  className = "",
}: AvatarProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || "")
    .join("");

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold text-white select-none ${className}`}
      style={{
        backgroundColor: color,
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {initials || "?"}
    </div>
  );
}
