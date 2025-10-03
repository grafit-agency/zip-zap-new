import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeaderboard } from "@/api/players";
import type { LeaderboardRow } from "@/types";
import { Trophy, Medal, Award } from "lucide-react";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Pobieranie leaderboard...");
        const data = await getLeaderboard(10);
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
  }, []);

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{position}</span>;
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/90">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Ranking Graczy
          </CardTitle>
          <CardDescription>Najlepsze wyniki</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Ładowanie...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/90">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Ranking Graczy
          </CardTitle>
          <CardDescription>Najlepsze wyniki</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive font-semibold mb-2">Błąd ładowania</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">Sprawdź konsolę przeglądarki (F12)</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/90">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Ranking Graczy
          </CardTitle>
          <CardDescription>Najlepsze wyniki</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-muted-foreground font-semibold">
              Brak wyników. Bądź pierwszym graczem!
            </p>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Aby pojawić się w rankingu:</p>
              <ol className="text-left list-decimal list-inside space-y-1">
                <li>Zarejestruj konto (/register)</li>
                <li>Zaloguj się (/login)</li>
                <li>Zagraj i zdobądź punkty!</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Ranking Graczy
        </CardTitle>
        <CardDescription>Top 10 najlepszych wyników</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {leaderboard.map((player, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                index < 3
                  ? "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
                  : "bg-muted/50 hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0 w-8 flex justify-center">
                  {getMedalIcon(index + 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${index < 3 ? "text-lg" : ""}`}>
                    {player.full_name || "Anonim"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {player.attempts} {player.attempts === 1 ? "próba" : "prób"}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                <div
                  className={`font-bold text-right ${
                    index < 3 ? "text-xl text-primary" : "text-lg"
                  }`}
                >
                  {player.high_score}
                </div>
                <div className="text-xs text-muted-foreground text-right">punktów</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;

