import {
	IonAvatar,
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonChip,
	IonContent,
	IonHeader,
	IonIcon,
	IonModal,
	IonSpinner,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { barbell, ellipse, flame, time, trendingUp } from "ionicons/icons";
import { useFriendWorkouts } from "../../../hooks/useFriendWorkouts";
import "./FriendProfile.css";

interface Friend {
	friendship_id: string;
	user_id: string;
	username: string;
	real_name: string;
	avatar_url?: string | null;
	is_online?: boolean | null;
	is_in_workout?: boolean | null;
	current_workout_name?: string | null;
	current_workout_started_at?: string | null;
}

interface FriendProfileProps {
	friend: Friend;
	isOpen: boolean;
	onClose: () => void;
}

export default function FriendProfile({
	friend,
	isOpen,
	onClose,
}: FriendProfileProps) {
	const { data, isLoading } = useFriendWorkouts(friend.user_id, isOpen);

	const formatDuration = (minutes: number): string => {
		if (minutes < 60) return `${minutes}min`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	};

	const formatVolume = (volume: string | number): string => {
		const num = typeof volume === "string" ? Number.parseFloat(volume) : volume;
		if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
		return String(Math.round(num));
	};

	const formatDate = (dateStr: string): string => {
		const date = new Date(dateStr);
		const now = new Date();
		const diffDays = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
		);

		if (diffDays === 0) return "Today";
		if (diffDays === 1) return "Yesterday";
		if (diffDays < 7) return `${diffDays} days ago`;
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
		});
	};

	return (
		<IonModal isOpen={isOpen} onDidDismiss={onClose}>
			<IonHeader>
				<IonToolbar>
					<IonTitle>{friend.real_name}</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={onClose}>Done</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent>
				{/* Profile Header */}
				<div className="friend-profile-header">
					<IonAvatar className="friend-profile-avatar">
						{friend.avatar_url ? (
							<img src={friend.avatar_url} alt={friend.real_name} />
						) : (
							<div className="friend-profile-avatar-placeholder">
								{friend.real_name.charAt(0).toUpperCase()}
							</div>
						)}
					</IonAvatar>
					<h1>{friend.real_name}</h1>
					<p>@{friend.username}</p>
					<div className="friend-profile-status">
						{friend.is_online === true && (
							<IonChip color="success" outline>
								<IonIcon icon={ellipse} />
								Online
							</IonChip>
						)}
						{friend.is_in_workout === true && (
							<IonChip color="primary">
								<IonIcon icon={barbell} />
								{friend.current_workout_name || "Working out"}
							</IonChip>
						)}
					</div>
				</div>

				{isLoading ? (
					<div className="ion-text-center ion-padding">
						<IonSpinner />
					</div>
				) : data?.can_view === false ? (
					<div className="ion-text-center ion-padding">
						<p style={{ color: "var(--ion-color-medium)" }}>
							{friend.real_name} has workout history sharing disabled
						</p>
					</div>
				) : data ? (
					<>
						{/* This Week Summary */}
						{data.this_week_count > 0 && (
							<IonCard className="friend-profile-week-card">
								<IonCardHeader>
									<IonCardSubtitle>
										<IonIcon icon={flame} /> This Week
									</IonCardSubtitle>
								</IonCardHeader>
								<IonCardContent>
									<div className="friend-profile-week-stats">
										<div className="stat">
											<span className="stat-value">{data.this_week_count}</span>
											<span className="stat-label">Workouts</span>
										</div>
										<div className="stat">
											<span className="stat-value">
												{formatVolume(data.this_week_volume)}
											</span>
											<span className="stat-label">Volume</span>
										</div>
										<div className="stat">
											<span className="stat-value">
												{formatDuration(data.this_week_duration_minutes)}
											</span>
											<span className="stat-label">Time</span>
										</div>
									</div>
								</IonCardContent>
							</IonCard>
						)}

						{/* Workout History */}
						<div className="friend-profile-workouts">
							<h2 className="friend-profile-section-title">Recent Workouts</h2>
							{data.workouts.length === 0 ? (
								<p
									className="ion-text-center"
									style={{ color: "var(--ion-color-medium)" }}
								>
									No workouts yet
								</p>
							) : (
								data.workouts.map((workout) => (
									<IonCard key={workout.id} className="friend-workout-card">
										<IonCardHeader>
											<IonCardSubtitle>
												{formatDate(workout.start_time)}
											</IonCardSubtitle>
											<IonCardTitle>{workout.name || "Workout"}</IonCardTitle>
										</IonCardHeader>
										<IonCardContent>
											<div className="friend-workout-stats">
												<span>
													<IonIcon icon={time} />{" "}
													{formatDuration(workout.duration_minutes)}
												</span>
												<span>
													<IonIcon icon={trendingUp} />{" "}
													{formatVolume(workout.total_volume)}
												</span>
												<span>
													<IonIcon icon={barbell} /> {workout.total_sets} sets
												</span>
											</div>
										</IonCardContent>
									</IonCard>
								))
							)}
						</div>
					</>
				) : null}
			</IonContent>
		</IonModal>
	);
}
