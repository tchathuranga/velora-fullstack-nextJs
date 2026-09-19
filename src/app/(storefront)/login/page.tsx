"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { fetchJson } from "@/lib/fetchJson";
import type { DemoUser } from "@/lib/data/users";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ identifier: "", password: "" });

  useEffect(() => {
    fetchJson<DemoUser[]>("/data/users.json")
      .then(setUsers)
      .catch(() => setError("Couldn't load demo accounts. Please refresh and try again."))
      .finally(() => setUsersLoading(false));
  }, []);

  const validateLogin = () => {
    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();
    const nextErrors = { identifier: "", password: "" };

    if (!trimmedIdentifier) {
      nextErrors.identifier = "Enter your username or email address.";
    } else if (trimmedIdentifier.length < 3) {
      nextErrors.identifier = "Username or email must be at least 3 characters long.";
    }

    if (!trimmedPassword) {
      nextErrors.password = "Enter your password.";
    } else if (trimmedPassword.length < 6) {
      nextErrors.password = "Password must be at least 6 characters long.";
    }

    setFieldErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLogin()) {
      return;
    }

    const user = login(users, identifier, password);
    if (!user) {
      setError("Invalid username or password. Please check your credentials and try again.");
      return;
    }

    router.push(user.role === "seller" ? `/store/${user.storeSlug}` : "/account");
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            <LogIn size={22} />
          </span>
          <h1 className="text-xl font-semibold text-slate-900">Log in to EDEELZ.lk</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Sign in to continue shopping and manage your account.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <Input
            label="Username or email address"
            required
            autoComplete="username"
            value={identifier}
            error={fieldErrors.identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setError("");
              setFieldErrors((prev) => ({ ...prev, identifier: "" }));
            }}
            placeholder="e.g. ayesha"
          />
          <Input
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            error={fieldErrors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
              setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder="••••••••"
          />

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" fullWidth size="lg" disabled={usersLoading}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="link-blue font-medium">
            Sign up
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          Want to sell?{" "}
          <Link href="/signup?next=/sell/register" className="link-blue font-medium">
            Become a seller
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-[var(--color-muted-foreground)]">
          <Link href="/admin/login" className="hover:text-[var(--color-muted)] hover:underline">
            Admin sign-in
          </Link>
        </p>
      </div>
    </div>
  );
}
