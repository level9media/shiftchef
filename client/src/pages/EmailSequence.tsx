import AppShell from "@/components/AppShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { ArrowLeft, Mail, Clock, TrendingUp, Copy, CheckCircle, Users, CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const EMAILS = [
  {
    id: 1,
    label: "Email 1 — Welcome",
    delay: "Send immediately on signup",
    sendAfterDays: 0,
    subject: "Welcome to ShiftChef — Your First Shift is 2 Hours Away",
    preview: "You're now connected to Austin's fastest-growing kitchen staffing platform.",
    body: `Hi [First Name],

Welcome to ShiftChef — the fastest way to fill kitchen shifts in Austin.

Here's how it works in 3 steps:
1. Post a job (takes 2 minutes) — pick the role, set your pay rate, and choose your shift time
2. Workers apply within minutes — you see their rating, experience, and reliability score
3. Accept the best fit — payment is held securely until the shift is complete

Your first post is on us. Use code FIRSTSHIFT at checkout for a free single post.

[POST YOUR FIRST JOB NOW →]

Questions? Reply to this email — we're real people in Austin.

— The ShiftChef Team`,
    color: "border-primary/30 bg-primary/5",
    iconColor: "text-primary",
    badgeColor: "bg-primary/20 text-primary",
  },
  {
    id: 2,
    label: "Email 2 — Subscription Pitch",
    delay: "Send 2 days after signup",
    sendAfterDays: 2,
    subject: "The $99/Month Math That Makes Restaurant Owners Smile",
    preview: "One no-show costs you $300+. Here's how to never deal with that again.",
    body: `Hi [First Name],

Quick question: how much does a no-show cost your restaurant?

Between the scramble to cover, the food waste, the stressed team, and the lost revenue — most operators tell us it's $300–500 per incident.

ShiftChef's $99/month unlimited plan means:
✓ Post as many shifts as you need, any time
✓ Access our full pool of verified Austin kitchen workers
✓ Fill shifts in under 2 hours on average
✓ Pay only after the shift is completed — no risk

One covered shift pays for the entire month.

[UPGRADE TO UNLIMITED →]

Already posting? Here's how to get the most out of ShiftChef:
- Set a competitive pay rate (10–15% above Craigslist for faster fills)
- Add a detailed description — workers apply faster when they know exactly what to expect
- Enable "Permanent Potential" to attract workers who want to grow with your team

— The ShiftChef Team`,
    color: "border-orange-500/30 bg-orange-500/5",
    iconColor: "text-orange-400",
    badgeColor: "bg-orange-500/20 text-orange-400",
  },
  {
    id: 3,
    label: "Email 3 — Social Proof Close",
    delay: "Send 5 days after signup",
    sendAfterDays: 5,
    subject: "3 Austin Restaurant Operators Share What Changed",
    preview: "Real results from ShiftChef users in your city.",
    body: `Hi [First Name],

Three things we hear from Austin restaurant operators every week:

"We filled a Saturday dinner sous chef spot in 90 minutes." 
— East Austin bistro, 40 seats

"Our dishwasher called out at 4pm on a Friday. ShiftChef had someone there by 6pm."
— South Lamar bar & kitchen

"We hired two of our best line cooks through ShiftChef. Started as temp, went permanent."
— North Loop neighborhood restaurant

ShiftChef works because:
→ Workers are rated and reviewed by real employers (not self-reported)
→ Payment is held in escrow — you only pay after the shift is done
→ The 10% platform fee means we only make money when you make money

Ready to stop scrambling for coverage?

[POST A JOB NOW →]
[GO UNLIMITED FOR $99/MO →]

If there's anything we can do to help you get your first shift filled, reply to this email.

— Rob & The ShiftChef Team
Austin, TX`,
    color: "border-emerald-500/30 bg-emerald-500/5",
    iconColor: "text-emerald-400",
    badgeColor: "bg-emerald-500/20 text-emerald-400",
  },
];

function EmailStatusDot({ sent }: { sent: boolean }) {
  return sent
    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
    : <Circle className="w-4 h-4 text-white/20 shrink-0" />;
}

