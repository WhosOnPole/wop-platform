import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, Users, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSearch } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { data: results = [], isLoading } = useSearch(query);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setIsOpen(value.length >= 2);
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setQuery('');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'driver':
        return <User className="w-4 h-4" />;
      case 'team':
        return <Users className="w-4 h-4" />;
      case 'track':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getResultPath = (type: string, id: string) => {
    switch (type) {
      case 'driver':
        return `/drivers/${id}`;
      case 'team':
        return `/teams/${id}`;
      case 'track':
        return `/tracks/${id}`;
      default:
        return '/';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search drivers, teams, tracks..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        />
      </div>

      {isOpen && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    to={getResultPath(result.type, result.id)}
                    onClick={handleResultClick}
                    className="block px-4 py-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{result.name}</p>
                          <Badge variant="outline" className="text-xs capitalize">
                            {result.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{result.country}</span>
                          {result.additional_info && (
                            <>
                              <span>•</span>
                              <span className="truncate">{result.additional_info}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-4 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Type at least 2 characters to search
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchBar;