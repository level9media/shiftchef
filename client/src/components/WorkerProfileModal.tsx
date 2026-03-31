import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Star, ChefHat, Award, Briefcase, MapPin, Clock } from "lucide-react";

interface WorkerProfileModalProps {
  worker: {
    id: number;
    name?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    city?: string | null;
    skills?: string[] | null;
    experience?: string | null;
    rating?: number | null;
    totalShiftsCompleted?: number | null;
    totalEarned?: number | null;
    verificationStatus?: string | null;
    role?: string | null;
  } | null;
  open: boolean;
  onClose: () => void;
}

export function WorkerProfileModal({ worker, open, onClose }: WorkerProfileModalProps) {
  if (!worker) return null;

  const rating = worker.rating ?? 5.0;
  const shifts = worker.totalShiftsCompleted ?? 0;
  const skills: string[] = Array.isArray(worker.skills)
    ? worker.skills
    : typeof worker.skills === "string"
    ? (worker.skills as string).split(",").map((s: string) => s.trim()).filter(Boolean)
    : [];

  const initials = (worker.name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl bg-card border-border p-0 overflow-hidden">
        {/* Header gradient */}
        <div className="h-20 bg-gradient-to-br from-orange-500/30 via-orange-600/20 to-transparent" />

        <div className="px-5 pb-5 -mt-10">
          {/* Avatar */}
          <div className="flex items-end gap-3 mb-4">
            {worker.avatarUrl ? (
              <img
                src={worker.avatarUrl}
                alt={worker.name ?? "Worker"}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-background shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border-2 border-background shadow-lg flex items-center justify-center">
                <span className="text-xl font-black text-orange-400">{initials}</span>
              </div>
            )}
            <div className="pb-1">
              <h3 className="font-black text-foreground text-base leading-tight">
                {worker.name ?? "Worker"}
              </h3>
              {worker.city && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <MapPin size={10} />
                  {worker.city}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-muted/50 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-black text-foreground">{rating.toFixed(1)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Rating</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <ChefHat size={11} className="text-orange-400" />
                <span className="text-sm font-black text-foreground">{shifts}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Shifts</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Award size={11} className={worker.verificationStatus === "verified" ? "text-emerald-400" : "text-muted-foreground"} />
                <span className="text-[10px] font-bold text-foreground">
                  {worker.verificationStatus === "verified" ? "ID ✓" : "Pending"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Verified</p>
            </div>
          </div>

          {/* Bio */}
          {worker.bio && (
            <div className="mb-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">About</p>
              <p className="text-sm text-foreground leading-relaxed">{worker.bio}</p>
            </div>
          )}

          {/* Experience */}
          {worker.experience && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Briefcase size={11} className="text-muted-foreground" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Experience</p>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{worker.experience}</p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Clock size={11} className="text-muted-foreground" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Skills</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-[10px] rounded-full px-2 py-0.5 bg-orange-500/10 text-orange-300 border-orange-500/20"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* No bio/skills fallback */}
          {!worker.bio && !worker.experience && skills.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              This worker hasn't filled out their profile yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
