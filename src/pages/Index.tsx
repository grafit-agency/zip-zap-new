import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-game-gradient">
      <div className="text-center space-y-8 animate-in fade-in duration-700">
        <h1 className="text-7xl font-bold text-primary-foreground drop-shadow-lg tracking-tight">
          Welcome to ZipZap
        </h1>
        <Button 
          onClick={() => navigate("/game")}
          size="lg"
          className="text-xl px-12 py-6 shadow-game-glow hover:scale-105 transition-transform duration-200"
        >
          Play
        </Button>
      </div>
    </div>
  );
};

export default Index;
