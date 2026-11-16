import { useCallback, useEffect } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { findNavigationItem } from "../components/layout/navigation";
import { createPlatformHistory } from "../utils/platformHistory";

const platformHistory = createPlatformHistory(pathname => !!findNavigationItem(pathname));

export function useTrackPlatformHistory() {
  const location = useLocation();
  const action = useNavigationType();
  useEffect(() => {
    platformHistory.record({ index: window.history.state?.idx, key: location.key, pathname: location.pathname }, action);
  }, [location.key, location.pathname, action]);
}

export function usePlatformBack() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(() => {
    if (platformHistory.canGoBack(window.history.state?.idx, location.key)) navigate(-1);
    else navigate("/home", { replace: true });
  }, [navigate, location.key]);
}
