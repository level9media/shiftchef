import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // Don't show if already dismissed this session
    if (sessionStorage.getItem("pwa-install-dismissed")) return;

    // Detect iOS (Safari doesn't support beforeinstallprompt)
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !(window.navigator as { standalone?: boolean }).standalone;
    setIsIOS(ios);

    if (ios) {
      // Show iOS-specific instructions after 3s
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome: listen for the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  };

  if (!showBanner || dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px", // above bottom nav
        left: "1rem",
        right: "1rem",
        zIndex: 9999,
        background: "#1a1a1a",
        border: "1px solid #333",
        borderRadius: "16px",
        padding: "1rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        animation: "slideUp 0.3s ease-out",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* App Icon */}
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663450394445/5XtEwxhSav9aHUudDTD5pa/icon-192_c773814f.png"
        alt="ShiftChef"
        style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
          Install ShiftChef
        </div>

        {isIOS ? (
          <div style={{ color: "#aaa", fontSize: "0.8rem", lineHeight: 1.5 }}>
            Tap{" "}
            <Share size={13} style={{ display: "inline", verticalAlign: "middle", color: "#FF6B00" }} />
            {" "}then <strong style={{ color: "#fff" }}>Add to Home Screen</strong> to install the app.
          </div>
        ) : (
          <>
            <div style={{ color: "#aaa", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
              Add to your home screen for the full app experience.
            </div>
            <button
              onClick={handleInstall}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#FF6B00",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0.45rem 1rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Download size={14} />
              Install App
            </button>
          </>
        )}
      </div>

      <button
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          color: "#666",
          cursor: "pointer",
          padding: "0.25rem",
          flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        <X size={18} />
      </button>
    </div>
  );
}
