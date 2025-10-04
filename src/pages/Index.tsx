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
    <div className="flex min-h-screen items-center justify-center p-4 relative">
      <div className="container max-w-4xl mx-auto w-full">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center text-center justify-center gap-8 relative max-w-[31.25rem] w-[100%] h-[100%] aspect-square">
            <div className="flex flex-row gap-2 items-start align-top justify-start relative z-20">
              <img src="/logo-grafit.png" alt="Grafit" className="w-[6.5rem] ratio-1/1" />
              <img src="/logo.png" alt="ZipZap" className="w-[13.3rem] " />
            </div>
            <div className="flex flex-col  gap-[0.625rem] justify-start align-start items-start relative z-20">
              <Button 
                onClick={() => navigate("/login")}
                className="text-xl text-left bg-transparent text-white p-0 text-[3.125rem] leading-[normal]"
                indicatorBlink
                indicatorColor="white"
              >
                LOG IN
              </Button>
                <Button 
                  onClick={() => navigate("/game")}
                  className="text-xl text-left bg-transparent text-white p-0 text-[3.125rem] leading-[normal]"
                >
                  PLAY AS A GUEST
                </Button>
                <Button 
                  onClick={() => navigate("/leaderboard")}
                  className="text-xl text-left bg-transparent text-white p-0 text-[3.125rem] leading-[normal]"
                >
                  LEADERBOARD
                </Button>
            </div>
            <img src="/assety/bg_home/bg_home_card.png" alt="Background" className="absolute top-0 left-0 w-full h-full z-10" />
            <div className="relative z-10 w-full max-w-[25.125rem] mix-blend-difference flex flex-row space-between">
              <Leaderboard className="w-full" limit={1} />
              </div>
          </div>
        </div>
      </div>
      <img src="/assety/bg_home/bg_home1.png" alt="Background" className="absolute top-0 left-0 w-full h-full" />
    </div>
  );
};

export default Index;
