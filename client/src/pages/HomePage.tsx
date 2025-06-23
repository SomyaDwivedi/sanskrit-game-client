import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AnimatedCard from "../components/AnimatedCard";
import { useAudio } from "../hooks/useAudio";
import { ROUTES } from "../utils/constants";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { soundEnabled, toggleSound, startBgMusic, stopBgMusic } = useAudio();

  useEffect(() => {
    startBgMusic();
    return () => stopBgMusic();
  }, [startBgMusic, stopBgMusic]);

  return (
    <div className="min-h-screen flex flex-col gradient-bg">
      <Header soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <AnimatedCard>
            <div className="text-6xl mb-6 animate-float">🎮</div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent animate-gradient">
              Family Feud Quiz
            </h1>
            <p className="text-xl text-slate-300 mb-2">Interactive Team Quiz</p>
            <p className="text-lg text-slate-400 mb-12">
              An exciting buzzer-based competition for teams
            </p>
          </AnimatedCard>

          <div className="flex flex-col md:flex-row gap-6 max-w-2xl mx-auto">
            <AnimatedCard className="flex-1" delay={200}>
              <button
                onClick={() => navigate(ROUTES.HOST)}
                className="btn-primary w-full py-6 text-xl group"
              >
                <span className="text-3xl mr-3 group-hover:animate-bounce">
                  👑
                </span>
                HOST GAME
                <span className="block text-sm text-blue-200 mt-1">
                  Create & manage a competition
                </span>
              </button>
            </AnimatedCard>

            <AnimatedCard className="flex-1" delay={400}>
              <button
                onClick={() => navigate(ROUTES.JOIN)}
                className="btn-success w-full py-6 text-xl group"
              >
                <span className="text-3xl mr-3 group-hover:animate-bounce">
                  🎯
                </span>
                JOIN GAME
                <span className="block text-sm text-green-200 mt-1">
                  Enter as a contestant
                </span>
              </button>
            </AnimatedCard>
          </div>

          <AnimatedCard delay={600}>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="glass-card p-6 hover-lift">
                <div className="text-4xl mb-3">🔔</div>
                <h3 className="text-lg font-semibold mb-2">Buzzer System</h3>
                <p className="text-sm text-slate-400">
                  Fast-paced buzzer competition with turn-based answers
                </p>
              </div>

              <div className="glass-card p-6 hover-lift">
                <div className="text-4xl mb-3">👥</div>
                <h3 className="text-lg font-semibold mb-2">Team Play</h3>
                <p className="text-sm text-slate-400">
                  Compete in teams with alternating turns and strikes system
                </p>
              </div>

              <div className="glass-card p-6 hover-lift">
                <div className="text-4xl mb-3">🏆</div>
                <h3 className="text-lg font-semibold mb-2">Points System</h3>
                <p className="text-sm text-slate-400">
                  Earn points for correct answers and compete for high scores
                </p>
              </div>
            </div>
          </AnimatedCard>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;