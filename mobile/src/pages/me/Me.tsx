import {
	IonButton,
	IonContent,
	IonHeader,
	IonIcon,
	IonPage,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { refresh, warning } from "ionicons/icons";
import { useSync } from "../../hooks/useSync";
import "./Me.css";

export default function Me() {
	const { isOnline, hasPendingWorkout, isSyncing, lastSyncTime, forceSync } =
		useSync();

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Me</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">Me</IonTitle>
					</IonToolbar>
				</IonHeader>
				{/* Sync Banner */}
				{(!isOnline || hasPendingWorkout) && (
					<div className={`sync-banner ${isOnline ? "pending" : "offline"}`}>
						<div className="sync-banner-content">
							<IonIcon icon={warning} />
							<span>
								{!isOnline ? "You're offline" : "Workout pending sync"}
							</span>
						</div>
						<IonButton
							fill="clear"
							size="small"
							onClick={forceSync}
							disabled={!isOnline || isSyncing}
						>
							<IonIcon slot="start" icon={refresh} />
							{isSyncing ? "Syncing..." : "Sync"}
						</IonButton>
					</div>
				)}
				<div className="me-content">
					<p>
						Update: Added a set timer. Press button briefly to start/stop timer.
						Hold to reset.
					</p>
					{lastSyncTime && (
						<p className="last-sync-time">
							Last synced: {lastSyncTime.toLocaleString()}
						</p>
					)}
				</div>
			</IonContent>
		</IonPage>
	);
}
