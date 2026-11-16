export default function PulseWave() {
  return (
    <svg
      className="pulse-wave"
      viewBox="0 0 660 182"
      fill="none"
      role="img"
      aria-label="Representação visual de uma linha de pulso"
      preserveAspectRatio="none"
    >
      <path className="pulse-wave__guide" d="M0 128H660" />
      <path
        className="pulse-wave__line"
        d="M0 128H102L134 128L164 47L207 160L247 82L282 120L335 120L378 93L430 110L479 60L526 77L572 33L620 48L660 9"
      />
      <circle className="pulse-wave__endpoint" cx="660" cy="9" r="5" />
    </svg>
  );
}
