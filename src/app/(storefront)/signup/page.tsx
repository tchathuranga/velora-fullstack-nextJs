"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { PageLoader } from "@/components/ui/PageLoader";

function SignupForm() {
  const { registerAsBuyer } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextRoute = searchParams.get("next") ?? "/account";
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ name: "", username: "", email: "", password: "" });

  const validateSignup = () => {
    const nextErrors = {
      name: "",
      username: "",
      email: "",
      password: "",
    };

    const trimmedName = name.trim();
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      nextErrors.name = "Please enter your full name.";
    }

    if (trimmedUsername.length < 3) {
      nextErrors.username = "Username must be at least 3 characters long.";
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(trimmedUsername)) {
      nextErrors.username = "Use letters, numbers, dots, underscores or hyphens only.";
    }

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters long.";
    }

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSignup()) {
      return;
    }

    registerAsBuyer(name.trim() || "New Buyer", username.trim(), email.trim(), password);
    router.push(nextRoute);
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            <UserPlus size={22} />
          </span>
          <h1 className="text-xl font-semibold text-slate-900">Create your buyer account</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Save your address, track orders and message sellers.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Full name"
            required
            value={name}
            error={errors.name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
            placeholder="Your name"
          />
          <Input
            label="Username"
            required
            autoComplete="username"
            value={username}
            error={errors.username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((prev) => ({ ...prev, username: "" }));
            }}
            placeholder="Choose a username"
          />
          <Input
            label="Email address"
            type="email"
            required
            autoComplete="email"
            value={email}
            error={errors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            placeholder="you@example.com"
          />
          <Input
            label="Create a password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            error={errors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: "" }));
            }}
            placeholder="••••••••"
          />
          <Button type="submit" fullWidth size="lg">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="link-blue font-medium">
            Log in
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          Want to sell instead?{" "}
          <Link href="/signup?next=/sell/register" className="link-blue font-medium">
            Become a seller
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SignupForm />
    </Suspense>
  );
}