function EmployerEmailRow({
  employer,
  onMark,
  isPending,
}: {
  employer: {
    id: number;
    name: string | null;
    email: string | null;
    email1SentAt: Date | null;
    email2SentAt: Date | null;
    email3SentAt: Date | null;
    createdAt: Date;
  };
  onMark: (userId: number, step: number) => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const daysSinceSignup = Math.floor((Date.now() - new Date(employer.createdAt).getTime()) / 86400000);

  const emailStatus = [
    { step: 1, sentAt: employer.email1SentAt, label: "Welcome" },
    { step: 2, sentAt: employer.email2SentAt, label: "Pitch" },
    { step: 3, sentAt: employer.email3SentAt, label: "Social Proof" },
  ];

  const sentCount = emailStatus.filter(e => e.sentAt).length;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-3.5 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <span className="text-xs font-black text-foreground">{(employer.name || "?")[0].toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{employer.name || "Unknown"}</p>
          <p className="text-[10px] text-muted-foreground truncate">{employer.email || "No email"}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {emailStatus.map(e => (
            <EmailStatusDot key={e.step} sent={!!e.sentAt} />
          ))}
          <span className="text-[9px] font-bold text-muted-foreground ml-1">{sentCount}/3</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground ml-1" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-1" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-3.5 pb-3.5 pt-3 space-y-2">
          <p className="text-[10px] text-muted-foreground">
            Signed up {daysSinceSignup === 0 ? "today" : `${daysSinceSignup}d ago`} · {new Date(employer.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
          {emailStatus.map(e => (
            <div key={e.step} className="flex items-center gap-2">
              <EmailStatusDot sent={!!e.sentAt} />
              <div className="flex-1 min-w-0">
                <span className="text-xs text-foreground font-semibold">Email {e.step}: {e.label}</span>
                {e.sentAt && (
                  <span className="text-[10px] text-muted-foreground ml-2">
                    Sent {new Date(e.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
              {!e.sentAt && (
                <button
                  onClick={() => onMark(employer.id, e.step)}
                  disabled={isPending}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50 shrink-0"
                >
                  Mark Sent
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmailSequence() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<number | null>(1);
  const [copied, setCopied] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "tracking">("templates");

  const { data: employerStatuses, refetch } = trpc.onboarding.getEmployerEmailStatuses.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const markSentMutation = trpc.onboarding.markEmailSent.useMutation({
    onSuccess: () => {
      toast.success("Email marked as sent");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  function copyEmail(id: number, body: string) {
    navigator.clipboard.writeText(body).then(() => {
      setCopied(id);
      toast.success("Email copied to clipboard");
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
          <Link href="/feed" className="mt-4 text-primary text-sm font-bold hover:underline">Back to Feed</Link>
        </div>
      </AppShell>
    );
  }

  const totalEmployers = employerStatuses?.length ?? 0;
  const fullyOnboarded = employerStatuses?.filter(e => e.email1SentAt && e.email2SentAt && e.email3SentAt).length ?? 0;
  const needsEmail = employerStatuses?.filter(e => !e.email1SentAt).length ?? 0;

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
            <h1 className="text-xl font-black text-foreground">Email Automation</h1>
            <p className="text-xs text-muted-foreground">3-email employer onboarding drip sequence</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Employers", value: totalEmployers, icon: Users, color: "text-blue-400" },
            { label: "Fully Sent", value: fullyOnboarded, icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Need Email 1", value: needsEmail, icon: AlertCircle, color: "text-orange-400" },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-3 text-center">
              <stat.icon className={cn("w-4 h-4 mx-auto mb-1", stat.color)} />
              <p className="text-xl font-black text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-secondary rounded-2xl p-1">
          {(["templates", "tracking"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-bold transition-all capitalize",
                activeTab === tab
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === "templates" ? "Email Templates" : "Employer Tracking"}
            </button>
          ))}
        </div>

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            {/* Intro card */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">How to Use This</p>
              <p className="text-sm text-foreground leading-relaxed">
                Copy these emails into <strong>GoHighLevel</strong>, Mailchimp, or any email tool.
                Trigger Email 1 on signup, Email 2 at Day 2, Email 3 at Day 5.
                Replace <code className="bg-secondary px-1 rounded text-primary text-xs">[First Name]</code> with your merge tag.
              </p>
            </div>

            {EMAILS.map((email) => (
              <div key={email.id} className={cn("rounded-2xl border p-4", email.color)}>
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
                        Day {email.sendAfterDays === 0 ? "0" : `+${email.sendAfterDays}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={9} className="text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">{email.delay}</p>
                    </div>
                  </div>
                  <span className="text-muted-foreground text-lg">{expanded === email.id ? "−" : "+"}</span>
                </button>

                {expanded === email.id && (
                  <div className="mt-4 space-y-3">
                    <div className="bg-background/60 rounded-xl p-3 border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Subject Line</p>
                      <p className="text-sm font-semibold text-foreground">{email.subject}</p>
                    </div>
                    <div className="bg-background/60 rounded-xl p-3 border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Preview Text</p>
                      <p className="text-sm text-foreground">{email.preview}</p>
                    </div>
                    <div className="bg-background/60 rounded-xl p-3 border border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Email Body</p>
                      <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed">{email.body}</pre>
                    </div>
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
                Add 3 email actions: Day 0, Day 2, Day 5.
                Use <code className="bg-secondary px-1 rounded text-primary text-xs">{"{{contact.first_name}}"}</code> for the name merge tag.
              </p>
            </div>
          </div>
        )}

        {/* Tracking Tab */}
        {activeTab === "tracking" && (
          <div className="space-y-3">
            <div className="bg-card rounded-2xl border border-border p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">How Tracking Works</p>
              <p className="text-sm text-foreground leading-relaxed">
                After sending each email manually, click <strong>"Mark Sent"</strong> to log it here. 
                This tracks your drip sequence progress per employer and timestamps each send.
              </p>
            </div>

            {!employerStatuses || employerStatuses.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-bold">No employers yet</p>
                <p className="text-sm text-muted-foreground mt-1">Employer accounts will appear here once they sign up.</p>
              </div>
            ) : (
              employerStatuses.map((employer) => (
                <EmployerEmailRow
                  key={employer.id}
                  employer={employer}
                  onMark={(userId, step) => markSentMutation.mutate({ userId, emailStep: step })}
                  isPending={markSentMutation.isPending}
                />
              ))
            )}
          </div>
        )}

      </div>
    </AppShell>
  );
}
