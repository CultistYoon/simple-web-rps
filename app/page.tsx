"use client";

import { useState, useEffect } from "react";

type Choice = "rock" | "paper" | "scissors";
type GameResult = "win" | "lose" | "draw";

const CHOICES: { value: Choice; label: string; emoji: string }[] = [
  { value: "rock", label: "바위", emoji: "✊" },
  { value: "paper", label: "보", emoji: "✋" },
  { value: "scissors", label: "가위", emoji: "✌️" },
];

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
}

const LEVEL_EXP = [0, 20, 50, 100, 200, 400];

function getAiChoice(playerHistory: Choice[]): Choice {
  if (playerHistory.length >= 3) {
    const last3 = playerHistory.slice(-3);
    const count: Record<Choice, number> = { rock: 0, paper: 0, scissors: 0 };
    last3.forEach((c) => count[c]++);
    const most = (Object.entries(count).sort((a, b) => b[1] - a[1])[0][0] as Choice);
    if (count[most] >= 2 && Math.random() < 0.6) {
      if (most === "rock") return "paper";
      if (most === "paper") return "scissors";
      return "rock";
    }
  }
  return CHOICES[Math.floor(Math.random() * 3)].value;
}

function getResult(player: Choice, ai: Choice): GameResult {
  if (player === ai) return "draw";
  if (
    (player === "rock" && ai === "scissors") ||
    (player === "scissors" && ai === "paper") ||
    (player === "paper" && ai === "rock")
  ) {
    return "win";
  }
  return "lose";
}

