import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollToPageTop } from "../lib/scroll";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    scrollToPageTop();
  }, [pathname]);

  return null;
}
