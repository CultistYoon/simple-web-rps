"use client";

import { useState, useEffect } from "react";
import type { ElementType } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trophy, Coins, User, BarChart3, Settings, Scissors, Mountain, Hand, Star, Lock, CheckCircle } from "lucide-react";
import * as React from "react";

// --- 기획서 기반 시스템 정의 ---
const TIERS = [
  { name: 'Basic', winsRequired: 0, color: 'text-gray-500', bgColor: 'bg-gray-100', progressColor: 'bg-gray-400' },
  { name: 'Bronze', winsRequired: 10, color: 'text-amber-700', bgColor: 'bg-amber-100', progressColor: 'bg-amber-500' },
  { name: 'Gold', winsRequired: 25, color: 'text-yellow-500', bgColor: 'bg-yellow-100', progressColor: 'bg-yellow-500' },
  { name: 'Diamond', winsRequired: 60, color: 'text-sky-400', bgColor: 'bg-sky-100', progressColor: 'bg-sky-400' },
];

const getTier = (wins: number) => {
  return TIERS.slice().reverse().find(tier => wins >= tier.winsRequired) || TIERS[0];
};

const SKINS = [
  { id: "default", name: "기본 손", winsRequired: 0, rarity: "common" },
  { id: "golden", name: "황금 손", winsRequired: 15, rarity: "rare" },
  { id: "diamond", name: "다이아몬드 손", winsRequired: 40, rarity: "epic" },
  { id: "rainbow", name: "무지개 손", winsRequired: 100, rarity: "legendary" },
];

// --- 타입 정의 ---
type Choice = "rock" | "paper" | "scissors";
type Result = "win" | "lose" | "draw";
type TierName = "Basic" | "Bronze" | "Gold" | "Diamond";

// 게임의 모든 통계를 관리합니다.
interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  maxWinStreak: number;
  unlockedSkins: string[];
  selectedSkin: string;
}

// 개별 게임 라운드의 기록입니다. AI 패턴 분석에 사용됩니다.
interface GameRound {
  player: Choice;
  ai: Choice;
  result: Result;
}

// 상수 정의
const CHOICES: { value: Choice; icon: ElementType; label: string; color: string }[] = [
  { value: "rock", icon: Mountain, label: "바위", color: "text-gray-600" },
  { value: "paper", icon: Hand, label: "보", color: "text-blue-600" },
  { value: "scissors", icon: Scissors, label: "가위", color: "text-red-600" },
];

