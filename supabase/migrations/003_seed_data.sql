-- Seed initial entities data
INSERT INTO entities (id, type, name, bio, series, facts) VALUES
  -- Drivers
  ('550e8400-e29b-41d4-a716-446655440001', 'driver', 'Lewis Hamilton', 'Seven-time Formula 1 World Champion', 'Formula 1', '{"championships": 7, "wins": 103, "poles": 104}'),
  ('550e8400-e29b-41d4-a716-446655440002', 'driver', 'Max Verstappen', 'Current Formula 1 World Champion', 'Formula 1', '{"championships": 3, "wins": 54, "poles": 34}'),
  ('550e8400-e29b-41d4-a716-446655440003', 'driver', 'Charles Leclerc', 'Ferrari driver and Monaco native', 'Formula 1', '{"wins": 5, "poles": 23, "podiums": 30}'),
  ('550e8400-e29b-41d4-a716-446655440004', 'driver', 'Lando Norris', 'McLaren driver and rising star', 'Formula 1', '{"podiums": 13, "fastest_laps": 6}'),
  ('550e8400-e29b-41d4-a716-446655440005', 'driver', 'George Russell', 'Mercedes driver and former Williams racer', 'Formula 1', '{"podiums": 10, "poles": 1}'),
  
  -- Teams
  ('550e8400-e29b-41d4-a716-446655440011', 'team', 'Mercedes', 'German Formula 1 team', 'Formula 1', '{"championships": 8, "wins": 125, "founded": 2010}'),
  ('550e8400-e29b-41d4-a716-446655440012', 'team', 'Red Bull Racing', 'Austrian Formula 1 team', 'Formula 1', '{"championships": 6, "wins": 95, "founded": 2005}'),
  ('550e8400-e29b-41d4-a716-446655440013', 'team', 'Ferrari', 'Italian Formula 1 team', 'Formula 1', '{"championships": 16, "wins": 243, "founded": 1950}'),
  ('550e8400-e29b-41d4-a716-446655440014', 'team', 'McLaren', 'British Formula 1 team', 'Formula 1', '{"championships": 8, "wins": 183, "founded": 1966}'),
  ('550e8400-e29b-41d4-a716-446655440015', 'team', 'Aston Martin', 'British Formula 1 team', 'Formula 1', '{"wins": 0, "founded": 2021}'),
  
  -- Tracks
  ('550e8400-e29b-41d4-a716-446655440021', 'track', 'Silverstone', 'Historic British Grand Prix circuit', 'Formula 1', '{"length_km": 5.891, "turns": 18, "first_race": 1950}'),
  ('550e8400-e29b-41d4-a716-446655440022', 'track', 'Monaco', 'Famous street circuit in Monte Carlo', 'Formula 1', '{"length_km": 3.337, "turns": 19, "first_race": 1950}'),
  ('550e8400-e29b-41d4-a716-446655440023', 'track', 'Spa-Francorchamps', 'Challenging Belgian circuit', 'Formula 1', '{"length_km": 7.004, "turns": 20, "first_race": 1950}'),
  ('550e8400-e29b-41d4-a716-446655440024', 'track', 'Monza', 'Fast Italian circuit', 'Formula 1', '{"length_km": 5.793, "turns": 11, "first_race": 1950}'),
  ('550e8400-e29b-41d4-a716-446655440025', 'track', 'Suzuka', 'Technical Japanese circuit', 'Formula 1', '{"length_km": 5.807, "turns": 18, "first_race": 1987}')
ON CONFLICT (id) DO NOTHING;
