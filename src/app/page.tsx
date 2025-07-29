import { FutsalCourt } from "@/components/FutsalCourt";
import { MatchDetails } from "@/components/MatchDetails";
import { Scoreboard } from "@/components/Scoreboard";
import { ControlPanel } from "@/components/ControlPanel";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-gray-100">
      <Header />
      {/* This is a small comment added by the AI */}
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        
      </div>
      
      <div className="relative flex place-items-center ">
       <Scoreboard />
      </div>

      <div className="relative flex place-items-center ">
       <FutsalCourt />
      </div>

      <div className="relative flex place-items-center ">
       <ControlPanel />
      </div>

      <div className="relative flex place-items-center ">
       <MatchDetails />
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-4 lg:text-left">
        
      </div>
    </main>
  );
}
