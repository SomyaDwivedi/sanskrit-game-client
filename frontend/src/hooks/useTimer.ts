import { useState, useEffect, useRef } from "react";
import { formatTimer } from "../utils/gameHelper";

export const useTimer = (isActive: boolean = false) => {
  const [timer, setTimer] = useState("00:00");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTimer(formatTimer(elapsed));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const resetTimer = () => {
    setTimer("00:00");
    startTimeRef.current = Date.now();
  };

  return { timer, resetTimer };
};

export const useCountdownTimer = (
  initialSeconds: number,
  onTick?: (secondsLeft: number) => void,
  onComplete?: () => void
) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = (seconds: number = initialSeconds) => {
    setTimeLeft(seconds);
    setIsActive(true);
  };

  const stop = () => {
    setIsActive(false);
    setTimeLeft(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const pause = () => {
    setIsActive(false);
  };

  const resume = () => {
    if (timeLeft > 0) {
      setIsActive(true);
    }
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;

          if (onTick) {
            onTick(newTime);
          }

          if (newTime <= 0) {
            setIsActive(false);
            if (onComplete) {
              onComplete();
            }
            return 0;
          }

          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft, onTick, onComplete]);

  return {
    timeLeft,
    isActive,
    start,
    stop,
    pause,
    resume,
  };
};
