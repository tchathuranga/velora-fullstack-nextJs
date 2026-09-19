"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { fetchJson } from "@/lib/fetchJson";
import type { DemoUser } from "@/lib/data/users";

export default function AdminLoginPage() {
  const { loginAdmin } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<DemoUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson<DemoUser[]>("/data/admins.json")
      .then(setAdmins)
      .catch(() => setError("Couldn't load admin accounts. Please refresh and try again."))
      .finally(() => setAdminsLoading(false));
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = loginAdmin(admins, username, password);
    if (!user) {
      setError("Invalid admin credentials.");
      return;
    }
    router.push("/admin/sellers");
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">
            <ShieldCheck size={22} />
          </span>
          <h1 className="text-xl font-semibold text-slate-900">Admin sign-in</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Restricted access. This is separate from the buyer/seller login.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Username"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
          />
          <Input
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="••••••••"
          />

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" variant="secondary" disabled={adminsLoading}>
            Sign in
          </Button>
        </form>

      </div>
    </div>
  );
}
