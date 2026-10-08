import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const sessionId = new URLSearchParams(location.hash.slice(1)).get("session_id");
    api
      .post("/auth/session", {}, { headers: { "X-Session-ID": sessionId } })
      .then((r) => navigate("/admin", { replace: true, state: { user: r.data } }))
      .catch(() => navigate("/admin", { replace: true, state: { authError: true } }));
  }, [location.hash, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08080a]">
      <Loader2 className="h-6 w-6 animate-spin text-lime-300" />
    </div>
  );
}
