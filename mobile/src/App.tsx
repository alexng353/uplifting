import {
	IonApp,
	IonIcon,
	IonLabel,
	IonLoading,
	IonRouterOutlet,
	IonTabBar,
	IonTabButton,
	IonTabs,
	setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { barbell, people, person, settings, statsChart } from "ionicons/icons";
import { Redirect, Route } from "react-router-dom";

const queryClient = new QueryClient();

//#region Ionic CSS
/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";
//#endregion

// https://ionicframework.com/docs/theming/dark-mode
import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";

import { ActivityTracker } from "./components/ActivityTracker";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { WorkoutProvider } from "./hooks/useWorkout";
/* Pages */
import Friends from "./pages/friends/Friends";
import Login from "./pages/login/Login";
import Me from "./pages/me/Me";
import Settings from "./pages/settings/Settings";
import Stats from "./pages/stats/Stats";
import WorkoutDetail from "./pages/stats/WorkoutDetail";
import Workout from "./pages/workout/Workout";

setupIonicReact();

function AuthenticatedRouter() {
	return (
		<WorkoutProvider>
			<ActivityTracker />
			<IonTabs>
				<IonRouterOutlet>
					<Route exact path="/me">
						<Me />
					</Route>
					<Route exact path="/friends">
						<Friends />
					</Route>
					<Route exact path="/workout">
						<Workout />
					</Route>
					<Route exact path="/stats">
						<Stats />
					</Route>
					<Route exact path="/stats/workout/:workoutId">
						<WorkoutDetail />
					</Route>
					<Route exact path="/settings">
						<Settings />
					</Route>
					<Route exact path="/">
						<Redirect to="/me" />
					</Route>
					<Redirect exact from="/login" to="/me" />
				</IonRouterOutlet>
				<IonTabBar slot="bottom">
					<IonTabButton tab="me" href="/me">
						<IonIcon aria-hidden="true" icon={person} />
						<IonLabel>Me</IonLabel>
					</IonTabButton>
					<IonTabButton tab="friends" href="/friends">
						<IonIcon aria-hidden="true" icon={people} />
						<IonLabel>Friends</IonLabel>
					</IonTabButton>
					<IonTabButton tab="workout" href="/workout">
						<IonIcon aria-hidden="true" icon={barbell} />
						<IonLabel>Workout</IonLabel>
					</IonTabButton>
					<IonTabButton tab="stats" href="/stats">
						<IonIcon aria-hidden="true" icon={statsChart} />
						<IonLabel>Stats</IonLabel>
					</IonTabButton>
					<IonTabButton tab="settings" href="/settings">
						<IonIcon aria-hidden="true" icon={settings} />
						<IonLabel>Settings</IonLabel>
					</IonTabButton>
				</IonTabBar>
			</IonTabs>
		</WorkoutProvider>
	);
}

function UnauthenticatedRouter() {
	return (
		<IonRouterOutlet>
			<Route exact path="/login">
				<Login />
			</Route>
			<Route render={() => <Redirect to="/login" />} />
		</IonRouterOutlet>
	);
}

function AppContent() {
	const { isAuthenticated, isLoading } = useAuth();

	return (
		<IonApp>
			<IonReactRouter>
				<IonLoading isOpen={isLoading} message="Loading..." />
				{isAuthenticated ? <AuthenticatedRouter /> : <UnauthenticatedRouter />}
			</IonReactRouter>
		</IonApp>
	);
}

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<AppContent />
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;
