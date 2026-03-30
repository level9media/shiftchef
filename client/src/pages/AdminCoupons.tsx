import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Tag, Download, Copy, Check, Plus, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdminCoupons() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [count, setCount] = useState(500);
  const [prefix, setPrefix] = useState("SHIFT");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const { data: coupons, isLoading, refetch } = trpc.coupons.list.useQuery(
    { limit: 500 },
    { enabled: user?.role === "admin" }
  );

  const bulkGenMutation = trpc.coupons.bulkGenerate.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} codes generated!`);
      setGeneratedCodes(data.codes);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  if (user?.role !== "admin") {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </AppShell>
    );
  }

  const handleBulkGenerate = () => {
    bulkGenMutation.mutate({
      count,
      type: "free_post",
      value: 1,
      maxUses: 1,
      expiresAt: expiresAt || undefined,
      notes: notes || `Bulk generated ${new Date().toLocaleDateString()}`,
      prefix,
    });
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(generatedCodes.join("\n")).then(() => {
      setCopied(true);
      toast.success("All codes copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadCSV = () => {
    const codes = generatedCodes.length > 0 ? generatedCodes : (coupons?.map((c) => c.code) ?? []);
    if (!codes.length) { toast.error("No codes to export"); return; }
    const csv = ["Code,Type,Value,MaxUses,UsedCount,CreatedAt"]
      .concat(
        (coupons ?? []).map((c) =>
          `${c.code},${c.type},${c.value},${c.maxUses},${c.usedCount ?? 0},${c.createdAt}`
        )
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shiftchef-coupons-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${codes.length} codes`);
  };

  const usedCount = coupons?.filter((c) => (c.usedCount ?? 0) > 0).length ?? 0;
  const unusedCount = (coupons?.length ?? 0) - usedCount;

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 py-4 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/admin")}
            className="w-10 h-10 rounded-2xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-xl font-black text-foreground">Coupon Manager</h1>
            <p className="text-xs text-muted-foreground">Generate and manage free job posting codes</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Codes", value: coupons?.length ?? 0, color: "text-foreground" },
            { label: "Unused", value: unusedCount, color: "text-emerald-400" },
            { label: "Redeemed", value: usedCount, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
              <p className={cn("text-2xl font-black", s.color)}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Bulk Generate Form */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            Bulk Generate Free Post Codes
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Count (max 500)</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(e) => setCount(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Code Prefix</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase().slice(0, 8))}
                  placeholder="SHIFT"
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Expires At (optional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Austin launch batch"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>

            <Button
              className="w-full rounded-xl font-bold btn-glow"
              onClick={handleBulkGenerate}
              disabled={bulkGenMutation.isPending}
            >
              {bulkGenMutation.isPending ? (
                <><Loader2 size={14} className="mr-2 animate-spin" /> Generating {count} codes...</>
              ) : (
                <><Plus size={14} className="mr-2" /> Generate {count} Free Post Codes</>
              )}
            </Button>
          </div>
        </div>

        {/* Generated Codes Preview */}
        {generatedCodes.length > 0 && (
          <div className="bg-card border border-emerald-500/30 rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {generatedCodes.length} Codes Generated
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyAll}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy All"}
                </button>
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <Download size={12} />
                  Download CSV
                </button>
              </div>
            </div>
            <div className="bg-secondary rounded-xl p-3 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-1">
                {generatedCodes.slice(0, 20).map((code) => (
                  <span key={code} className="text-[11px] font-mono text-muted-foreground">{code}</span>
                ))}
                {generatedCodes.length > 20 && (
                  <span className="text-[11px] text-muted-foreground col-span-2 pt-1">
                    + {generatedCodes.length - 20} more codes (download CSV for full list)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Export All Button */}
        {(coupons?.length ?? 0) > 0 && (
          <Button
            variant="outline"
            className="w-full rounded-xl mb-4"
            onClick={handleDownloadCSV}
          >
            <Download size={14} className="mr-2" />
            Export All {coupons?.length} Codes as CSV
          </Button>
        )}

        {/* Coupon List */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
            All Codes
          </p>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : !coupons?.length ? (
            <div className="text-center py-8">
              <Ticket size={32} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No codes yet. Generate some above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {coupons.slice(0, 100).map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center justify-between bg-card border rounded-xl px-3 py-2.5",
                    (c.usedCount ?? 0) > 0 ? "border-border opacity-60" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Tag size={11} className={cn((c.usedCount ?? 0) > 0 ? "text-muted-foreground" : "text-primary")} />
                    <span className="text-xs font-mono text-foreground">{c.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.notes && <span className="text-[10px] text-muted-foreground hidden sm:block">{c.notes}</span>}
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      (c.usedCount ?? 0) > 0
                        ? "bg-secondary text-muted-foreground"
                        : "bg-emerald-500/20 text-emerald-400"
                    )}>
                      {(c.usedCount ?? 0) > 0 ? "Used" : "Active"}
                    </span>
                  </div>
                </div>
              ))}
              {coupons.length > 100 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Showing 100 of {coupons.length} codes. Download CSV for full list.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
