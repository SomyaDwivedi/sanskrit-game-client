import { useState, useEffect, useRef } from "react";
import AudioManager from "../services/AudioManager";

export const useAudio = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioManagerRef = useRef<AudioManager | null>(null);

  useEffect(() => {
    if (!audioManagerRef.current) {
      audioManagerRef.current = new AudioManager();
    }
  }, []);

  const toggleSound = () => {
    if (audioManagerRef.current) {
      const newState = audioManagerRef.current.toggleSound();
      setSoundEnabled(newState);
      return newState;
    }
    return soundEnabled;
  };

  const playSound = (soundName: string) => {
    if (audioManagerRef.current) {
      audioManagerRef.current.playSound(soundName);
    }
  };

  const startBgMusic = () => {
    if (audioManagerRef.current) {
      audioManagerRef.current.startBgMusic();
    }
  };

  const stopBgMusic = () => {
    if (audioManagerRef.current) {
      audioManagerRef.current.stopBgMusic();
    }
  };

  const playTimerTick = (secondsLeft: number) => {
    if (audioManagerRef.current) {
      audioManagerRef.current.playTimerTick(secondsLeft);
    }
  };

  return {
    soundEnabled,
    toggleSound,
    playSound,
    startBgMusic,
    stopBgMusic,
    playTimerTick,
  };
};