export default function Home() {
  // --- 상태 관리 (useState) ---
  const [stats, setStats] = useState<GameStats>({
    wins: 0,
    losses: 0,
    draws: 0,
    winStreak: 0,
    maxWinStreak: 0,
    unlockedSkins: ["default"],
    selectedSkin: "default",
  });

  const [gameHistory, setGameHistory] = useState<GameRound[]>([]);

  // 현재 라운드 관련 상태
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [aiChoice, setAiChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState(false); // AI가 선택하고 결과를 계산하는 동안의 로딩 상태
  
  // AI 관련 상태
  const [aiMessage, setAiMessage] = useState("AI가 당신의 수를 기다리고 있습니다.");
  const [isDeceiving, setIsDeceiving] = useState(false);
  const [deceptionChoice, setDeceptionChoice] = useState<Choice | null>(null);

  // UI 관련 상태
  const [activeTab, setActiveTab] = useState("game");
  const [showPlanPopup, setShowPlanPopup] = useState(false);
  const [showPlanDocument, setShowPlanDocument] = useState(false);
  const SHOW_PLAN_ON_FIRST_LOAD = true; // false로 바꾸면 첫 접속 시 팝업 안 뜸

  // --- 데이터 로딩 및 저장 (useEffect) ---
  useEffect(() => {
    // 게임 통계 로딩
    const savedStats = localStorage.getItem("rpsMasterGameStats");
    if (savedStats) {
      const parsedStats = JSON.parse(savedStats);
      // 데이터 구조가 깨졌을 경우를 대비한 방어 코드
      setStats({
        wins: parsedStats.wins ?? 0,
        losses: parsedStats.losses ?? 0,
        draws: parsedStats.draws ?? 0,
        winStreak: parsedStats.winStreak ?? 0,
        maxWinStreak: parsedStats.maxWinStreak ?? 0,
        unlockedSkins: Array.isArray(parsedStats.unlockedSkins) ? parsedStats.unlockedSkins : ["default"],
        selectedSkin: parsedStats.selectedSkin ?? "default",
      });
    }

    // 게임 히스토리 로딩
    const savedHistory = localStorage.getItem("rpsMasterGameHistory");
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory);
      if (Array.isArray(parsedHistory)) {
        setGameHistory(parsedHistory);
      }
    }

    // 첫 방문 시 기획서 팝업
    const hasVisited = localStorage.getItem("rpsMasterHasVisited");
    if (SHOW_PLAN_ON_FIRST_LOAD && !hasVisited) {
      setShowPlanPopup(true);
      localStorage.setItem("rpsMasterHasVisited", "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("rpsMasterGameStats", JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem("rpsMasterGameHistory", JSON.stringify(gameHistory));
  }, [gameHistory]);

  const getAiChoice = (): Choice => {
    const choices: Choice[] = ["rock", "paper", "scissors"];
    if (gameHistory.length >= 3) {
      const recentChoices = gameHistory.slice(-3).map(round => round.ai);
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

  const determineWinner = (player: Choice, ai: Choice): Result => {
    if (player === ai) return "draw";
    const winConditions: Record<Choice, Choice> = {
      rock: "scissors",
      paper: "rock",
      scissors: "paper",
    };
    return winConditions[player] === ai ? "win" : "lose";
  };

  const calculateRewards = (result: Result) => {
    if (result === 'win') {
      return { expReward: 1 };
    }
    return { expReward: 0 };
  };

  const handlePlay = (playerChoice: Choice) => {
    if (result) return;

    const aiChoice = getAiChoice();
    const result = determineWinner(playerChoice, aiChoice);
    const { expReward } = calculateRewards(result);

    setStats((prev) => {
      const newStats = { ...prev };
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
      if (result === "win") newStats.wins += expReward;
      if (result === "draw") newStats.draws += 1;

      if (result === "win") {
        setRewardAnimation("win");
      } else {
        setRewardAnimation(result === "draw" ? "draw" : null);
      }

      if (!newStats.unlockedSkins.includes(newStats.selectedSkin)) {
        newStats.selectedSkin = "default";
      }
      
      // 스킨 자동 해금
      SKINS.forEach(skin => {
        if (newStats.wins >= skin.winsRequired && !newStats.unlockedSkins.includes(skin.id)) {
          newStats.unlockedSkins.push(skin.id);
        }
      });

      return newStats;
    });

    setGameHistory((prev) => [...prev, { player: playerChoice, ai: aiChoice, result }]);

    setResult(result);
  };

  const nextRound = () => {
    setResult(null);
    setPlayerChoice(null);
    setAiChoice(null);
  };

  const IconForChoice = ({
    choice,
    className,
  }: {
    choice: Choice
    className?: string
  }) => {
    const IconComponent = CHOICES.find((c) => c.value === choice)?.icon;
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  const selectSkin = (skinId: string) => {
    if (stats.unlockedSkins.includes(skinId)) {
      setStats((prev) => ({ ...prev, selectedSkin: skinId }));
    } else {
      alert("먼저 스킨을 잠금 해제하세요!");
    }
  };

  // --- 동적 계산 ---
  const currentTier = getTier(stats.wins);
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1];

  const expProgress = nextTier
    ? ((stats.wins - currentTier.winsRequired) / (nextTier.winsRequired - currentTier.winsRequired)) * 100
    : 100;

  const getAiMostFrequentChoiceHint = () => {
    const choices: Choice[] = ["rock", "paper", "scissors"];
    let mostFrequent = choices[0];
    let maxCount = gameHistory.reduce((acc, round) => {
      acc[round.ai] = (acc[round.ai] || 0) + 1;
      return acc;
    }, { rock: 0, paper: 0, scissors: 0 } as Record<Choice, number>);
    for (let i = 1; i < choices.length; i++) {
      const count = maxCount[choices[i]] || 0;
      if (count > maxCount[mostFrequent]) {
        maxCount[mostFrequent] = count;
        mostFrequent = choices[i];
      }
    }
    const label = CHOICES.find(c => c.value === mostFrequent)?.label;

    // 다양한 심리전 멘트
    const aiMessages = [
      `🤔 \"흠... 내가 지금까지 ${label}을(를) 가장 많이 냈는데, 이 인간이 패턴을 파악했을 수도 있어. 하지만 내가 정말 그럴까? 아니면 일부러 그렇게 보이게 하는 걸까?\"`,
      `🎭 \"심리전의 시작이다! 내가 ${label}을(를) 자주 내는 걸 보면, 이 인간은 분명 내가 또 낼 거라고 생각할 거야. 그럼 나는... 흥미롭군!\"`,
      `�� \"패턴 분석 중... 내가 ${label}을(를) 선호한다는 걸 이 인간이 알았을 테니, 이번엔 완전히 다른 걸 낼 수도 있어. 하지만 그걸 예상하고 또 다른 걸 낼 수도 있고...\"`,
      `⚡ \"전략적 사고 모드! ${label}을(를) 자주 내는 내 패턴을 이 인간이 파악했다면, 이번엔 그걸 역이용해서 기만 작전을 펼쳐야겠어!\"`,
      `🎯 \"심리전의 정점! 내가 ${label}을(를) 선호한다는 걸 알고 있을 테니, 이번엔 완전히 예측 불가능한 선택을 해야겠어. 하지만 그걸 예상하고 또 다른 걸 낼 수도 있고... 무한 루프야!\"`,
      `🔥 \"기만의 예술! ${label}을(를) 자주 내는 걸 보면 이 인간은 내가 또 낼 거라고 생각할 거야. 그럼 나는... 흥미로운 선택을 해야겠어!\"`,
      `🎪 \"심리전의 서커스! 내가 ${label}을(를) 선호한다는 걸 이 인간이 알았을 테니, 이번엔 완전히 다른 차원의 선택을 해야겠어. 하지만 그걸 예상하고 또 다른 걸 낼 수도 있고... 복잡해!\"`,
      `🌟 \"전략적 천재 모드! ${label}을(를) 자주 내는 내 패턴을 이 인간이 파악했다면, 이번엔 그걸 역이용해서 완전히 예측 불가능한 선택을 해야겠어!\"`
    ];

    const messageIndex = (gameHistory.length + Math.floor(Math.random() * 3)) % aiMessages.length;
    return aiMessages[messageIndex];
  };

  const resetGame = () => {
    localStorage.removeItem("rpsMasterGameStats");
    localStorage.removeItem("rpsMasterGameHistory");
    window.location.reload();
  };

  const handleSelectSkin = (skinId: string) => {
    if (stats.unlockedSkins.includes(skinId)) {
      setStats((prev) => ({ ...prev, selectedSkin: skinId }));
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 text-gray-800 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            가위바위보 마스터
          </h1>
          <p className="mt-2 text-lg text-gray-600">심리전과 전략이 만나는 곳</p>
          <div className="mt-4 flex justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300"
              onClick={() => setShowPlanPopup(true)}
            >
              게임 기획서 보기
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300"
              onClick={resetGame}
            >
              게임 초기화
            </Button>
          </div>
        </header>

        {/* --- 플레이어 정보 --- */}
        <Card className={`p-6 mb-8 border-gray-200 rounded-2xl shadow-md transition-all duration-500 ${currentTier.bgColor}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-tr from-violet-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg`}>
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${currentTier.color}`}>{currentTier.name} 티어</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={expProgress} className="w-40 h-3" colorClassName={currentTier.progressColor} />
                  <span className="text-sm font-medium text-gray-600">
                    {stats.wins} / {nextTier ? nextTier.winsRequired : 'MAX'} WINS
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-600" />
                <span className="font-bold text-lg text-gray-800">{stats.winStreak}</span>
              </div>
            </div>
          </div>
        </Card>

        {showPlanPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1000] p-4">
            <Card className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
              <h2 className="text-2xl font-bold mb-4">기획서를 열람하시겠습니까?</h2>
              <p className="text-gray-700 mb-6">게임 시작 전 게임의 의도와 주요 기획을 확인해 보세요.</p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => { setShowPlanDocument(true); setShowPlanPopup(false); }} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200">네</Button>
                <Button onClick={() => setShowPlanPopup(false)} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-200">아니요</Button>
              </div>
            </Card>
          </div>
        )}

        {showPlanDocument && (
          <div className="fixed inset-0 bg-gray-50 overflow-y-auto z-[999] p-4">
            <div className="container" style={{maxWidth: '900px', margin: 'auto', background: '#fff', padding: '30px 40px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'}}>
              {/* 여기에 기획서 HTML/JSX를 넣으세요 */}
              <h1>웹 가위바위보 게임 기획서</h1>
              {/* ... (생략, 위에서 받은 기획서 내용 참고) ... */}
              <div style={{textAlign: 'center', marginTop: '40px', marginBottom: '20px'}}>
                <Button onClick={() => setShowPlanDocument(false)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-200">
                  게임으로 돌아가기
                </Button>
              </div>
            </div>
          </div>
        )}

        {!showPlanDocument && (
          <div className="bg-white/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200">
            <Tabs defaultValue="game" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-sky-100/70 p-1 rounded-xl shadow-inner mb-6">
                <TabsTrigger value="game">
                  <Scissors className="w-4 h-4 mr-2" />
                  게임
                </TabsTrigger>
                <TabsTrigger value="stats">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  기록
                </TabsTrigger>
                <TabsTrigger value="shop">
                  <Star className="w-4 h-4 mr-2" />
                  옷장
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="w-4 h-4 mr-2" />
                  설정
                </TabsTrigger>
              </TabsList>

              <TabsContent value="game">
                <Card className="p-6 sm:p-8 bg-white/80 backdrop-blur-lg">
                  {/* 결과 표시 */}
                  <div className="text-center mb-6 h-24 flex flex-col items-center justify-center">
                    {result && (
                      <div className="flex flex-col items-center gap-4">
                        <div
                          key={result}
                          className={`text-2xl font-bold px-4 py-2 rounded-lg
                            ${
                              result.includes('승리')
                                ? 'bg-green-100 text-green-700 animate-bounce'
                                : ''
                            }
                            ${
                              result.includes('패배')
                                ? 'bg-red-100 text-red-700'
                                : '' /* shake 애니메이션은 다음 단계에서 추가 */
                            }
                            ${
                              result.includes('무승부')
                                ? 'bg-gray-100 text-gray-700'
                                : ''
                            }`}
                        >
                          {result}
                        </div>
                        <Button
                          onClick={nextRound}
                          variant="secondary"
                          size="sm"
                        >
                          다음 라운드
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* 당신의 선택 */}
                    <div className="flex flex-col items-center text-center">
                      <h3 className="text-2xl font-bold mb-4 text-gray-800">
                        당신
                      </h3>
                      <div className="w-32 h-32 rounded-full border-4 flex items-center justify-center bg-gray-50 mb-6 shadow-inner transition-all duration-300">
                        {playerChoice && (
                          <IconForChoice
                            choice={playerChoice}
                            className="w-16 h-16 text-blue-500"
                          />
                        )}
                      </div>
                      <div className="flex justify-center gap-3">
                        {CHOICES.map((choice) => (
                          <Button
                            key={choice.value}
                            onClick={() => handlePlay(choice.value)}
                            disabled={!!result}
                            size="lg"
                            className="flex flex-col h-24 w-24 p-2 border-2 bg-white hover:border-blue-500 hover:bg-blue-50 focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105"
                          >
                            <choice.icon
                              className={`w-8 h-8 mb-1 ${choice.color}`}
                            />
                            <span className="font-semibold text-gray-700">
                              {choice.label}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* AI의 선택 */}
                    <div className="flex flex-col items-center text-center">
                      <h3 className="text-2xl font-bold mb-4 text-gray-800">
                        AI
                      </h3>
                      <div className="w-32 h-32 rounded-full border-4 flex items-center justify-center bg-gray-50 mb-6 shadow-inner transition-all duration-300">
                        {aiChoice && (
                          <IconForChoice
                            choice={aiChoice}
                            className="w-16 h-16 text-red-500"
                          />
                        )}
                      </div>
                      <div className="h-24 flex items-center justify-center p-2 rounded-lg bg-amber-50 border border-amber-200 w-full max-w-xs">
                        <p className="text-gray-700 text-center">
                          <span className="font-bold">AI 심리 분석:</span>
                          <br />
                          {getAiMostFrequentChoiceHint()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="stats">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <h4 className="font-semibold text-gray-600 mb-1">총 게임 수</h4>
                    <p className="text-3xl font-bold">{stats.totalGames}</p>
                  </Card>
                  <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <h4 className="font-semibold text-gray-600 mb-1">승리</h4>
                    <p className="text-3xl font-bold text-green-600">{stats.wins}</p>
                  </Card>
                  <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <h4 className="font-semibold text-gray-600 mb-1">패배</h4>
                    <p className="text-3xl font-bold text-red-600">{stats.totalGames - stats.wins - stats.draws}</p>
                  </Card>
                  <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <h4 className="font-semibold text-gray-600 mb-1">무승부</h4>
                    <p className="text-3xl font-bold text-gray-500">{stats.draws}</p>
                  </Card>
                  <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <h4 className="font-semibold text-gray-600 mb-1">승률</h4>
                    <p className="text-3xl font-bold">
                      {stats.totalGames > 0
                        ? `${((stats.wins / stats.totalGames) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </Card>
                  <Card className="p-4 flex flex-col items-center justify-center text-center">
                    <h4 className="font-semibold text-gray-600 mb-1">최고 연승</h4>
                    <p className="text-3xl font-bold text-purple-600">{stats.maxWinStreak}</p>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="shop">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SKINS.map((skin) => {
                    const isUnlocked = stats.wins >= skin.winsRequired;
                    const isSelected = stats.selectedSkin === skin.id;

                    return (
                      <Card
                        key={skin.id}
                        onClick={() => isUnlocked && handleSelectSkin(skin.id)}
                        className={`p-4 border-2 transition-all duration-200 ${
                          isSelected
                            ? 'border-violet-500 bg-violet-50 shadow-lg'
                            : 'border-gray-200 bg-white'
                        } ${
                          isUnlocked
                            ? 'cursor-pointer hover:border-violet-400 hover:shadow-md'
                            : 'opacity-60 cursor-not-allowed bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-bold">{skin.name}</h4>
                            <Badge
                              variant={
                                skin.rarity === 'legendary' ? 'destructive' : 
                                skin.rarity === 'epic' ? 'default' : 
                                'outline'
                              }
                              className={`mt-1 
                                ${skin.rarity === 'legendary' ? 'bg-orange-500 text-white' : ''} 
                                ${skin.rarity === 'epic' ? 'bg-purple-500 text-white' : ''}
                              `}
                            >
                              {skin.rarity.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-right">
                            {isUnlocked ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <span>{isSelected ? '장착 중' : '보유 중'}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-gray-500">
                                <Lock className="w-5 h-5" />
                                <span>{skin.winsRequired}승 필요</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
              <TabsContent value="settings">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">게임 설정</h3>
                  <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-red-800">게임 데이터 초기화</h4>
                      <p className="text-sm text-red-600 mt-1">
                        모든 진행 상황(레벨, 재화, 스킨 등)이 영구적으로 삭제됩니다.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm('정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                          resetGame();
                        }
                      }}
                    >
                      초기화
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </main>
  );
}
