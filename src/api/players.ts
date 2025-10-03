import { supabase } from "@/lib/supabase";
import type { Player, LeaderboardRow } from "@/types";

export async function getMe(): Promise<Player> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData.user;
  if (!user) throw new Error("Brak zalogowanego użytkownika");

  const { data, error } = await supabase
    .from("players")
    .select("id, full_name, attempts, high_score, created_at")
    .eq("id", user.id)
    .single();

  if (error) {
    // Fallback: jeśli nie ma wiersza, spróbuj utworzyć (edge-case: trigger nie zadziałał)
    if (error.code === "PGRST116" || error.message?.toLowerCase().includes("no rows")) {
      const insert = await supabase
        .from("players")
        .insert({ id: user.id, full_name: user.user_metadata?.full_name ?? "" })
        .select("id, full_name, attempts, high_score, created_at")
        .single();
      if (insert.error) throw insert.error;
      return insert.data as Player;
    }
    throw error;
  }

  return data as Player;
}

export async function updateMyName(fullName: string): Promise<void> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const user = authData.user;
  if (!user) throw new Error("Brak zalogowanego użytkownika");

  const { error } = await supabase
    .from("players")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) throw error;
}

export async function incrementAttempts(): Promise<void> {
  const { error } = await supabase.rpc("increment_attempts");
  if (error) throw error;
}

export async function submitScore(newScore: number): Promise<void> {
  const { error } = await supabase.rpc("submit_score", { new_score: newScore });
  if (error) throw error;
}

export async function getLeaderboard(limit = 10): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from("players")
    .select("full_name, attempts, high_score")
    .order("high_score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as LeaderboardRow[];
}


