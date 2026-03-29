import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import JobDetail from "./pages/JobDetail";
import PostJob from "./pages/PostJob";
import Profile from "./pages/Profile";
import Applications from "./pages/Applications";
import Earnings from "./pages/Earnings";
import Ratings from "./pages/Ratings";
import Onboarding from "./pages/Onboarding";
import WorkerAvailability from "./pages/WorkerAvailability";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/feed" component={Feed} />
      <Route path="/jobs/:id" component={JobDetail} />
      <Route path="/post-job" component={PostJob} />
      <Route path="/profile" component={Profile} />
      <Route path="/applications" component={Applications} />
      <Route path="/earnings" component={Earnings} />
      <Route path="/ratings" component={Ratings} />
      <Route path="/availability" component={WorkerAvailability} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
