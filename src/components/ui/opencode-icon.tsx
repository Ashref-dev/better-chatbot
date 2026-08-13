export function OpenCodeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 240 300"
    >
      <path
        d="M180 60H60V240H180V60ZM240 300H0V0H240V300Z"
        fill="#f1ecec"
        fillRule="nonzero"
      />
      <rect x="60" y="120" width="120" height="120" fill="#4b4646" />
    </svg>
  );
}
