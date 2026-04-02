import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import JobDetail from "./pages/JobDetail";
import PostJob from "./pages/PostJob";
import Profile from "./pages/Profile";
import Applications from "./pages/Applications";
import Earnings from "./pages/Earnings";
import Ratings from "./pages/Ratings";
import Onboarding from "./pages/Onboarding";
import WorkerAvailability from "./pages/WorkerAvailability";
import AdminDashboard from "./pages/AdminDashboard";
import WorkerVerification from "./pages/WorkerVerification";
import ContractAgreement from "./pages/ContractAgreement";
import EmployerOnboarding from "./pages/EmployerOnboarding";
import EmailSequence from "./pages/EmailSequence";
import RateShift from "./pages/RateShift";
import ReviewHistory from "./pages/ReviewHistory";
import Pricing from "./pages/Pricing";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import AdminCoupons from "./pages/AdminCoupons";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import EmployerDashboard from "./pages/EmployerDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/feed" component={Feed} />
      <Route path="/jobs/:id" component={JobDetail} />
      <Route path="/post-job" component={PostJob} />
      <Route path="/profile" component={Profile} />
      <Route path="/applications" component={Applications} />
      <Route path="/earnings" component={Earnings} />
      <Route path="/ratings" component={Ratings} />
      <Route path="/availability" component={WorkerAvailability} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/verify" component={WorkerVerification} />
      <Route path="/contract" component={ContractAgreement} />
      <Route path="/employer-onboarding" component={EmployerOnboarding} />
      <Route path="/admin/emails" component={EmailSequence} />
      <Route path="/admin/coupons" component={AdminCoupons} />
      <Route path="/rate/:jobId" component={RateShift} />
      <Route path="/reviews/:userId" component={ReviewHistory} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/faq" component={FAQ} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/employer-dashboard" component={EmployerDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <PWAInstallPrompt />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
