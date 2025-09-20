interface RegionBadgeProps {
  region: string | null;
  className?: string;
}

const REGION_FLAGS: Record<string, string> = {
  // Major regions
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  "Canada": "🇨🇦",
  "Australia": "🇦🇺",
  "Germany": "🇩🇪",
  "France": "🇫🇷",
  "Italy": "🇮🇹",
  "Spain": "🇪🇸",
  "Netherlands": "🇳🇱",
  "Belgium": "🇧🇪",
  "Austria": "🇦🇹",
  "Switzerland": "🇨🇭",
  "Japan": "🇯🇵",
  "Brazil": "🇧🇷",
  "Mexico": "🇲🇽",
  "Argentina": "🇦🇷",
  "India": "🇮🇳",
  "China": "🇨🇳",
  "South Korea": "🇰🇷",
  "Singapore": "🇸🇬",
  "Malaysia": "🇲🇾",
  "Thailand": "🇹🇭",
  "Monaco": "🇲🇨",
  "Finland": "🇫🇮",
  "Denmark": "🇩🇰",
  "Sweden": "🇸🇪",
  "Norway": "🇳🇴",
  "Poland": "🇵🇱",
  "Czech Republic": "🇨🇿",
  "Hungary": "🇭🇺",
  "Russia": "🇷🇺",
  "South Africa": "🇿🇦",
  "New Zealand": "🇳🇿",
  // Add more as needed
};

const getRegionFlag = (region: string): string => {
  return REGION_FLAGS[region] || "🌍";
};

export const RegionBadge: React.FC<RegionBadgeProps> = ({ region, className = "" }) => {
  if (!region) return null;

  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground ${className}`}
      title={region}
    >
      <span className="text-sm">{getRegionFlag(region)}</span>
      <span className="hidden sm:inline truncate max-w-[80px]">{region}</span>
    </span>
  );
};