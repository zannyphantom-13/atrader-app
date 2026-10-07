import { TokenManager } from "@/utils/secure-store-adapter";
import { useEffect, useState } from "react";

const useAuthToken = () => {
  const [tk, setTk] = useState<string | null>(null);

  const refreshTk = async () => {
    const storedToken = await TokenManager.getToken();
    if (!storedToken) return;
    setTk(storedToken);
  };

  const clearTk = () => {
    setTk(null);
  };

  useEffect(() => {
    refreshTk();
  }, []);

  const isTokenPresentAndValid = Boolean(tk); // Ignores token expiration timestamp!

  return { atex: tk, refreshTk, setTk, clearTk, isTokenPresentAndValid };
};

export default useAuthToken;

