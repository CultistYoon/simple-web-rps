"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Coins, User, BarChart3, Settings, Scissors, Mountain, Hand, Star } from "lucide-react";

// 타입 정의
type Choice = "rock" | "paper" | "scissors";
type GameResult = "win" | "lose" | "draw";

interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  winStreak: number;
  maxWinStreak: number;
  gold: number;
  level: number;
  exp: number;
  selectedSkin: string;
  unlockedSkins: string[];
}

interface AiPattern {
  lastPlayerChoices: Choice[];
  tendencies: Record<Choice, number>;
}

// 상수 정의
const CHOICES: { value: Choice; icon: any; label: string; color: string }[] = [
  { value: "rock", icon: Mountain, label: "바위", color: "text-gray-600" },
  { value: "paper", icon: Hand, label: "보", color: "text-blue-600" },
  { value: "scissors", icon: Scissors, label: "가위", color: "text-red-600" },
];

const SKINS = [
  { id: "default", name: "기본 손", price: 0, rarity: "common" },
  { id: "golden", name: "황금 손", price: 500, rarity: "rare" },
  { id: "diamond", name: "다이아몬드 손", price: 1000, rarity: "epic" },
  { id: "rainbow", name: "무지개 손", price: 2000, rarity: "legendary" },
];

export default function RockPaperScissorsGame() {
  const [gameStats, setGameStats] = useState<GameStats>({
    wins: 0,
    losses: 0,
    draws: 0,
    totalGames: 0,
    winStreak: 0,
    maxWinStreak: 0,
    gold: 100,
    level: 1,
    exp: 0,
    selectedSkin: "default",
    unlockedSkins: ["default"],
  });

  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [aiChoice, setAiChoice] = useState<Choice | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [rewardAnimation, setRewardAnimation] = useState<string | null>(null);

  const [aiPattern, setAiPattern] = useState<AiPattern>({
    lastPlayerChoices: [],
    tendencies: { rock: 0, paper: 0, scissors: 0 },
  });

  useEffect(() => {
    const savedStats = localStorage.getItem("rps-game-stats");
    if (savedStats) setGameStats(JSON.parse(savedStats));
    const savedPattern = localStorage.getItem("rps-ai-pattern");
    if (savedPattern) setAiPattern(JSON.parse(savedPattern));
  }, []);

  useEffect(() => {
    localStorage.setItem("rps-game-stats", JSON.stringify(gameStats));
  }, [gameStats]);
  useEffect(() => {
    localStorage.setItem("rps-ai-pattern", JSON.stringify(aiPattern));
  }, [aiPattern]);

  const getAiChoice = (): Choice => {
    const choices: Choice[] = ["rock", "paper", "scissors"];
    if (aiPattern.lastPlayerChoices.length >= 3) {
      const recentChoices = aiPattern.lastPlayerChoices.slice(-3);
      const choiceCounts = recentChoices.reduce((acc, choice) => {
        acc[choice] = (acc[choice] || 0) + 1;
        return acc;
      }, { rock: 0, paper: 0, scissors: 0 } as Record<Choice, number>);
      let mostFrequentChoice: Choice = "rock";
      let maxCount = -1;
      for (const choice of choices) {
        if (choiceCounts[choice] > maxCount) {
          maxCount = choiceCounts[choice];
          mostFrequentChoice = choice;
        }
      }
      if (Math.random() < 0.7) {
        const counter: Record<Choice, Choice> = { rock: "paper", paper: "scissors", scissors: "rock" };
        return counter[mostFrequentChoice];
      }
    }
    return choices[Math.floor(Math.random() * choices.length)];
  };

  const determineWinner = (player: Choice, ai: Choice): GameResult => {
    if (player === ai) return "draw";
    const winConditions: Record<Choice, Choice> = {
      rock: "scissors",
      paper: "rock",
      scissors: "paper",
    };
    return winConditions[player] === ai ? "win" : "lose";
  };

  const calculateRewards = (result: GameResult, streak: number) => {
    let goldReward = 0;
    let expReward = 0;
    switch (result) {
      case "win":
        goldReward = 10 + Math.floor(streak / 3) * 5;
        expReward = 25 + Math.floor(streak / 2) * 10;
        break;
      case "draw":
        goldReward = 3;
        expReward = 10;
        break;
      case "lose":
        goldReward = 1;
        expReward = 5;
        break;
    }
    return { goldReward, expReward };
  };

  const checkLevelUp = (currentExp: number, currentLevel: number) => {
    const expNeeded = currentLevel * 100;
    if (currentExp >= expNeeded) {
      return {
        newLevel: currentLevel + 1,
        remainingExp: currentExp - expNeeded,
      };
    }
    return null;
  };

  const playGame = (choice: Choice) => {
    if (isPlaying) return;
    setIsPlaying(true);
    setPlayerChoice(choice);
    setAiChoice(null);
    setShowResult(false);
    setRewardAnimation(null);
    const ai = getAiChoice();
    setTimeout(() => {
      setAiChoice(ai);
      const result = determineWinner(choice, ai);
      setGameResult(result);
      setGameStats((prev) => {
        const newStats = { ...prev };
        const { goldReward, expReward } = calculateRewards(result, prev.winStreak);
        newStats.totalGames += 1;
        if (result === "win") newStats.wins += 1;
        else if (result === "lose") newStats.losses += 1;
        else newStats.draws += 1;
        if (result === "win") {
          newStats.winStreak += 1;
          newStats.maxWinStreak = Math.max(newStats.maxWinStreak, newStats.winStreak);
        } else if (result === "lose") {
          newStats.winStreak = 0;
        }
        newStats.gold += goldReward;
        newStats.exp += expReward;
        const levelUp = checkLevelUp(newStats.exp, newStats.level);
        if (levelUp) {
          newStats.level = levelUp.newLevel;
          newStats.exp = levelUp.remainingExp;
          newStats.gold += 50;
          setRewardAnimation("levelup");
        } else {
          setRewardAnimation(result === "win" ? "win" : result === "draw" ? "draw" : null);
        }
        return newStats;
      });
      setAiPattern((prev) => {
        const updatedLastPlayerChoices = [...prev.lastPlayerChoices, choice].slice(-10);
        const updatedTendencies = { ...prev.tendencies, [choice]: prev.tendencies[choice] + 1 };
        return {
          lastPlayerChoices: updatedLastPlayerChoices,
          tendencies: updatedTendencies,
        };
      });
      setShowResult(true);
      setIsPlaying(false);
      setTimeout(() => setRewardAnimation(null), 2000);
    }, 1500);
  };

  const buySkin = (skinId: string, price: number) => {
    if (gameStats.gold >= price && !gameStats.unlockedSkins.includes(skinId)) {
      setGameStats((prev) => ({
        ...prev,
        gold: prev.gold - price,
        unlockedSkins: [...prev.unlockedSkins, skinId],
      }));
    } else if (gameStats.unlockedSkins.includes(skinId)) {
      alert("이미 잠금 해제된 스킨입니다!");
    } else {
      alert("골드가 부족합니다!");
    }
  };

  const selectSkin = (skinId: string) => {
    if (gameStats.unlockedSkins.includes(skinId)) {
      setGameStats((prev) => ({ ...prev, selectedSkin: skinId }));
    } else {
      alert("먼저 스킨을 잠금 해제하세요!");
    }
  };

  const winRate = gameStats.totalGames > 0 ? ((gameStats.wins / gameStats.totalGames) * 100).toFixed(1) : "0.0";
  const expProgress = (gameStats.exp / (gameStats.level * 100)) * 100;

  const getAiMostFrequentChoiceHint = () => {
    const choices: Choice[] = ["rock", "paper", "scissors"];
    let mostFrequent = choices[0];
    let maxCount = aiPattern.tendencies[choices[0]];
    for (let i = 1; i < choices.length; i++) {
      if (aiPattern.tendencies[choices[i]] > maxCount) {
        maxCount = aiPattern.tendencies[choices[i]];
        mostFrequent = choices[i];
      }
    }
    const label = CHOICES.find(c => c.value === mostFrequent)?.label;
    return label || "없음";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">가위바위보 마스터</h1>
          <p className="text-gray-600">심리전과 전략이 만나는 곳</p>
        </div>
        {/* 플레이어 정보 */}
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">레벨 {gameStats.level}</h2>
                <div className="flex items-center gap-2">
                  <Progress value={expProgress} className="w-32" />
                  <span className="text-sm text-gray-600">{gameStats.exp}/{gameStats.level * 100}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="font-bold text-lg">{gameStats.gold}</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-500" />
                <span className="font-bold">{gameStats.winStreak}</span>
              </div>
            </div>
          </div>
        </Card>
        {/* 탭 메뉴 */}
        <Tabs defaultValue="game" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="game">게임</TabsTrigger>
            <TabsTrigger value="stats">통계</TabsTrigger>
            <TabsTrigger value="shop">상점</TabsTrigger>
            <TabsTrigger value="settings">설정</TabsTrigger>
          </TabsList>
          {/* 게임 탭 내용 */}
          <TabsContent value="game">
            <Card className="p-8 bg-white/80 backdrop-blur">
              {/* AI 패턴 힌트 */}
              {aiPattern.lastPlayerChoices.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">AI 심리 분석</h3>
                  <p className="text-sm text-blue-600">
                    AI는 당신이 최근 어떤 패를 자주 냈는지 학습하고 있습니다. (예상: <b>{getAiMostFrequentChoiceHint()}</b>)
                  </p>
                </div>
              )}
              {/* 게임 영역 */}
              <div className="text-center mb-8">
                <div className="flex justify-center items-center gap-12 mb-8">
                  {/* 플레이어 */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">당신</h3>
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-2 
                                    ${playerChoice ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {playerChoice && (
                        <div className={`w-12 h-12 ${CHOICES.find(c => c.value === playerChoice)?.color}`}>
                          {CHOICES.find(c => c.value === playerChoice)?.icon && (() => {
                            const IconComponent = CHOICES.find(c => c.value === playerChoice)!.icon;
                            return <IconComponent className="w-full h-full" />;
                          })()}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {playerChoice ? CHOICES.find(c => c.value === playerChoice)?.label : '선택하세요'}
                    </p>
                  </div>
                  {/* VS */}
                  <div className="text-2xl font-bold text-gray-400">VS</div>
                  {/* AI */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">AI</h3>
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-2
                                    ${aiChoice && showResult ? 'bg-red-100' : 'bg-gray-100'}`}>
                      {aiChoice && showResult && (
                        <div className={`w-12 h-12 ${CHOICES.find(c => c.value === aiChoice)?.color}`}>
                          {CHOICES.find(c => c.value === aiChoice)?.icon && (() => {
                            const IconComponent = CHOICES.find(c => c.value === aiChoice)!.icon;
                            return <IconComponent className="w-full h-full" />;
                          })()}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {aiChoice && showResult ? CHOICES.find(c => c.value === aiChoice)?.label : '생각 중...'}
                    </p>
                  </div>
                </div>
                {/* 결과 표시 */}
                {showResult && gameResult && (
                  <div className="mb-6">
                    <div className={`text-3xl font-bold mb-2 ${
                      gameResult === 'win' ? 'text-green-600' :
                      gameResult === 'lose' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {gameResult === 'win' ? '승리!' :
                       gameResult === 'lose' ? '패배!' : '무승부!'}
                    </div>
                    {rewardAnimation && (
                      <div className="animate-bounce mt-2">
                        {rewardAnimation === 'levelup' && (
                          <Badge className="bg-purple-500 text-white p-2">레벨업! +50 골드</Badge>
                        )}
                        {rewardAnimation === 'win' && (
                          <Badge className="bg-green-500 text-white p-2">승리 보상!</Badge>
                        )}
                        {rewardAnimation === 'draw' && (
                          <Badge className="bg-yellow-500 text-white p-2">참가 보상!</Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* 선택 버튼 */}
                <div className="flex justify-center gap-6">
                  {CHOICES.map((choice) => (
                    <Button
                      key={choice.value}
                      onClick={() => playGame(choice.value)}
                      disabled={isPlaying}
                      size="lg"
                      className="w-20 h-20 rounded-full p-0 bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 ease-in-out"
                    >
                      <div className="text-center">
                        <choice.icon className={`w-8 h-8 mx-auto mb-1 ${choice.color}`} />
                        <span className="text-xs text-gray-600">{choice.label}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>
          {/* 통계 탭 내용 */}
          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/80 backdrop-blur">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  게임 통계
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>총 게임 수:</span>
                    <span className="font-bold">{gameStats.totalGames}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>승률:</span>
                    <span className="font-bold text-green-600">{winRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>최고 연승:</span>
                    <span className="font-bold text-purple-600">{gameStats.maxWinStreak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>현재 연승:</span>
                    <span className="font-bold text-blue-600">{gameStats.winStreak}</span>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  상세 기록
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>승리:</span>
                    <span className="font-bold text-green-600">{gameStats.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>패배:</span>
                    <span className="font-bold text-red-600">{gameStats.losses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>무승부:</span>
                    <span className="font-bold text-yellow-600">{gameStats.draws}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>보유 골드:</span>
                    <span className="font-bold text-yellow-500">{gameStats.gold}</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
          {/* 상점 탭 내용 */}
          <TabsContent value="shop">
            <Card className="p-6 bg-white/80 backdrop-blur">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Star className="w-5 h-5" />
                스킨 상점
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SKINS.map((skin) => (
                  <Card key={skin.id} className={`p-4 border-2 ${gameStats.selectedSkin === skin.id ? 'border-purple-500' : 'hover:border-blue-300'} transition-colors`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{skin.name}</h4>
                        <Badge variant={
                          skin.rarity === 'legendary' ? 'default' :
                          skin.rarity === 'epic' ? 'secondary' :
                          skin.rarity === 'rare' ? 'outline' : 'secondary'
                        }>
                          {skin.rarity === 'legendary' ? '전설' :
                           skin.rarity === 'epic' ? '영웅' :
                           skin.rarity === 'rare' ? '희귀' : '일반'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        {skin.price > 0 && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Coins className="w-4 h-4" />
                            <span className="font-bold">{skin.price}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {gameStats.unlockedSkins.includes(skin.id) ? (
                        <Button
                          onClick={() => selectSkin(skin.id)}
                          variant={gameStats.selectedSkin === skin.id ? "default" : "outline"}
                          className="flex-1"
                        >
                          {gameStats.selectedSkin === skin.id ? '사용 중' : '선택'}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => buySkin(skin.id, skin.price)}
                          disabled={gameStats.gold < skin.price}
                          className="flex-1"
                        >
                          구매
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
          {/* 설정 탭 내용 */}
          <TabsContent value="settings">
            <Card className="p-6 bg-white/80 backdrop-blur">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                게임 설정
              </h3>
              <div className="space-y-4">
                <Button
                  onClick={() => {
                    if (confirm('정말로 모든 데이터를 초기화하시겠습니까?')) {
                      localStorage.removeItem('rps-game-stats');
                      localStorage.removeItem('rps-ai-pattern');
                      window.location.reload();
                    }
                  }}
                  variant="destructive"
                >
                  데이터 초기화
                </Button>
                <div className="text-sm text-gray-600">
                  <p>게임 버전: 1.0.0</p>
                  <p>개발: 허윤오오오오</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
