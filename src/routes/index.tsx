import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  CheckCheck,
  KeyRound,
  Languages,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  ScrollText,
} from "lucide-react";

import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { DOCTOR } from "@/lib/demo-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Connexion médecin — 3awedhni عوضني" },
      {
        name: "description",
        content:
          "Espace médecin 3awedhni : validez vos consignes post-consultation et suivez les échanges de vos patients.",
      },
      { property: "og:title", content: "Connexion médecin — 3awedhni عوضني" },
      {
        property: "og:description",
        content: "Le médecin décide et valide. 3awedhni transmet, en Darja, Arabizi ou français.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

const DEMO_OTP = "246810";

function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState(DOCTOR.email);
  const [password, setPassword] = useState("demo-hackathon");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submitCredentials(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Renseignez votre email et votre mot de passe.");
      return;
    }
    setError(null);
    setStep("otp");
  }

  function submitOtp(e: FormEvent) {
    e.preventDefault();
    if (otp !== DEMO_OTP) {
      setError("Code incorrect. Utilisez le code de démonstration affiché.");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="hidden items-center gap-3 sm:flex">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
            Prototype · TECH4HEALTH
          </span>
          <span className="text-xs text-muted-foreground">Données 100 % fictives</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-6 shadow-card sm:p-10 lg:p-14">
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
                    <h1 className="text-2xl font-semibold">Espace médecin</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Connectez-vous pour valider vos consignes et suivre vos patients.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email professionnel</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl bg-card pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Mot de passe</Label>
                      <span className="text-xs text-muted-foreground">Démo pré-remplie</span>
                    </div>
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
                    Se connecter
                    <ArrowRight />
                  </Button>
                  <div className="flex items-start gap-3 rounded-2xl bg-primary-soft/70 p-3 text-xs text-primary-deep">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Double authentification obligatoire. Accès limité à vos propres dossiers.</p>
                  </div>
                </form>
              ) : (
                <form onSubmit={submitOtp} className="space-y-5">
                  <div>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-semibold">Vérification</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Saisissez le code à 6 chiffres envoyé à votre numéro vérifié.
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
                  <p className="rounded-xl border border-dashed border-primary/40 bg-card/70 px-3 py-2 text-xs text-muted-foreground">
                    Code de démonstration :{" "}
                    <span className="font-semibold tracking-widest text-primary-deep">
                      {DEMO_OTP}
                    </span>
                  </p>
                  {error && <p className="text-sm text-urgent">{error}</p>}
                  <Button type="submit" variant="hero" size="lg" className="w-full">
                    Accéder au tableau de bord
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
                    Retour
                  </button>
                </form>
              )}
            </div>

            {/* Right: product story, no doctor photo */}
            <div className="relative">
              <span className="eyebrow">Après la consultation, votre voix continue</span>
              <h2 className="mt-4 max-w-xl text-4xl font-bold leading-[1.1] sm:text-5xl">
                Vos consignes, <span className="text-gradient-primary">dans la langue</span> de vos
                patients
              </h2>
              <p className="mt-5 max-w-lg text-[0.97rem] leading-relaxed text-muted-foreground">
                Un vocal après chaque consultation. Vous relisez, vous validez. 3awedhni répond en
                Darja, Arabizi ou français — et oriente vers les urgences au moindre signe d'alerte.
              </p>

              <div className="relative mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
                {/* Chat preview */}
                <div className="animate-float-slow max-w-md rounded-3xl bg-card p-4 shadow-card">
                  <div className="mb-3 flex items-center gap-2 border-b pb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink">Assistant 3awedhni</div>
                      <div className="text-[0.7rem] text-success">consignes validées · v2</div>
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
                        <CheckCheck className="h-3 w-3" /> Source : consigne INS-001-A
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

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Stethoscope,
              title: "Médecin aux commandes",
              text: "Aucune consigne publiée sans votre validation.",
            },
            {
              icon: Languages,
              title: "Darja d'abord",
              text: "Arabe, Arabizi, français et mélanges compris.",
            },
            {
              icon: ScrollText,
              title: "Traçable",
              text: "Chaque réponse cite sa consigne et sa version.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-4 rounded-2xl bg-card p-5 shadow-soft">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
