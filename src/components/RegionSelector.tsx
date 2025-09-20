import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface RegionSelectorProps {
  value?: string;
  onChange: (region: string) => void;
  className?: string;
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming", "District of Columbia"
];

const COUNTRIES = [
  "Argentina", "Australia", "Austria", "Bahrain", "Belgium", "Brazil", "Canada", "Chile", 
  "China", "Colombia", "Czech Republic", "Denmark", "Finland", "France", "Germany", 
  "Hungary", "India", "Italy", "Japan", "Malaysia", "Mexico", "Monaco", "Netherlands", 
  "New Zealand", "Norway", "Poland", "Portugal", "Russia", "Saudi Arabia", "Singapore", 
  "South Africa", "South Korea", "Spain", "Sweden", "Switzerland", "Thailand", "Turkey", 
  "United Arab Emirates", "United Kingdom"
];

export const RegionSelector: React.FC<RegionSelectorProps> = ({ value, onChange, className = "" }) => {
  const [selectedCategory, setSelectedCategory] = useState<"us" | "international">(
    US_STATES.includes(value || "") ? "us" : "international"
  );

  const handleCategoryChange = (category: "us" | "international") => {
    setSelectedCategory(category);
    // Clear current selection when switching categories
    onChange("");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Location</Label>
        <p className="text-xs text-muted-foreground">
          Select your region to compete with local fans
        </p>
      </div>

      {/* Category Selection */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleCategoryChange("us")}
          className={`px-3 py-2 text-sm rounded-xl transition-colors ${
            selectedCategory === "us" 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🇺🇸 United States
        </button>
        <button
          type="button"
          onClick={() => handleCategoryChange("international")}
          className={`px-3 py-2 text-sm rounded-xl transition-colors ${
            selectedCategory === "international" 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          🌍 International
        </button>
      </div>

      {/* Region Selection */}
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <SelectValue 
              placeholder={
                selectedCategory === "us" 
                  ? "Select your state..." 
                  : "Select your country..."
              } 
            />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-[300px] overflow-y-auto">
          {(selectedCategory === "us" ? US_STATES : COUNTRIES).map((region) => (
            <SelectItem key={region} value={region}>
              <div className="flex items-center gap-2">
                <span>{region}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value && (
        <Badge variant="secondary" className="w-fit">
          <MapPin className="h-3 w-3 mr-1" />
          {value}
        </Badge>
      )}
    </div>
  );
};