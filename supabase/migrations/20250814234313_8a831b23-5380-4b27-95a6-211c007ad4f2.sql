-- Close the example poll
UPDATE public.polls 
SET status = 'closed' 
WHERE title = 'Who will win the next Grand Prix?';