-- Napraw politykę "read leaderboard" aby działała dla niezalogowanych użytkowników (anon)
-- To jest kluczowe, bo strona główna z leaderboardem jest publiczna

DROP POLICY IF EXISTS "read leaderboard" ON public.players;

CREATE POLICY "read leaderboard" ON public.players
FOR SELECT 
TO anon, authenticated  -- Dodaj anon!
USING (true);

-- Sprawdzenie czy polityka działa:
-- SELECT * FROM public.players ORDER BY high_score DESC LIMIT 10;

