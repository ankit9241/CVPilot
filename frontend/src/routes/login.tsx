import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlaneTakeoff, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../store/auth-store";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — CVPilot" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleGoogle = () => {
    setState("loading");
    window.location.href = "http://localhost:4000/api/auth/google";
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <PlaneTakeoff className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">CVPilot</span>
          </Link>

          <h1 className="mt-10 text-[26px] font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground">
            Sign in to continue building your career story.
          </p>

          <div className="relative mt-10 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft">
            <AnimatePresence mode="wait">
              {state === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-border bg-background">
                      <GoogleIcon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-[15px] font-semibold tracking-tight">
                      Continue with Google
                    </h2>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      One click, no passwords. Recommended.
                    </p>
                  </div>
                  <Button
                    onClick={handleGoogle}
                    className="mt-6 h-10 w-full gap-2 text-[13px]"
                    variant="outline"
                  >
                    <GoogleIcon className="h-4 w-4" /> Continue with Google
                  </Button>
                  <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
                    By continuing you agree to CVPilot's{" "}
                    <a
                      href="#"
                      className="text-foreground underline decoration-border underline-offset-2"
                    >
                      Terms
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="text-foreground underline decoration-border underline-offset-2"
                    >
                      Privacy Policy
                    </a>
                    .
                  </p>
                </motion.div>
              )}

              {state === "loading" && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-6"
                >
                  <div className="relative grid h-12 w-12 place-items-center rounded-full border border-border bg-background">
                    <GoogleIcon className="h-5 w-5" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    />
                  </div>
                  <p className="mt-5 text-[13px] font-medium">Connecting to Google…</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Waiting for authorisation.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-[12px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Verifying identity
                  </div>
                </motion.div>
              )}

              {state === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success"
                  >
                    <Check className="h-6 w-6" strokeWidth={2.5} />
                  </motion.div>
                  <p className="mt-5 text-[13px] font-medium">Signed in successfully</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Taking you to your workspace…
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-8 text-center text-[13px] text-muted-foreground">
            New to CVPilot?{" "}
            <Link to="/onboarding" className="font-medium text-foreground hover:text-primary">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-sidebar lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--color-primary)_12%,transparent),transparent_60%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="max-w-md">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Resume intelligence
            </span>
            <h2 className="mt-6 text-[32px] font-semibold leading-tight tracking-tight">
              Precise resumes.
              <br />
              Quiet, considered workflow.
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
              CVPilot helps you tailor, analyse and manage every version of every resume in a calm,
              focused workspace.
            </p>
          </div>
          <blockquote className="max-w-md text-[13px] leading-relaxed text-muted-foreground">
            "It feels like Linear for job applications. Everything I need, nothing I don't."
            <span className="mt-2 block text-foreground">— Priya M., Product Designer</span>
          </blockquote>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.07z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
