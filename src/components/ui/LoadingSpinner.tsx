export default function LoadingSpinner() {
  return (
    <svg className="loading-spinner" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {Array.from({ length: 8 }, (_, index) => (
        <circle
          key={index}
          cx="24"
          cy="24"
          r="19"
          stroke="currentColor"
          strokeWidth="5"
          strokeDasharray="12.6 106.8"
          opacity={0.2 + index * 0.1}
          transform={`rotate(${index * 45 - 90} 24 24)`}
        />
      ))}
    </svg>
  );
}
