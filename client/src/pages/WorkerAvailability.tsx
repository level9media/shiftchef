import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Zap, MapPin, Clock, Trash2, Plus, ChefHat } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const SKILLS = [
  { value: "cook", label: "Cook", emoji: "👨‍🍳" },
  { value: "sous_chef", label: "Sous Chef", emoji: "🍴" },
  { value: "prep", label: "Prep Cook", emoji: "🥗" },
  { value: "dishwasher", label: "Dishwasher", emoji: "🫧" },
  { value: "cleaner", label: "Cleaner", emoji: "🧹" },
  { value: "server", label: "Server", emoji: "🍽️" },
  { value: "bartender", label: "Bartender", emoji: "🍸" },
  { value: "host", label: "Host", emoji: "🤝" },
  { value: "manager", label: "Manager", emoji: "📋" },
];

const CITIES = ["Austin, TX", "Houston, TX", "Dallas, TX", "San Antonio, TX", "New York, NY", "Chicago, IL"];

export default function WorkerAvailability() {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data: myPosts, isLoading, refetch } = trpc.availability.mine.useQuery(
    undefined, { enabled: isAuthenticated }
  );

  const removeMutation = trpc.availability.remove.useMutation({
    onSuccess: () => { toast.success("Post removed"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-10">

        {/* ── Hero Banner ───────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-5">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-primary" strokeWidth={2.5} />
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Availability Mode</p>
            </div>
            <p className="text-xl font-black text-foreground">Let employers find you</p>
            <p className="text-xs text-muted-foreground mt-1">
              Post your availability and get hired directly from the live feed. Posts expire in 24 hours.
            </p>
          </div>
          {!showForm && (
            <Button
              className="w-full mt-4 h-11 font-bold rounded-2xl btn-glow relative z-10"
              onClick={() => setShowForm(true)}
            >
              <Plus size={15} className="mr-2" strokeWidth={2.5} />
              Post Availability
            </Button>
          )}
        </div>

        {/* ── Post Form ─────────────────────────────────────────────────── */}
        {showForm && (
          <AvailabilityForm onSuccess={() => { setShowForm(false); refetch(); }} onCancel={() => setShowForm(false)} />
        )}

        {/* ── Active Posts ──────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Your Active Posts</p>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card rounded-2xl border border-border p-4 h-20 animate-pulse" />
              ))}
            </div>
          ) : !myPosts?.length ? (
            <div className="flex flex-col items-center py-10 text-center">
              <ChefHat size={32} className="text-muted-foreground/30 mb-3" />
              <p className="font-bold text-foreground text-sm">No active posts</p>
              <p className="text-xs text-muted-foreground mt-1">Post your availability to appear in the feed</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myPosts.map((post: any) => {
                const skills: string[] = (() => {
                  try { return JSON.parse(post.skills || "[]"); } catch { return []; }
                })();
                return (
                  <div key={post.id} className="bg-card rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-bold text-emerald-400">LIVE</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {skills.map((s: string) => {
                            const sk = SKILLS.find((x) => x.value === s);
                            return (
                              <span key={s} className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {sk?.emoji} {sk?.label ?? s}
                              </span>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {post.city && (
                            <span className="flex items-center gap-1">
                              <MapPin size={10} /> {post.city}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {post.note && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">"{post.note}"</p>
                        )}
                      </div>
                      <button
                        onClick={() => removeMutation.mutate({ id: post.id })}
                        className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors flex-shrink-0 ml-3"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function AvailabilityForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [city, setCity] = useState("Austin, TX");
  const [note, setNote] = useState("");

  const createMutation = trpc.availability.post.useMutation({
    onSuccess: () => { toast.success("You're live on the feed!"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-primary/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-black text-foreground">New Availability Post</p>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>

      {/* City */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">City *</p>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Skills */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Skills / Roles *</p>
        <div className="grid grid-cols-3 gap-2">
          {SKILLS.map((s) => (
            <button
              key={s.value}
              onClick={() => toggleSkill(s.value)}
              className={cn(
                "py-2.5 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1",
                selectedSkills.includes(s.value)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-border"
              )}
            >
              <span className="text-base">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Note (optional)</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Available for doubles, experienced in fine dining..."
          className="w-full bg-secondary border border-border rounded-xl p-3 text-sm resize-none h-16 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground text-foreground"
          maxLength={300}
        />
      </div>

      <Button
        className="w-full h-12 font-bold rounded-2xl btn-glow"
        disabled={createMutation.isPending || selectedSkills.length === 0}
        onClick={() => createMutation.mutate({ city, skills: selectedSkills, note: note || undefined })}
      >
        {createMutation.isPending ? (
          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
        ) : "Go Live Now"}
      </Button>
    </div>
  );
}
