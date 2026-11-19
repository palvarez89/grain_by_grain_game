import React from 'react';

export const TitleEmblem: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
    {/* Warm coastal sun disc */}
    <circle cx="44" cy="18" r="10" fill="#F59E0B" opacity="0.9" />
    {/* Gentle turquoise wave */}
    <path
      d="M6 44C14 38 22 48 32 42C42 36 50 45 58 40V54C58 56.2 56.2 58 54 58H10C7.8 58 6 56.2 6 54V44Z"
      fill="#0D9488"
    />
    {/* Swept golden sand crest */}
    <path
      d="M6 48C16 42 25 51 36 45C46 40 52 47 58 44V54C58 56.2 56.2 58 54 58H10C7.8 58 6 56.2 6 54V48Z"
      fill="#F4C97A"
    />
    {/* Iconic Toothbrush angled across */}
    <g transform="rotate(-32 32 30)">
      {/* Handle */}
      <rect x="10" y="25" width="40" height="7" rx="3.5" fill="#F43F5E" />
      <rect x="14" y="27" width="16" height="2.5" rx="1.25" fill="#FDA4AF" />
      {/* Bristles */}
      <rect x="38" y="18" width="11" height="7" rx="1.5" fill="#FFF1F2" />
      <line x1="40.5" y1="18" x2="40.5" y2="25" stroke="#FECDD3" strokeWidth="1.2" />
      <line x1="43.5" y1="18" x2="43.5" y2="25" stroke="#FECDD3" strokeWidth="1.2" />
      <line x1="46.5" y1="18" x2="46.5" y2="25" stroke="#FECDD3" strokeWidth="1.2" />
    </g>
    {/* Flying sand grains */}
    <circle cx="22" cy="39" r="1.6" fill="#FDE68A" />
    <circle cx="17" cy="42" r="1.2" fill="#FCD34D" />
    <circle cx="27" cy="43" r="1.4" fill="#FDE68A" />
  </svg>
);

export const ToolSvgIcon: React.FC<{ toolId: string; className?: string }> = ({
  toolId,
  className = 'w-8 h-8',
}) => {
  switch (toolId) {
    case 'toothbrush':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <g transform="rotate(-35 20 20)">
            <rect x="4" y="19" width="32" height="5" rx="2.5" fill="#F43F5E" />
            <rect x="7" y="20.5" width="12" height="1.8" rx="0.9" fill="#FDA4AF" />
            <rect x="26" y="13.5" width="9" height="5.5" rx="1" fill="#FFF1F2" />
            <path d="M28.5 13.5V19M31 13.5V19M33.5 13.5V19" stroke="#FECDD3" strokeWidth="1" />
          </g>
        </svg>
      );
    case 'whisk_broom':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <g transform="rotate(-25 20 20)">
            <rect x="17.5" y="4" width="5" height="11" rx="2" fill="#92400E" />
            <path d="M16 15H24L28 34H12L16 15Z" fill="#F59E0B" />
            <path d="M16 17H24" stroke="#DC2626" strokeWidth="2.5" />
            <path d="M16 34L18 20M20 34V20M24 34L22 20" stroke="#B45309" strokeWidth="1.2" />
          </g>
        </svg>
      );
    case 'push_broom':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <line x1="20" y1="4" x2="20" y2="24" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" />
          <rect x="7" y="23" width="26" height="4.5" rx="1.5" fill="#0D9488" />
          <rect x="8" y="27.5" width="24" height="6.5" rx="1" fill="#FDE68A" />
          <path d="M12 27.5V34M16 27.5V34M20 27.5V34M24 27.5V34M28 27.5V34" stroke="#D97706" strokeWidth="1" />
        </svg>
      );
    case 'sand_scoop':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <g transform="rotate(-30 20 20)">
            <rect x="18" y="4" width="4" height="15" rx="1.5" fill="#94A3B8" />
            <rect x="15" y="3" width="10" height="3" rx="1.5" fill="#0F172A" />
            <path d="M11 19H29L27 34C27 35.5 25.5 36.5 24 36.5H16C14.5 36.5 13 35.5 13 34L11 19Z" fill="#CBD5E1" />
            <path d="M15 22H25" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        </svg>
      );
    case 'leaf_blower':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <rect x="7" y="14" width="14" height="11" rx="3" fill="#EA580C" />
          <rect x="21" y="17" width="13" height="5" rx="1.5" fill="#334155" />
          <path d="M11 14V11H17V14" stroke="#1E293B" strokeWidth="2.2" />
          <path d="M35 16L38 14M35 19.5H39M35 23L38 25" stroke="#BAE6FD" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'street_sweeper':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <rect x="8" y="16" width="24" height="10" rx="2.5" fill="#EAB308" />
          <circle cx="13" cy="28" r="5" fill="#FDE68A" stroke="#B45309" strokeWidth="2" />
          <circle cx="27" cy="28" r="5" fill="#FDE68A" stroke="#B45309" strokeWidth="2" />
          <rect x="14" y="11" width="12" height="5" rx="1.5" fill="#334155" />
        </svg>
      );
    case 'sand_dozer':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <rect x="6" y="24" width="20" height="7" rx="3.5" fill="#1E293B" />
          <rect x="9" y="15" width="14" height="9" rx="2" fill="#F59E0B" />
          <rect x="12" y="10" width="8" height="5" rx="1" fill="#38BDF8" />
          <path d="M28 17C32 17 34 21 34 29H27V17H28Z" fill="#CBD5E1" />
        </svg>
      );
    case 'solar_vacuum':
      return (
        <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
          <circle cx="20" cy="20" r="13" fill="#0284C7" />
          <circle cx="20" cy="20" r="8" fill="#0F172A" />
          <path d="M20 12C24 12 27 16 25 20C23 24 17 24 15 20" stroke="#7DD3FC" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="20" cy="20" r="2.5" fill="#FACC15" />
        </svg>
      );
    default:
      return null;
  }
};

