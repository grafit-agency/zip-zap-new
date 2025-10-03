import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Leaderboard from "@/components/Leaderboard";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-game-gradient p-4">
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
              <Button 
                onClick={() => navigate("/login")}
                size="lg"
                variant="outline"
                className="text-xl px-12 py-6 bg-white/90 hover:bg-white hover:scale-105 transition-transform duration-200"
              >
                Login
              </Button>
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
