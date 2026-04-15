"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  getOrCreateUserId,
  canPlayToday,
  saveGameResult,
  getLastPlayedTime,
} from "@/utils/localStorage";
import CelebrityGridItem from "./CelebrityGridItem";

export default function TriviaGame() {
  const [gameState, setGameState] = useState("loading");
  const [gridCelebrities, setGridCelebrities] = useState([]);
  const [target, setTarget] = useState(null);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [factsRemaining, setFactsRemaining] = useState(5);
  // Map: celebrity name -> 'normal' | 'check' | 'cross'
  const [celebStates, setCelebStates] = useState({});
  const [roundsPlayed, setRoundsPlayed] = useState(1);
  const [message, setMessage] = useState("");
  const [canPlay, setCanPlay] = useState(true);
  const [timeUntilNextGame, setTimeUntilNextGame] = useState(null);

  // Initialize game
  // Extracted for retry support
  const initializeGame = async () => {
    const playableToday = canPlayToday();
    setCanPlay(playableToday);

    if (!playableToday) {
      const lastPlayed = getLastPlayedTime();
      const nextPlayTime = new Date(lastPlayed);
      nextPlayTime.setDate(nextPlayTime.getDate() + 1);
      setTimeUntilNextGame(nextPlayTime);
      setGameState("cooldown");
      return;
    }

    try {
      setGameState("loading");
      const response = await fetch("/api/trivia/game");

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (
        !data ||
        !data.target ||
        !data.target.facts ||
        data.target.facts.length === 0
      ) {
        throw new Error("Invalid game data received");
      }

      setGridCelebrities(data.gridCelebrities);
      setTarget(data.target);
      setCurrentFactIndex(0);
      setFactsRemaining(data.factsRemaining);
      setGameState("playing");
      setMessage(data.target.facts[0]);
    } catch (error) {
      console.error("Failed to initialize game:", error);
      setGameState("error");
      setMessage("Failed to load game. Please check your internet connection or try again. " + error.message);
    }
  };

  useEffect(() => {
    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cycles: normal -> check -> cross -> normal
  const handleCelebrityClick = (celebName) => {
    setCelebStates((prev) => {
      const current = prev[celebName] || "normal";
      let next;
      if (current === "normal") next = "check";
      else if (current === "check") next = "cross";
      else next = "normal";
      // Only allow one checkmark at a time
      if (next === "check") {
        // Remove any other checkmarks
        const newStates = Object.fromEntries(
          Object.entries(prev).map(([k, v]) => [
            k,
            v === "check" ? "normal" : v,
          ]),
        );
        return { ...newStates, [celebName]: "check" };
      }
      return { ...prev, [celebName]: next };
    });
  };

  const handleNextFact = async () => {
    if (currentFactIndex < target.facts.length - 1) {
      const nextIndex = currentFactIndex + 1;
      setCurrentFactIndex(nextIndex);
      setMessage(target.facts[nextIndex]);
      setFactsRemaining(target.facts.length - nextIndex - 1);
      setRoundsPlayed(roundsPlayed + 1);
    } else {
      setMessage("No more facts available! You must now guess.");
    }
  };

  // Find the currently checkmarked celebrity (if any)
  const checkedCelebrity = Object.entries(celebStates).find(
    ([_, v]) => v === "check",
  );
  const checkedName = checkedCelebrity ? checkedCelebrity[0] : null;

  const handleGuess = async () => {
    if (!checkedName) return;
    const isCorrect = checkedName === target.name;

    if (isCorrect) {
      setMessage(
        `Correct! It was ${target.name}! Score: ${roundsPlayed} round(s)`,
      );
      setGameState("won");

      // Save to local storage
      const userId = getOrCreateUserId();
      saveGameResult({
        targetName: target.name,
        roundsPlayed,
        correct: true,
        userId,
      });

      // Save to database
      try {
        await fetch("/api/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            correctAnswers: 1,
            roundsPlayed,
            targetName: target.name,
          }),
        });
      } catch (error) {
        console.error("Failed to save stats to database:", error);
      }
    } else {
      setMessage(`Incorrect! It was ${target.name}. Better luck next time!`);
      setGameState("lost");

      // Save to local storage
      const userId = getOrCreateUserId();
      saveGameResult({
        targetName: target.name,
        roundsPlayed,
        correct: false,
        userId,
      });

      // Save to database
      try {
        await fetch("/api/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            correctAnswers: 0,
            roundsPlayed,
            targetName: target.name,
          }),
        });
      } catch (error) {
        console.error("Failed to save stats to database:", error);
      }
    }
  };

  const handlePlayAgain = () => {
    window.location.reload();
  };

  if (gameState === "cooldown") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">
            Cooldown Active
          </h1>
          <p className="text-gray-700 mb-4">
            You&apos;ve already played today! Come back tomorrow for a new
            challenge.
          </p>
          <p className="text-sm text-gray-500">
            Next game available: {timeUntilNextGame?.toLocaleString()}
          </p>
        </div>
      </div>
    );
  }

  if (gameState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-2xl font-bold text-indigo-600">
          Loading game...
        </div>
      </div>
    );
  }

  if (gameState === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-4">{message}</p>
          <button
            onClick={initializeGame}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="w-screen flex flex-col items-center">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <h1 className="script-heading">Act Tw(h)o?</h1>
        </div>

        {/* Fact Display - only show during play, not after win/loss */}
        {gameState === "playing" && (
          <div className="script-panel mb-8 flex flex-col items-center">
            <div className="mb-8 w-full flex flex-col items-center gap-2">
              <div className="script-scene">SCENE {roundsPlayed}</div>
              <div className="script-action">
                {factsRemaining > 0
                  ? `${factsRemaining} clue${factsRemaining > 1 ? "s" : ""} left`
                  : "Final Guess!"}
              </div>
            </div>
            <div className="script-dialogue" aria-live="polite">{message}</div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-wrap mt-8 w-full justify-center">
              {factsRemaining > 0 && (
                <button onClick={handleNextFact} className="script-btn" aria-label="Show next clue">
                  <span>Next Line</span>
                </button>
              )}
              <button
                onClick={handleGuess}
                disabled={!checkedName}
                className="script-btn"
                aria-label="Reveal actor and check answer"
              >
                <span>Reveal Actor</span>
              </button>
            </div>
          </div>
        )}

        {/* Grid or Selection View */}

        {gameState === "playing" && (
          <div className="script-panel mt-8">
            <div className="mb-6 text-center">
              <div className="script-action">(The cast appears on stage.)</div>
              <div className="script-action">
                (Click once to guess, twice to cross out, three times to reset.)
              </div>
            </div>
            <div className="w-full flex justify-center">
              <div
                className="grid grid-cols-5 gap-2 h-full"
                style={{ minHeight: "0", width: "90vw", maxWidth: "1200px" }}
              >
                {gridCelebrities.map((celebName, idx) => (
                  <CelebrityGridItem
                    key={idx}
                    name={celebName}
                    state={celebStates[celebName] || "normal"}
                    onToggle={() => handleCelebrityClick(celebName)}
                    isDisabled={false}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Remove old selecting state, handled by checkmark now */}

        {(gameState === "won" || gameState === "lost") && (
          <div className="script-panel p-12 text-center flex flex-col items-center mt-8">
            <div className="script-scene">
              {gameState === "won" ? "CURTAIN CALL" : "FADE OUT"}
            </div>
            <div className="script-dialogue" aria-live="polite">{message}</div>
            <button onClick={handlePlayAgain} className="script-btn" aria-label="Reload the game">
              Play Again Tomorrow
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
