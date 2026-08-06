import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { TOUR_STEPS } from "@/components/tour/tourSteps";

interface TourContextValue {
  active: boolean;
  stepIndex: number;
  showWelcome: boolean;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  replay: () => void;
  dismissWelcome: () => void;
}

const TourContext = createContext<TourContextValue>({
  active: false,
  stepIndex: 0,
  showWelcome: false,
  start: () => {},
  next: () => {},
  prev: () => {},
  skip: () => {},
  replay: () => {},
  dismissWelcome: () => {},
});

// Upgrade path: mirror this into a `tour_completed_at` column on profiles for cross-device sync.
const storageKey = (userId: string) => `bdih:tour-completed:${userId}`;

export const TourProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);

  // First-time signed-in users see the welcome dialog once.
  useEffect(() => {
    if (loading || !user) return;
    try {
      if (!localStorage.getItem(storageKey(user.id))) setShowWelcome(true);
    } catch {
      /* storage unavailable */
    }
  }, [user, loading]);

  const complete = useCallback(() => {
    if (user) {
      try {
        localStorage.setItem(storageKey(user.id), new Date().toISOString());
      } catch {
        /* ignore */
      }
    }
  }, [user]);

  const goToStep = useCallback(
    (index: number) => {
      const step = TOUR_STEPS[index];
      if (!step) return;
      setStepIndex(index);
      if (location.pathname !== step.route) navigate(step.route);
    },
    [location.pathname, navigate]
  );

  const start = useCallback(() => {
    setShowWelcome(false);
    setActive(true);
    goToStep(0);
  }, [goToStep]);

  const next = useCallback(() => {
    if (stepIndex >= TOUR_STEPS.length - 1) {
      setActive(false);
      complete();
      return;
    }
    goToStep(stepIndex + 1);
  }, [stepIndex, goToStep, complete]);

  const prev = useCallback(() => {
    if (stepIndex > 0) goToStep(stepIndex - 1);
  }, [stepIndex, goToStep]);

  const skip = useCallback(() => {
    setActive(false);
    setShowWelcome(false);
    complete();
  }, [complete]);

  const replay = useCallback(() => {
    setShowWelcome(true);
  }, []);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    complete();
  }, [complete]);

  const value = useMemo(
    () => ({ active, stepIndex, showWelcome, start, next, prev, skip, replay, dismissWelcome }),
    [active, stepIndex, showWelcome, start, next, prev, skip, replay, dismissWelcome]
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useProductTour = () => useContext(TourContext);
