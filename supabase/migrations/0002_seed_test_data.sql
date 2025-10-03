-- Dodanie testowych danych do tabeli players
-- UWAGA: Ten skrypt można uruchomić tylko jeśli masz rzeczywistych użytkowników w auth.users
-- lub możesz go użyć jako szablon

-- Przykładowe INSERT dla testowych danych (wymaga istniejących UUID z auth.users)
-- Zamień poniższe UUID na prawdziwe z twojej tabeli auth.users

-- OPCJA 1: Jeśli masz użytkowników w auth.users, znajdź ich ID:
-- SELECT id, email FROM auth.users;

-- Następnie użyj ich ID tutaj:
-- INSERT INTO public.players (id, full_name, attempts, high_score)
-- VALUES 
--   ('uuid-z-auth-users-1', 'Jan Kowalski', 15, 250),
--   ('uuid-z-auth-users-2', 'Anna Nowak', 8, 180);

-- OPCJA 2: Tymczasowe dane testowe (jeśli trigger jest wyłączony)
-- Uwaga: Te UUID muszą najpierw istnieć w auth.users!

-- Przykład tworzenia fałszywych użytkowników dla testów (NIE POLECANE dla produkcji):
-- Zamiast tego lepiej zarejestrować prawdziwych użytkowników przez aplikację

-- OPCJA 3: Prosty skrypt do dodania danych dla istniejących użytkowników
-- Najpierw sprawdź jakich użytkowników masz:
SELECT id, email, raw_user_meta_data->>'full_name' as full_name 
FROM auth.users 
LIMIT 10;

-- Jeśli masz użytkowników ale brak ich w players (bo trigger nie zadziałał):
INSERT INTO public.players (id, full_name, attempts, high_score)
SELECT 
  u.id, 
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name,
  0 as attempts,
  0 as high_score
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.players p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Jeśli chcesz zaktualizować istniejące dane testowe:
-- UPDATE public.players 
-- SET attempts = 10, high_score = 150 
-- WHERE id = 'twoje-user-id';

