import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Game = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="fixed top-4 left-4 hover:scale-110 transition-transform"
        aria-label="Go back home"
      >
        <Home className="h-6 w-6" />
      </Button>
      
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Game Page</h1>
          <p className="text-muted-foreground">Your game will go here!</p>
        </div>
      </div>
    </div>
  );
};

export default Game;
