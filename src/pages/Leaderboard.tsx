import Leaderboard from "@/components/Leaderboard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LeaderboardPage = () => {
  const navigate = useNavigate();
  return (
  <div className="flex min-h-screen items-center justify-center p-4 relative">
  <div className="container max-w-4xl mx-auto w-full">
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center text-center justify-around gap-8 relative max-w-[40rem] w-[100%] h-[100%] aspect-square">
        <div className="flex flex-row align-top justify-between max-h-[2.5rem] w-full max-w-[25.125rem]">
        <div className="text-[3rem] text-white relative z-20 leading-[normal]">LEADERBOARD</div>
        <div className="flex flex-row gap-2 items-start align-top justify-start relative z-20">
          <img src="/logo.gif" alt="Grafit" className="w-auto max-h-[2.5rem] ratio-1/1" />
          <div className="flex flex-col gap-2">
          <img src="/logo.png" alt="ZipZap" className="w-auto max-h-[2.5rem] " />
          <div className="text-black">GRAPHITE INC</div>
          </div>
        </div>
        </div>
        <div className="relative z-20 w-full max-w-[25.125rem] mix-blend-difference flex flex-row space-between">
          <Leaderboard className="w-full" limit={10} />
          </div>
        <div className="flex flex-col  gap-[0.625rem] justify-start align-start items-start relative z-20">
            <Button 
              onClick={() => navigate("/")}
              className="text-xl text-left bg-transparent text-white p-0 text-[3.125rem] leading-[normal]"
            >
              BACK
            </Button>
        </div>
        <img src="/assety/bg_home/bg_leader_card.png" alt="Background" className="absolute top-0 left-0 w-full h-full z-10" />
       
      </div>
    </div>
  </div>
  <img src="/assety/bg_home/bg_leadership.png" alt="Background" className="absolute top-0 left-0 w-full h-full" />
</div>)
};

export default LeaderboardPage;