export const HelperSvgIcon: React.FC<{ helperId: string; className?: string }> = ({
  helperId,
  className = 'w-7 h-7',
}) => {
  switch (helperId) {
    case 'crab':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <ellipse cx="18" cy="21" rx="9" ry="7" fill="#EF4444" />
          <circle cx="14" cy="13" r="2" fill="#1E293B" />
          <circle cx="22" cy="13" r="2" fill="#1E293B" />
          <path d="M9 19L4 15M9 22L4 23M27 19L32 15M27 22L32 23" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="7" cy="11" r="3" fill="#F97316" />
          <circle cx="29" cy="11" r="3" fill="#F97316" />
        </svg>
      );
    case 'beachcomber':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <circle cx="18" cy="14" r="6" fill="#FDBA74" />
          <path d="M9 12C11 7 25 7 27 12H9Z" fill="#FACC15" />
          <ellipse cx="18" cy="12" rx="11" ry="2.2" fill="#EAB308" />
          <path d="M11 29C11 24 25 24 25 29" fill="#0EA5E9" />
        </svg>
      );
    case 'sandbot':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <rect x="8" y="13" width="20" height="14" rx="4" fill="#0F766E" />
          <rect x="11" y="16" width="14" height="5" rx="2" fill="#99F6E4" />
          <circle cx="14.5" cy="18.5" r="1.5" fill="#0F172A" />
          <circle cx="21.5" cy="18.5" r="1.5" fill="#0F172A" />
          <rect x="6" y="25" width="24" height="4" rx="2" fill="#1E293B" />
        </svg>
      );
    case 'drone':
      return (
        <svg viewBox="0 0 36 36" fill="none" className={className} aria-hidden="true">
          <rect x="12" y="14" width="12" height="8" rx="3" fill="#38BDF8" />
          <line x1="7" y1="12" x2="29" y2="24" stroke="#64748B" strokeWidth="2" />
          <line x1="29" y1="12" x2="7" y2="24" stroke="#64748B" strokeWidth="2" />
          <circle cx="7" cy="12" r="4" stroke="#BAE6FD" strokeWidth="1.8" />
          <circle cx="29" cy="12" r="4" stroke="#BAE6FD" strokeWidth="1.8" />
          <circle cx="7" cy="24" r="4" stroke="#BAE6FD" strokeWidth="1.8" />
          <circle cx="29" cy="24" r="4" stroke="#BAE6FD" strokeWidth="1.8" />
        </svg>
      );
    default:
      return null;
  }
};
