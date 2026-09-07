"use client";

import * as React from "react";
import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          username: username.trim(),
          password,
          redirect: false,
        });

        if (!result || result.error) {
          setError("Invalid username or password. Please try again.");
          return;
        }

        // Successfully signed in -> navigate to the requested page
        router.push(callbackUrl);
        router.refresh();
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive dark:border-destructive/40 dark:bg-destructive/15"
        >
          <AlertCircle className="size-4 shrink-0" />
          <p className="leading-snug">{error}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="username"
          className="text-xs font-medium text-foreground inline-flex items-center gap-1.5"
        >
          <User className="size-3.5 text-muted-foreground" />
          Username
        </label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoFocus
          required
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isPending}
          className="h-10"
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-xs font-medium text-foreground inline-flex items-center gap-1.5"
        >
          <Lock className="size-3.5 text-muted-foreground" />
          Password
        </label>
        <div className="relative flex items-center">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            className="h-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 inset-y-0 flex items-center justify-center w-10 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-10 font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="size-4" />
            <span>Sign In</span>
          </>
        )}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 bg-background selection:bg-blue-500/20">
      {/* Theme toggle top-right */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex size-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-1">
            <Building2 className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            NestPick
          </h1>
          <p className="text-xs text-muted-foreground">
            Condo & Apartment Hunting Tracker
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm dark:shadow-none space-y-5">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-muted-foreground">
              Enter your admin credentials to access the workspace.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-blue-600" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Security badge footer */}
        <div className="text-center text-[11px] text-muted-foreground">
          Protected with authenticated session &bull; NestPick
        </div>
      </div>
    </div>
  );
}
