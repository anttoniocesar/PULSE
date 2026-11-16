type PulseLogoProps = {
  variant?: "light" | "dark";
  compact?: boolean;
};

export default function PulseLogo({
  variant = "light",
  compact = false,
}: PulseLogoProps) {
  return (
    <div
      className={`pulse-logo pulse-logo--${variant}${compact ? " pulse-logo--compact" : ""}`}
      aria-label="PULSE — Performance & Transformation"
      role="img"
    >
      <svg
        className="pulse-logo__mark"
        viewBox="0 0 42 42"
        fill="none"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="40" height="40" rx="12" />
        <path d="M7 22h7l4-9 7 18 5-12 3 3h3" />
      </svg>
      <span className="pulse-logo__wording">
        <span className="pulse-logo__name">PULSE</span>
        {!compact && (
          <span className="pulse-logo__tagline">PERFORMANCE &amp; TRANSFORMATION</span>
        )}
      </span>
    </div>
  );
}