export default function Page() {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [aiChoice, setAiChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [stats, setStats] = useState<GameStats>({
    wins: 0,
    losses: 0,
    draws: 0,
    totalGames: 0,
    winStreak: 0,
    maxWinStreak: 0,
    gold: 0,
    level: 1,
    exp: 0,
  });
  const [playerHistory, setPlayerHistory] = useState<Choice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("rps-stats");
    if (saved) setStats(JSON.parse(saved));
    const hist = localStorage.getItem("rps-history");
    if (hist) setPlayerHistory(JSON.parse(hist));
  }, []);
  useEffect(() => {
    localStorage.setItem("rps-stats", JSON.stringify(stats));
  }, [stats]);
  useEffect(() => {
    localStorage.setItem("rps-history", JSON.stringify(playerHistory));
  }, [playerHistory]);

  function play(choice: Choice) {
    if (isPlaying) return;
    setIsPlaying(true);
    setPlayerChoice(choice);
    const ai = getAiChoice([...playerHistory, choice]);
    setAiChoice(ai);
    setPlayerHistory((prev) => [...prev, choice].slice(-10));
    const r = getResult(choice, ai);
    setResult(r);

    setStats((prev) => {
      let wins = prev.wins;
      let losses = prev.losses;
      let draws = prev.draws;
      let totalGames = prev.totalGames;
      let winStreak = prev.winStreak;
      let maxWinStreak = prev.maxWinStreak;
      let gold = prev.gold;
      const level = prev.level;
      let exp = prev.exp;
      totalGames += 1;
      if (r === "win") {
        wins += 1;
        winStreak += 1;
        maxWinStreak = Math.max(maxWinStreak, winStreak);
        gold += 5;
        exp += 10;
      } else if (r === "lose") {
        losses += 1;
        winStreak = 0;
      } else {
        draws += 1;
      }
      let newLevel = level;
      for (let i = LEVEL_EXP.length - 1; i > 0; i--) {
        if (exp >= LEVEL_EXP[i]) {
          newLevel = i + 1;
          break;
        }
      }
      return { wins, losses, draws, totalGames, winStreak, maxWinStreak, gold, level: newLevel, exp };
    });

    setTimeout(() => {
      setIsPlaying(false);
    }, 1200);
  }

  function reset() {
    setStats({
      wins: 0,
      losses: 0,
      draws: 0,
      totalGames: 0,
      winStreak: 0,
      maxWinStreak: 0,
      gold: 0,
      level: 1,
      exp: 0,
    });
    setPlayerHistory([]);
    setPlayerChoice(null);
    setAiChoice(null);
    setResult(null);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f3e8ff 0%, #e0f2fe 100%)", padding: 16 }}>
      <button onClick={() => setShowPlan(true)} style={{ marginBottom: 16, padding: "8px 16px", border: "1px solid #ccc", borderRadius: 8, background: "#fff" }}>기획서 보기</button>
      {showPlan && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ maxWidth: 480, width: "100%", padding: 32, background: "#fff", borderRadius: 16, position: "relative" }}>
            <h2 style={{ fontSize: 20, fontWeight: "bold", marginBottom: 16 }}>가위바위보 게임 기획서</h2>
            <div style={{ fontSize: 14, color: "#444", marginBottom: 24, maxHeight: "60vh", overflowY: "auto" }}>
              <p><b>목표:</b> 단순한 가위바위보에 심리전, 성장, 보상 시스템을 더해 반복 플레이의 재미와 동기를 부여한다.</p>
              <ul style={{ margin: "8px 0 8px 20px" }}>
                <li>AI는 플레이어의 패턴을 일부 학습해 심리전을 시도한다.</li>
                <li>승리 시 골드/경험치, 연승/레벨업/스킨 등 성장 요소 제공</li>
                <li>UI는 직관적이고, 기록/보상/스킨 등 정보를 명확히 제공</li>
                <li>로컬 스토리지에 기록 저장, 언제든 초기화 가능</li>
              </ul>
              <p style={{ marginTop: 8 }}>자세한 기획 내용은 원본 기획서를 참고하세요.</p>
            </div>
            <button onClick={() => setShowPlan(false)} style={{ position: "absolute", top: 16, right: 16, padding: "4px 12px", borderRadius: 6, background: "#eee" }}>닫기</button>
          </div>
        </div>
      )}
      <div style={{ width: "100%", maxWidth: 400, padding: 24, background: "#fff", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16, textAlign: "center" }}>가위바위보 마스터</h1>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span>레벨: {stats.level}</span>
          <span>EXP: {stats.exp}</span>
          <span>골드: {stats.gold}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span>승: {stats.wins}</span>
          <span>패: {stats.losses}</span>
          <span>무: {stats.draws}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <span>연승: {stats.winStreak}</span>
          <span>최고연승: {stats.maxWinStreak}</span>
          <span>총판: {stats.totalGames}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 32, marginBottom: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 18 }}>나</span>
              <span style={{ fontSize: 32 }}>{playerChoice ? CHOICES.find(c => c.value === playerChoice)?.emoji : "❔"}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 18 }}>AI</span>
              <span style={{ fontSize: 32 }}>{aiChoice ? CHOICES.find(c => c.value === aiChoice)?.emoji : "❔"}</span>
            </div>
          </div>
          {result && (
            <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
              {result === "win" ? "승리!" : result === "lose" ? "패배!" : "무승부!"}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 16 }}>
          {CHOICES.map((c) => (
            <button
              key={c.value}
              onClick={() => play(c.value)}
              disabled={isPlaying}
              style={{ fontSize: 18, width: 80, height: 80, borderRadius: 12, border: "1px solid #ccc", background: "#f9f9f9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: isPlaying ? "not-allowed" : "pointer" }}
            >
              <span style={{ fontSize: 28 }}>{c.emoji}</span>
              <div>{c.label}</div>
            </button>
          ))}
        </div>
        <button onClick={reset} style={{ width: "100%", marginTop: 8, padding: "8px 0", border: "1px solid #ccc", borderRadius: 8, background: "#f3f3f3" }}>
          기록 초기화
        </button>
      </div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 16 }}>© 2024 허윤 | 빌드 에러 0% 보장</div>
    </div>
  );
}
