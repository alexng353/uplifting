import {
	IonAvatar,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonSpinner,
} from "@ionic/react";
import { barbell, personAdd } from "ionicons/icons";
import { useState } from "react";
import { useFriendsList } from "../../../hooks/useFriendsList";
import FriendProfile from "./FriendProfile";
import "./FriendsList.css";

export default function FriendsList() {
	const { data: friends = [], isLoading } = useFriendsList();
	const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

	const selectedFriend = friends.find((f) => f.user_id === selectedFriendId);

	const formatWorkoutDuration = (startedAt: string): string => {
		const started = new Date(startedAt);
		const now = new Date();
		const minutes = Math.floor((now.getTime() - started.getTime()) / 60000);
		if (minutes < 60) return `${minutes}min`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	};

	// Sort friends: in workout first, then online, then others
	const sortedFriends = [...friends].sort((a, b) => {
		// In workout takes priority
		if (a.is_in_workout && !b.is_in_workout) return -1;
		if (!a.is_in_workout && b.is_in_workout) return 1;
		// Then online status
		if (a.is_online && !b.is_online) return -1;
		if (!a.is_online && b.is_online) return 1;
		// Then alphabetical
		return a.real_name.localeCompare(b.real_name);
	});

	if (isLoading) {
		return (
			<div className="friends-list-loading">
				<IonSpinner />
			</div>
		);
	}

	if (friends.length === 0) {
		return (
			<div className="friends-list-empty">
				<IonIcon icon={personAdd} className="friends-list-empty-icon" />
				<h3>No friends yet</h3>
				<p>Search for people to add them as friends</p>
			</div>
		);
	}

	return (
		<div className="friends-list-container">
			<IonList>
				{sortedFriends.map((friend) => (
					<IonItem
						key={friend.friendship_id}
						button
						detail
						onClick={() => setSelectedFriendId(friend.user_id)}
						className="friend-list-item"
					>
						<IonAvatar slot="start" className="friend-avatar">
							{friend.avatar_url ? (
								<img src={friend.avatar_url} alt={friend.real_name} />
							) : (
								<div className="friend-avatar-placeholder">
									{friend.real_name.charAt(0).toUpperCase()}
								</div>
							)}
							{/* Online indicator */}
							{friend.is_online === true && (
								<span className="friend-online-indicator" />
							)}
						</IonAvatar>
						<IonLabel>
							<h2>{friend.real_name}</h2>
							<p>@{friend.username}</p>
							{friend.is_in_workout === true && (
								<p className="friend-workout-status">
									<IonIcon icon={barbell} />
									{friend.current_workout_name || "Working out"}
									{friend.current_workout_started_at && (
										<span>
											{" "}
											•{" "}
											{formatWorkoutDuration(friend.current_workout_started_at)}
										</span>
									)}
								</p>
							)}
						</IonLabel>
						{friend.is_in_workout === true && (
							<IonIcon
								icon={barbell}
								slot="end"
								color="primary"
								className="friend-workout-icon"
							/>
						)}
					</IonItem>
				))}
			</IonList>

			{selectedFriend && (
				<FriendProfile
					friend={selectedFriend}
					isOpen={!!selectedFriendId}
					onClose={() => setSelectedFriendId(null)}
				/>
			)}
		</div>
	);
}
