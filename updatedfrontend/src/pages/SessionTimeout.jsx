import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const IDLE_TIMEOUT = 15 * 60 * 1000; // 2 minutes (120 seconds)
const WARNING_TIME = IDLE_TIMEOUT - 60 * 1000; // 1 minute before logout (60 seconds)

const SessionTimeout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Memoize dependencies to prevent unnecessary re-renders
  const memoizedLogout = useCallback(logout, [logout]);
  const memoizedNavigate = useCallback(navigate, [navigate]);

  const logoutTimeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(60); // Countdown starts at 60 seconds
  const hasWarnedRef = useRef(false); // Track if warning has been shown

  const clearTimers = useCallback(() => {
    if (logoutTimeoutRef.current) {
      clearTimeout(logoutTimeoutRef.current);
      logoutTimeoutRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setShowCountdown(false);
    setRemainingSeconds(60);
    hasWarnedRef.current = false;
  }, []);

  const startCountdown = useCallback(() => {
    if (hasWarnedRef.current) return; // Prevent multiple warnings
    hasWarnedRef.current = true;
    setShowCountdown(true);
    setRemainingSeconds(60); // Reset countdown to 60 seconds
    toast.warning("You will be logged out soon due to inactivity.");

    countdownIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        const newSeconds = prev - 1;
        if (newSeconds <= 0) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setShowCountdown(false);
          return 0;
        }
        return newSeconds;
      });
    }, 1000); // Update every second
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();

    // Set logout timer
    logoutTimeoutRef.current = setTimeout(() => {
      clearTimers();
      memoizedLogout(); // Clear auth state
      toast.info("You were logged out due to inactivity.");
      memoizedNavigate("/logout", { replace: true }); // Navigate to logout page
    }, IDLE_TIMEOUT);

    // Set warning timer (1 minute before logout)
    warningTimeoutRef.current = setTimeout(() => {
      startCountdown();
    }, WARNING_TIME);
  }, [clearTimers, startCountdown, memoizedLogout, memoizedNavigate]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];
    const handleActivity = () => {
      resetTimer();
    };
    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimer(); // Start on mount

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimers(); // Clean on unmount
    };
  }, [resetTimer]);

  return (
    <>
      {showCountdown && (
        <div
          className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg text-sm flex items-center"
          style={{ zIndex: 1000 }}
        >
          <svg
            className="h-5 w-5 text-yellow-600 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Logging out in {remainingSeconds} second{remainingSeconds !== 1 ? "s" : ""}...
          </span>
        </div>
      )}
    </>
  );
};

export default SessionTimeout;