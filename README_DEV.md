# Architektura: ZipZap + Supabase (Auth, RLS, RPC)

## ER diagram (tekstowy)

- auth.users (Supabase) 1:1 public.players
- Klucz: `players.id` = `auth.users.id`

```
[auth.users] 1 ── 1 [public.players]
    id ───────────▶ id (PK)
                     full_name
                     attempts
                     high_score
                     created_at
```

## RLS

- Tabela `public.players` ma RLS włączone.
- Polityki `own row` ograniczają SELECT/INSERT/UPDATE do wiersza, gdzie `auth.uid() = id`.
- (Opcjonalnie) "read leaderboard": pozwala zalogowanym czytać wszystkich (`using (true)`).

## Triggery

- `on_auth_user_created` (AFTER INSERT na `auth.users`) uruchamia funkcję `public.handle_new_user()` i tworzy wiersz w `players` z `id = new.id` oraz `full_name` z `raw_user_meta_data.full_name`.

## RPC

- `increment_attempts()` – zwiększa `attempts` o 1 dla zalogowanego użytkownika.
- `submit_score(new_score int)` – ustawia `high_score = greatest(high_score, new_score)`.

## Klient Supabase

```ts
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
```

## API klienckie (SPA)

- Auth: `signUp(email, password, fullName)`, `signIn(email, password)`, `signOut()`, `getUser()`.
- Players: `getMe()`, `updateMyName(fullName)`, `incrementAttempts()`, `submitScore(newScore)`, `getLeaderboard(limit)`.
- Funkcje rzucają wyjątek przy `error` i zwracają `data`.

## Edge cases

- Brak zalogowanego użytkownika → wyjątek, UI pokazuje komunikat.
- Brak wiersza w `players` (trigger nie zadziałał) → jednorazowy `insert` w `getMe()`.
- `submit_score` nie zaniża wyniku (używa `greatest`).

## Przykłady zapytań

```ts
// Rejestracja i logowanie
await supabase.auth.signUp({
  email,
  password,
  options: { data: { full_name } },
});
await supabase.auth.signInWithPassword({ email, password });

// Dane gracza
const user = (await supabase.auth.getUser()).data.user;
const me = await supabase
  .from("players")
  .select("full_name, attempts, high_score, created_at")
  .eq("id", user!.id)
  .single();

// RPC
await supabase.rpc("increment_attempts");
await supabase.rpc("submit_score", { new_score: 123 });

// Leaderboard
const lb = await supabase
  .from("players")
  .select("full_name, attempts, high_score")
  .order("high_score", { ascending: false })
  .limit(10);
```

## Zmienne środowiskowe

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
