import AppShell from "@/components/AppShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { ArrowLeft, Mail, Clock, TrendingUp, Copy, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const EMAILS = [
  {
    id: 1,
    label: "Email 1 — Welcome",
    delay: "Sent immediately on signup",
    subject: "Welcome to ShiftChef — Your first shift is one post away 🍳",
    preview: "You're in. Here's how to fill your next open shift in under 2 hours.",
    body: `Hi [First Name],

Welcome to ShiftChef — Austin's fastest way to fill kitchen and FOH shifts on demand.

Here's how it works in 3 steps:

1. Post your open shift (takes 60 seconds)
2. Workers apply — you review and accept
3. Shift is confirmed. Payment is held securely until completion.

Your first post is ready to go. Click below to post your first shift now.

[POST A SHIFT →]

Questions? Reply to this email — we're a small team and we actually respond.

— The ShiftChef Team
Austin, TX`,
    color: "border-primary/30 bg-primary/5",
    iconColor: "text-primary",
    badgeColor: "bg-primary/20 text-primary",
  },
  {
    id: 2,
    label: "Email 2 — First Post Guide",
    delay: "Sent 24 hours after signup (if no post yet)",
    subject: "Still need kitchen help? Here's what works on ShiftChef",
    preview: "The 3 things top employers do to get applicants fast.",
    body: `Hi [First Name],

We noticed you haven't posted your first shift yet. No worries — here's what the top employers on ShiftChef do to get 5+ applicants within an hour:

✅ Set a competitive pay rate
Austin kitchen workers are averaging $18–22/hr for cooks and $15–18/hr for prep. Match or beat that and you'll see applications fast.

✅ Be specific about the role
"Cook needed" gets fewer applicants than "Line Cook — Saturday dinner service, 4pm–11pm, Eastside location." Specificity builds trust.

✅ Turn on Permanent Potential
Workers who are looking to settle in will prioritize your shift if they see it could become a full-time role. One toggle = more serious applicants.

Ready to post? It takes 60 seconds.

[POST MY FIRST SHIFT →]

— The ShiftChef Team`,
    color: "border-orange-500/30 bg-orange-500/5",
    iconColor: "text-orange-400",
    badgeColor: "bg-orange-500/20 text-orange-400",
  },
  {
    id: 3,
    label: "Email 3 — Subscription Pitch",
    delay: "Sent 72 hours after signup (or after first shift completes)",
    subject: "Unlimited shifts for $99/month — here's the math",
    preview: "If you post more than 3 shifts a month, the subscription pays for itself.",
    body: `Hi [First Name],

Quick math for you:

Single post: $35
3-post bundle: $75
Unlimited monthly: $99

If you're running a restaurant, you're filling more than 3 shifts a month. The $99/month plan gives you:

✅ Unlimited job posts
✅ Real-time access to the worker feed
✅ Priority placement in the live feed
✅ Cancel anytime

One no-show costs you more than $99 in lost revenue. ShiftChef pays for itself the first time you fill a last-minute shift.

[UPGRADE TO UNLIMITED →]

Already on the plan? Forward this to another manager who's dealing with staffing headaches.

— The ShiftChef Team
P.S. We're adding new features every week. Reply and tell us what would make your life easier.`,
    color: "border-emerald-500/30 bg-emerald-500/5",
    iconColor: "text-emerald-400",
    badgeColor: "bg-emerald-500/20 text-emerald-400",
  },
];

export default function EmailSequence() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<number | null>(1);
  const [copied, setCopied] = useState<number | null>(null);

  function copyEmail(id: number, body: string) {
    navigator.clipboard.writeText(body).then(() => {
      setCopied(id);
      toast.success("Email copy copied to clipboard");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  if (user?.role !== "admin") {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <Mail size={40} className="text-muted-foreground mb-4" />
          <p className="font-black text-xl text-foreground">Admin Only</p>
          <p className="text-sm text-muted-foreground mt-2">This page is for platform administrators.</p>
          <Link href="/feed" className="mt-4 text-primary text-sm font-bold hover:underline">← Back to Feed</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 pb-10 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <button className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
              <ArrowLeft size={14} className="text-muted-foreground" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-black text-foreground">Employer Email Sequence</h1>
            <p className="text-xs text-muted-foreground">3-email onboarding drip — copy &amp; paste into your email tool</p>
          </div>
        </div>

        {/* Intro card */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">How to Use This</p>
          <p className="text-sm text-foreground leading-relaxed">
            Copy these emails into <strong>GoHighLevel</strong>, Mailchimp, or any email automation tool.
            Trigger Email 1 on signup, Email 2 at 24h if no post, Email 3 at 72h.
            Replace <code className="bg-secondary px-1 rounded text-primary text-xs">[First Name]</code> with a merge tag from your platform.
          </p>
        </div>

        {/* Email cards */}
        {EMAILS.map((email) => (
          <div key={email.id} className={cn("rounded-2xl border p-4", email.color)}>
            {/* Header row */}
            <button
              className="w-full flex items-center gap-3 text-left"
              onClick={() => setExpanded(expanded === email.id ? null : email.id)}
            >
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                email.id === 1 ? "bg-primary/20" : email.id === 2 ? "bg-orange-500/20" : "bg-emerald-500/20"
              )}>
                <Mail size={14} className={email.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm text-foreground">{email.label}</span>
                  <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded-full", email.badgeColor)}>
                    #{email.id}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock size={9} className="text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">{email.delay}</p>
                </div>
              </div>
              <span className="text-muted-foreground text-lg">{expanded === email.id ? "−" : "+"}</span>
            </button>

            {/* Expanded content */}
            {expanded === email.id && (
              <div className="mt-4 space-y-3">
                {/* Subject line */}
                <div className="bg-background/60 rounded-xl p-3 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Subject Line</p>
                  <p className="text-sm font-semibold text-foreground">{email.subject}</p>
                </div>

                {/* Preview text */}
                <div className="bg-background/60 rounded-xl p-3 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Preview Text</p>
                  <p className="text-sm text-foreground">{email.preview}</p>
                </div>

                {/* Body */}
                <div className="bg-background/60 rounded-xl p-3 border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Email Body</p>
                  <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{email.body}</pre>
                </div>

                {/* Copy button */}
                <button
                  onClick={() => copyEmail(email.id, `Subject: ${email.subject}\nPreview: ${email.preview}\n\n${email.body}`)}
                  className={cn(
                    "w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                    copied === email.id
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-foreground/10 text-foreground hover:bg-foreground/20"
                  )}
                >
                  {copied === email.id ? (
                    <><CheckCircle size={14} /> Copied!</>
                  ) : (
                    <><Copy size={14} /> Copy Full Email</>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* GHL tip */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-primary" />
            <p className="text-xs font-bold text-primary uppercase tracking-wider">GoHighLevel Setup</p>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            In GHL, create a <strong>Workflow</strong> with trigger: <em>Contact Created</em> + tag <em>employer</em>.
            Add 3 email actions with the delays above. Use <code className="bg-secondary px-1 rounded text-primary text-xs">{"{{contact.first_name}}"}</code> for the name merge tag.
            Set the workflow to stop if the contact posts a job (tag: <em>has_posted</em>).
          </p>
        </div>

      </div>
    </AppShell>
  );
}
