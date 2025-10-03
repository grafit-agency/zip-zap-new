import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Leaderboard from "@/components/Leaderboard";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User, LogOut } from "lucide-react";
import { signOut } from "@/api/auth";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sprawdź obecną sesję
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Nasłuchuj zmian w sesji
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Wylogowano pomyślnie" });
      setUser(null);
    } catch (error) {
      toast({ title: "Błąd wylogowania", variant: "destructive" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-game-gradient p-4">
      {/* User indicator w prawym górnym rogu */}
      <div className="fixed top-4 right-4 z-50">
        {loading ? (
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
            <span className="text-sm text-muted-foreground">Ładowanie...</span>
          </div>
        ) : user ? (
          <div className="bg-white/90 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <User className="w-5 h-5 text-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <span className="text-xs text-muted-foreground">Zalogowany</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              aria-label="Wyloguj"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => navigate("/login")}
            variant="outline"
            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
          >
            <User className="w-4 h-4 mr-2" />
            Zaloguj się
          </Button>
        )}
      </div>

      <div className="container max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Lewa strona - Tytuł i przyciski */}
          <div className="text-center md:text-left space-y-8 animate-in fade-in duration-700">
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground drop-shadow-lg tracking-tight">
              Welcome to ZipZap
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button 
                onClick={() => navigate("/game")}
                size="lg"
                className="text-xl px-12 py-6 shadow-game-glow hover:scale-105 transition-transform duration-200"
              >
                Play
              </Button>
              {!user && (
                <Button 
                  onClick={() => navigate("/login")}
                  size="lg"
                  variant="outline"
                  className="text-xl px-12 py-6 bg-white/90 hover:bg-white hover:scale-105 transition-transform duration-200"
                >
                  Login
                </Button>
              )}
            </div>
          </div>

          {/* Prawa strona - Leaderboard */}
          <div className="animate-in fade-in duration-1000 delay-300">
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
