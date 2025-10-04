import { useEffect, useState } from "react";
import { getLeaderboard } from "@/api/players";
import type { LeaderboardRow } from "@/types";

type LeaderboardProps = {
  limit?: number;
  className?: string;
};

const Leaderboard = ({ limit = 10, className = "" }: LeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Pobieranie leaderboard...");
        const data = await getLeaderboard(limit);
        console.log("Dane leaderboard:", data);
        setLeaderboard(data);
      } catch (e: any) {
        console.error("Błąd pobierania leaderboard:", e);
        console.error("Szczegóły błędu:", e.message, e.code);
        setError(e.message || "Nie można załadować rankingu");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limit]);

  if (loading) {
    return (
      <div className={className}>
        <div className="text-center text-white">Ładowanie...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-2">Błąd ładowania</p>
          <p className="text-sm text-white">{error}</p>
        </div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className={className}>
        <div className="text-center text-white">
          Brak wyników. Bądź pierwszym graczem!
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-white leading-[normal] mb-4">Record Game:</div>
      <ul className="space-y-2 flex flex-col max-h-[13rem] overflow-y-scroll">
        {leaderboard.map((player, index) => (
          <li key={index} className="flex justify-between gap-4 text-white">
            <span className="text-white">{new Date().toLocaleDateString()}</span>
            <span className="font-bold">{player.high_score}</span>
            <span className="truncate">{player.full_name || "Anonim"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;

