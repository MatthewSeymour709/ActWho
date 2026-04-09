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

}  