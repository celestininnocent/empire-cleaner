"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { siteConfig } from "@/config/site";
import { syncProfilePhoneFromUserMetadata } from "@/lib/profile-phone-sync";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [signupCooldownUntil, setSignupCooldownUntil] = useState<number>(0);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const redirect = redirectTo;
  const signupCooldownSeconds = Math.max(
    0,
    Math.ceil((signupCooldownUntil - nowMs) / 1000)
  );
  const signupCoolingDown = signupCooldownSeconds > 0;

  useEffect(() => {
    if (!signupCoolingDown) return;
    const t = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(t);
  }, [signupCoolingDown]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("signupCooldownUntilMs");
    const n = raw ? Number(raw) : 0;
    if (Number.isFinite(n) && n > Date.now()) {
      setSignupCooldownUntil(n);
      setNowMs(Date.now());
    }
  }, []);

  function formatSignUpError(error: { message: string; status?: number; code?: string }): string {
    const msg = error.message ?? "";
    const low = msg.toLowerCase();
    const isRateLimited =
      error.status === 429 ||
      error.code === "over_email_send_rate_limit" ||
      /rate limit|too many requests|security purposes|wait/i.test(low);

    if (isRateLimited) {
      return (
        "Too many signup emails were requested recently. Please wait about a minute and try again. " +
        "If you already have an account, use Sign in instead."
      );
    }
    if (/user already registered|already registered/i.test(low)) {
      return "This email already has an account. Use Sign in instead.";
    }
    return msg;
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const dbSignupHint =
        /database error saving new user/i.test(error.message)
          ? " This usually means Supabase migrations are behind (run migrations including `017_signup_trigger_backfill_columns.sql`)."
          : "";
      setMessage(`${error.message}${dbSignupHint}`);
      return;
    }
    await syncProfilePhoneFromUserMetadata(supabase);
    router.replace(redirect);
    router.refresh();
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    if (signupCoolingDown) {
      setMessage(`Please wait ${signupCooldownSeconds}s before requesting another signup email.`);
      return;
    }
    setLoading(true);
    setMessage(null);
    const phoneTrim = phone.trim();
    if (phoneTrim.replace(/\D/g, "").length < 10) {
      setLoading(false);
      setMessage("Enter a valid mobile number with area code (at least 10 digits).");
      return;
    }
    const supabase = createClient();
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          zip_code: zipCode.trim(),
          phone: phoneTrim,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    setLoading(false);
    const nextCooldown = Date.now() + 60_000;
    setSignupCooldownUntil(nextCooldown);
    setNowMs(Date.now());
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("signupCooldownUntilMs", String(nextCooldown));
    }
    if (error) {
      setMessage(formatSignUpError(error));
      return;
    }
    if (signUpData.session) {
      await syncProfilePhoneFromUserMetadata(supabase);
    }
    setMessage("Check your email to confirm, or sign in if confirmations are disabled.");
  }

  async function resetPassword() {
    if (!email.trim()) {
      setMessage("Enter your email first, then tap reset password.");
      return;
    }
    setResetLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    });
    setResetLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Password reset email sent. Check your inbox and spam folder.");
  }

  return (
    <Card className="border-border/80 shadow-lg">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Secure sign-in for homeowners, our crew, and staff ({siteConfig.businessName}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="mt-6">
            <form onSubmit={signIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || resetLoading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={loading || resetLoading}
                onClick={resetPassword}
              >
                {resetLoading ? <Loader2 className="size-4 animate-spin" /> : "Forgot password?"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup" className="mt-6">
            <form onSubmit={signUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-up">Email</Label>
                <Input
                  id="email-up"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-up">Password</Label>
                <Input
                  id="password-up"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip-up">ZIP code</Label>
                <Input
                  id="zip-up"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="e.g. 90210"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  pattern="[\d\-]{3,12}"
                  title="Enter a ZIP or ZIP+4"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone-up">{siteConfig.signupPhoneLabel}</Label>
                <Input
                  id="phone-up"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(503) 555-0100"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  minLength={10}
                  title="Enter a US mobile number with area code"
                />
                <p className="text-xs text-muted-foreground">{siteConfig.signupPhoneHint}</p>
                <p className="text-xs text-muted-foreground">{siteConfig.signupSmsConsent}</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading || signupCoolingDown}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : signupCoolingDown ? (
                  `Wait ${signupCooldownSeconds}s`
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        {message ? (
          <p className="mt-4 text-center text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
