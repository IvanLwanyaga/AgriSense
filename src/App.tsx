import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import OtpVerificationPage from "./pages/OtpVerificationPage";
import EarlyWarningDashboard from "./components/EarlyWarningDashboard";
import PublicLanding from "./components/PublicLanding";
import { logoutUser } from "./services/authservice";

import { useAuth } from "./context/useAuth";
import type { AppPage } from "./types/navigation";

type AuthView = "login" | "register" | "reset" | null;

const APP_PAGES: AppPage[] = [
  "dashboard",
  "bctb-assessment",
  "ai-assistant",
  "help-room",
  "farms",
  "weather",
  "recommendations",
  "activities",
  "alerts",
  "map",
  "extension",
  "governance",
  "staff-applications",
  "admin-accounts",
  "coffee-passport",
  "cooperative-surveillance",
  "subscription",
  "organization-management",
  "settings",
];
const APP_PAGE_SET = new Set<string>(APP_PAGES);

function isAppPage(value: string | null): value is AppPage {
  return value !== null && APP_PAGE_SET.has(value);
}

function App() {
  const { user, loading, profile } = useAuth();

  const [authView, setAuthView] = useState<AuthView>(null);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [regSuccessMsg, setRegSuccessMsg] = useState("");
  const [requiresExplicitLogin, setRequiresExplicitLogin] = useState(false);
  const [restoredPageUserId, setRestoredPageUserId] = useState<string | null>(null);

  const [page, setPage] = useState<AppPage>("dashboard");

  useEffect(() => {
    if (!user?.uid) {
      setPage("dashboard");
      setRestoredPageUserId(null);
      return;
    }

    let savedPage: string | null = null;
    try {
      savedPage = localStorage.getItem(`agrisense_last_page_${user.uid}`);
    } catch (error) {
      console.warn("Unable to restore the previous workspace page.", error);
    }

    setPage(isAppPage(savedPage) ? savedPage : "dashboard");
    setRestoredPageUserId(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    if (
      !user?.uid
      || loading
      || profile?.uid !== user.uid
      || restoredPageUserId !== user.uid
    ) {
      return;
    }

    try {
      localStorage.setItem(`agrisense_last_page_${user.uid}`, page);
    } catch (error) {
      console.warn("Unable to save the current workspace page.", error);
    }
  }, [user?.uid, profile?.uid, loading, page, restoredPageUserId]);

  useEffect(() => {
    if (!authView) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAuthView(null);
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [authView]);

  if (loading && authView !== "register") {
    return <div className="auth-loading">Loading AgriSense...</div>;
  }

  if (user && !requiresExplicitLogin && authView !== "register") {
    // Enforce email OTP verification before granting dashboard access
    if (!user.emailVerified) {
      return (
        <OtpVerificationPage
          onVerified={() => {
            setPage("dashboard");
          }}
        />
      );
    }

    if (!profile || profile.uid !== user.uid) {
      return (
        <main className="auth-loading" role="alert">
          <section className="auth-dialog">
            <h1>Account profile unavailable</h1>
            <p>Your workspace could not be loaded. Please sign out and try again.</p>
            <button type="button" className="auth-submit" onClick={() => void logoutUser()}>
              Sign out
            </button>
          </section>
        </main>
      );
    }

    if (!profile || profile.uid !== user.uid) {
      return (
        <main className="auth-loading" role="alert">
          <section className="auth-dialog">
            <h1>Account profile unavailable</h1>
            <p>Your workspace could not be loaded. Please sign out and try again.</p>
            <button type="button" className="auth-submit" onClick={() => void logoutUser()}>
              Sign out
            </button>
          </section>
        </main>
      );
    }

    if (profile?.status === "PENDING" || profile?.status === "INACTIVE") {
      return (
        <main className="auth-loading" role="status">
          <section className="auth-dialog">
            <h1>{profile.status === "PENDING" ? "Account awaiting approval" : "Account access is inactive"}</h1>
            <p>
              {profile.status === "PENDING"
                ? "Your email is verified. An AgriSense administrator must approve your requested role before workspace access is enabled."
                : "This account is currently inactive. Contact an AgriSense administrator for assistance."}
            </p>
            <button type="button" className="auth-submit" onClick={() => void logoutUser()}>
              Sign out
            </button>
          </section>
        </main>
      );
    }

    return (
      <EarlyWarningDashboard
        page={page}
        onNavigate={(nextPage) => setPage(nextPage)}
        farmerName={profile?.fullName || user.displayName || "Farmer"}
      />
    );
  }

  function handleRegistrationSuccess(email: string, _isOfficerApplication: boolean) {
    setRequiresExplicitLogin(false);
    setRegisteredEmail(email);
    setAuthView(null);
  }

  return (
    <>
      <PublicLanding
        onSignIn={() => setAuthView("login")}
        onRegister={() => {
          setRequiresExplicitLogin(true);
          setRegSuccessMsg("");
          setAuthView("register");
        }}
      />
      {authView && (
        <AuthDialog
          view={authView}
          onViewChange={setAuthView}
          onClose={() => setAuthView(null)}
          email={registeredEmail}
          registrationMessage={regSuccessMsg}
          onRegistered={handleRegistrationSuccess}
          onLoginSuccess={() => setRequiresExplicitLogin(false)}
          onPrepareLogin={(email) => {
            setRegisteredEmail(email);
            setRegSuccessMsg("");
          }}
        />
      )}
    </>
  );
}

function AuthDialog({
  view,
  onViewChange,
  onClose,
  email,
  registrationMessage,
  onRegistered,
  onLoginSuccess,
  onPrepareLogin,
}: {
  view: Exclude<AuthView, null>;
  onViewChange: (view: AuthView) => void;
  onClose: () => void;
  email: string;
  registrationMessage: string;
  onRegistered: (email: string, isOfficerApplication: boolean) => void;
  onLoginSuccess: () => void;
  onPrepareLogin: (email: string) => void;
}) {
  return (
    <div className="auth-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-label={view === "register" ? "Create your AgriSense account" : "Sign in to AgriSense"}>
        <button className="auth-dialog-close" onClick={onClose} aria-label="Close">x</button>
        <div className="auth-form-wrap">
          {view === "reset" ? (
            <ResetPassword onBack={() => onViewChange("login")} />
          ) : view === "register" ? (
            <Register
              onRegistered={onRegistered}
              onGoToLogin={(existingEmail) => {
                onPrepareLogin(existingEmail);
                onViewChange("login");
              }}
            />
          ) : (
            <Login
              onForgotPassword={() => onViewChange("reset")}
              onLoginSuccess={onLoginSuccess}
              initialEmail={email}
              registrationSuccessMessage={registrationMessage}
            />
          )}
          {view !== "reset" && (
            <button className="auth-switch" onClick={() => onViewChange(view === "register" ? "login" : "register")}>
              {view === "register" ? "Already have an account? " : "New to AgriSense? "}
              <strong>{view === "register" ? "Sign in" : "Create an account"}</strong><span>→</span>
            </button>
          )}
        </div>
        <p className="auth-legal">Secure access powered by Firebase Authentication.</p>
      </section>
    </div>
  );
}

export default App;
