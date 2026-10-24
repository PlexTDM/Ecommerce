import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export interface ScrollToTopProps {
  children?: ReactNode;
}

const ScrollToTop = ({ children }: ScrollToTopProps) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return <>{children ?? null}</>;
};

export default ScrollToTop;
