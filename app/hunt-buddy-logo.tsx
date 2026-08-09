type HuntBuddyLogoProps = {
  size?: number;
  className?: string;
};

export default function HuntBuddyLogo({ size = 40, className }: HuntBuddyLogoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <rect width="100" height="100" rx="22" fill="#2563eb" />
      <circle cx="59" cy="37" r="21" stroke="white" strokeWidth="2.4" fill="none" />
      <circle cx="59" cy="37" r="11.5" stroke="white" strokeWidth="2" fill="none" opacity="0.65" />
      <circle cx="59" cy="37" r="4.5" fill="white" />
      <line x1="20" y1="77" x2="38.5" y2="60" stroke="white" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M 46,52 L 43,67 L 38,60 L 31,54 Z" fill="white" />
    </svg>
  );
}
