import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/AppShell";
import { useState } from "react";
import { Zap, MapPin, Clock, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const SKILLS = [
  { value: "cook", label: "Cook" },
  { value: "sous_chef", label: "Sous Chef" },
  { value: "prep", label: "Prep Cook" },
  { value: "dishwasher", label: "Dishwasher" },
  { value: "cleaner", label: "Cleaner" },
  { value: "server", label: "Server" },
  { value: "bartender", label: "Bartender" },
  { value: "host", label: "Host" },
  { value: "manager", label: "Manager" },
];

const CITIES = ["Austin, TX", "Houston, TX", "Dallas, TX", "San Antonio, TX", "New York, NY"];

export default function WorkerAvailability() {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);

  const { data: myPosts, isLoading, refetch } = trpc.availability.mine.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const removeMutation = trpc.availability.remove.useMutation({
    onSuccess: () => {
      toast.success("Availability post removed");
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Availability</h1>
            <p className="text-sm text-muted-foreground">Let employers know you're ready to work</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} className="mr-1" />
            Post
          </Button>
        </div>

        {/* How it works */}
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">How it works</p>
              <p className="text-xs text-muted-foreground mt-1">
                Post your availability and it appears in the live feed. Employers can see you're ready and reach out directly. Posts expire after 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Post form */}
        {showForm && (
          <AvailabilityForm onSuccess={() => { setShowForm(false); refetch(); }} />
        )}

        {/* My posts */}
        <div>
          <h2 className="font-bold mb-3">Your Active Posts</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card rounded-2xl h-24 animate-pulse border border-border" />
              ))}
            </div>
          ) : !myPosts?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Zap size={32} className="text-muted-foreground opacity-40 mb-3" />
              <p className="font-semibold">No active posts</p>
              <p className="text-sm text-muted-foreground">Post your availability to get hired faster</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPosts.map((post: any) => (
                <div key={post.id} className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                          Available Now
                        </span>
                      </div>

                      {post.skills && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {JSON.parse(post.skills || "[]").map((s: string) => (
                            <span key={s} className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">
                              {SKILLS.find((sk) => sk.value === s)?.label ?? s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {post.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={11} />
                            {post.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                      </div>

                      {post.note && (
                        <p className="text-sm text-muted-foreground mt-2 italic">"{post.note}"</p>
                      )}
                    </div>

                    <button
                      onClick={() => removeMutation.mutate({ id: post.id })}
                      className="p-2 rounded-xl text-muted-foreground hover:text-destructive transition-colors ml-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function AvailabilityForm({ onSuccess }: { onSuccess: () => void }) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [city, setCity] = useState("Austin, TX");
  const [note, setNote] = useState("");

  const createMutation = trpc.availability.post.useMutation({
    onSuccess: () => {
      toast.success("You're live on the feed!");
      onSuccess();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-primary/30 p-4 space-y-4">
      <h3 className="font-bold">Post Availability</h3>

      <div>
        <label className="text-sm font-semibold mb-2 block">City</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold mb-2 block">Skills / Roles</label>
        <div className="grid grid-cols-3 gap-2">
          {SKILLS.map((s) => (
            <button
              key={s.value}
              onClick={() => toggleSkill(s.value)}
              className={cn(
                "py-2 px-2 rounded-xl text-xs font-medium transition-colors border",
                selectedSkills.includes(s.value)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-border"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold mb-1.5 block">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Available for doubles, experienced in fine dining..."
          className="w-full bg-secondary border border-border rounded-xl p-3 text-sm resize-none h-16 focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          maxLength={300}
        />
      </div>

      <Button
        className="w-full"
        disabled={createMutation.isPending}
        onClick={() => createMutation.mutate({ city, skills: selectedSkills, note: note || undefined })}
      >
        {createMutation.isPending ? "Posting..." : "Go Live Now"}
      </Button>
    </div>
  );
}
