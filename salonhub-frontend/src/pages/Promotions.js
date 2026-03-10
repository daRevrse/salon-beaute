/**
 * Promotions Page - Redirects to Settings with Promotions tab
 * Promotions are now managed from Settings > Promotions
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Promotions = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to Settings with Promotions tab
    navigate("/settings?tab=promotions", { replace: true });
  }, [navigate]);

  return null;
};

export default Promotions;
