-- Create an example poll
INSERT INTO public.polls (title, type, status) 
VALUES ('Who will win the next Grand Prix?', 'single', 'live');

-- Get the poll ID for the options (using a variable approach)
DO $$
DECLARE
    poll_uuid UUID;
BEGIN
    -- Get the ID of the poll we just created
    SELECT id INTO poll_uuid FROM public.polls WHERE title = 'Who will win the next Grand Prix?' LIMIT 1;
    
    -- Insert poll options
    INSERT INTO public.poll_options (poll_id, label, metadata) VALUES
    (poll_uuid, 'Max Verstappen', '{"driver_number": 1, "team": "Red Bull Racing"}'),
    (poll_uuid, 'Lewis Hamilton', '{"driver_number": 44, "team": "Mercedes"}'),
    (poll_uuid, 'Charles Leclerc', '{"driver_number": 16, "team": "Ferrari"}'),
    (poll_uuid, 'Lando Norris', '{"driver_number": 4, "team": "McLaren"}'),
    (poll_uuid, 'George Russell', '{"driver_number": 63, "team": "Mercedes"}');
END $$;