import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCheck,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Physician Login — 3awedhni عوضني" },
      {
        name: "description",
        content:
          "3awedhni physician portal: approve post-consultation instructions and monitor patient exchanges.",
      },
      { property: "og:title", content: "Physician Login — 3awedhni عوضني" },
      {
        property: "og:description",
        content: "The physician decides and validates. 3awedhni delivers in Darja, Arabizi, or French.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const ACCESS_OTP = "246810";

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("motdepasse");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submitCredentials(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your professional email and password.");
      return;
    }
    setError(null);
    setStep("otp");
  }

  function submitOtp(e: FormEvent) {
    e.preventDefault();
    if (otp !== ACCESS_OTP) {
      setError("Incorrect code. Please try again or request a new code.");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
        <Logo />
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pb-10 sm:px-6">
        <section className="relative w-full overflow-hidden rounded-[2rem] bg-gradient-hero p-6 shadow-card sm:p-10 lg:p-14">
          {/* decorative shapes */}
          <div className="pointer-events-none absolute -left-24 bottom-[-6rem] h-72 w-72 rounded-full bg-primary/10" />
          <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-80 w-80 rounded-full bg-card/50" />
          <div className="pointer-events-none absolute bottom-10 right-8 h-24 w-24 rounded-full bg-gradient-primary opacity-70" />
          <div className="pointer-events-none absolute bottom-40 right-40 h-6 w-6 rounded-full bg-primary/40" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-16">
            {/* Login card */}
            <div className="glass rounded-3xl p-7 shadow-card sm:p-8">
              {step === "credentials" ? (
                <form onSubmit={submitCredentials} className="space-y-5">
                  <div>
                    <h1 className="text-2xl font-semibold">Physician Portal</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Sign in to review and approve instructions and monitor patient follow-ups.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Professional Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        placeholder="doctor@hospital.tn"
                        autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl bg-card pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 rounded-xl bg-card pl-10"
                      />
                    </div>
                  </div>
                  {error && <p className="text-sm text-urgent">{error}</p>}
                  <Button type="submit" variant="hero" size="lg" className="w-full">
                    Sign In
                    <ArrowRight />
                  </Button>
                  <div className="flex items-start gap-3 rounded-2xl bg-primary-soft/70 p-3 text-xs text-primary-deep">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Two-factor authentication required. Access strictly limited to your authorized records.</p>
                  </div>
                </form>
              ) : (
                <form onSubmit={submitOtp} className="space-y-5">
                  <div>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-semibold">Verification</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Enter the 6-digit verification code sent to your registered mobile device.
                    </p>
                  </div>
                  <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                    <InputOTPGroup className="gap-2">
                      {Array.from({ length: 6 }, (_, i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-12 w-11 rounded-xl border bg-card text-lg font-semibold first:rounded-xl"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  {error && <p className="text-sm text-urgent">{error}</p>}
                  <Button type="submit" variant="hero" size="lg" className="w-full">
                    Access Dashboard
                    <ArrowRight />
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("credentials");
                      setError(null);
                    }}
                    className="w-full text-center text-sm text-muted-foreground hover:text-primary"
                  >
                    Back
                  </button>
                </form>
              )}
            </div>

            {/* Right: product story */}
            <div className="relative">
              <span className="eyebrow">Continuous Patient Care</span>
              <h2 className="mt-4 max-w-xl text-4xl font-bold leading-[1.1] sm:text-5xl">
                You might think your doctor isn't there.{" "}
                <span className="text-gradient-primary">Rethink about that.</span>
              </h2>
              <p className="mt-5 max-w-lg text-[0.97rem] leading-relaxed text-muted-foreground">
                A voice note after each consultation. You review, you approve. 3awedhni responds in
                Darja, Arabizi, or French — and routes to emergency care at the slightest red flag.
              </p>

              <div className="relative mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
                {/* Chat preview */}
                <div className="animate-float-slow max-w-md rounded-3xl bg-card p-4 shadow-card">
                  <div className="mb-3 flex items-center gap-2 border-b pb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink">3awedhni Assistant</div>
                      <div className="text-[0.7rem] text-success">validated instructions · v2</div>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-sm">
                    <div
                      lang="ar"
                      dir="rtl"
                      className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-sm bg-chat-out px-3 py-2"
                    >
                      ولدي مازال يشكي من حلقو، شنوة نعمل؟
                    </div>
                    <div className="w-fit max-w-[90%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-foreground">
                      Kammel eddwa lel ekher w a3tih machroubet dafya…
                      <div className="mt-1 flex items-center gap-1 text-[0.68rem] text-primary-deep">
                        <CheckCheck className="h-3 w-3" /> Source: instruction INS-001-A
                      </div>
                    </div>
                  </div>
                </div>
                <p className="self-end font-script text-4xl leading-none text-primary sm:pb-6 sm:text-5xl">
                  Tbibek
                  <br />
                  m3ak, dima ♡
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
