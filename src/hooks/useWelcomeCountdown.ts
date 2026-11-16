import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const WELCOME_DURATION = 10_000;
const FADE_DURATION = 500;

export default function useWelcomeCountdown() {
  const navigate = useNavigate();
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [isLeaving, setIsLeaving] = useState(false);
  const leaving = useRef(false);
  const countdownTimer = useRef<number | undefined>(undefined);
  const finishTimer = useRef<number | undefined>(undefined);
  const navigationTimer = useRef<number | undefined>(undefined);

  const clearCountdown = useCallback(() => {
    window.clearInterval(countdownTimer.current);
    window.clearTimeout(finishTimer.current);
    countdownTimer.current = undefined;
    finishTimer.current = undefined;
  }, []);

  const skip = useCallback(() => {
    // Guard repeated clicks before React renders the disabled button.
    if (leaving.current) return;
    leaving.current = true;
    clearCountdown();
    setIsLeaving(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    navigationTimer.current = window.setTimeout(() => {
      navigate("/home", { replace: true });
    }, reducedMotion ? 0 : FADE_DURATION);
  }, [clearCountdown, navigate]);

  useEffect(() => {
    const deadline = performance.now() + WELCOME_DURATION;
    leaving.current = false;
    // Derive the countdown from elapsed time so delayed ticks do not extend the wait.
    countdownTimer.current = window.setInterval(() => {
      setSecondsRemaining(Math.max(0, Math.ceil((deadline - performance.now()) / 1000)));
    }, 250);
    finishTimer.current = window.setTimeout(() => {
      setSecondsRemaining(0);
      skip();
    }, WELCOME_DURATION);
    // Also handles React StrictMode's initial setup/cleanup cycle.
    return () => {
      clearCountdown();
      window.clearTimeout(navigationTimer.current);
      navigationTimer.current = undefined;
    };
  }, [clearCountdown, skip]);

  return { secondsRemaining, isLeaving, skip };
}
