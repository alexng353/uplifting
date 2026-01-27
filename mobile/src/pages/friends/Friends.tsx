import {
	IonBadge,
	IonButton,
	IonButtons,
	IonCard,
	IonCardContent,
	IonCardHeader,
	IonCardSubtitle,
	IonCardTitle,
	IonContent,
	IonFab,
	IonFabButton,
	IonHeader,
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonLabel,
	IonModal,
	IonPage,
	IonRefresher,
	IonRefresherContent,
	IonSegment,
	IonSegmentButton,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import {
	newspaper,
	notifications,
	people,
	personAdd,
	search,
} from "ionicons/icons";
import { useCallback, useState } from "react";
import "./Friends.css";
import { useFeed } from "../../hooks/useFeed";
import { useFriendsList } from "../../hooks/useFriendsList";
import { usePendingFriendRequests } from "../../hooks/usePendingFriendRequests";
import FriendSearch from "./components/FriendSearch";
import FriendsList from "./components/FriendsList";
import PendingRequests from "./components/PendingRequests";

type TabType = "feed" | "friends";

export default function Friends() {
	const [activeTab, setActiveTab] = useState<TabType>("feed");
	const [showSearch, setShowSearch] = useState(false);
	const [showPendingRequests, setShowPendingRequests] = useState(false);
	const { data, isLoading, refetch, fetchNextPage, hasNextPage } = useFeed();
	const { data: friendsListData, refetch: refetchFriends } = useFriendsList();
	const { data: pendingRequests = [] } = usePendingFriendRequests();

	const pendingCount = pendingRequests.length;
	const friendsCount = friendsListData?.length ?? 0;

	const feed = data?.pages.flat() ?? [];

	const handleRefresh = useCallback(
		async (event: CustomEvent) => {
			if (activeTab === "feed") {
				await refetch();
			} else {
				await refetchFriends();
			}
			event.detail.complete();
		},
		[refetch, refetchFriends, activeTab],
	);

	const handleInfinite = useCallback(
		async (event: CustomEvent) => {
			await fetchNextPage();
			(event.target as HTMLIonInfiniteScrollElement).complete();
		},
		[fetchNextPage],
	);

	const formatDuration = (minutes: number | null | undefined): string => {
		if (!minutes) return "";
		if (minutes < 60) return `${minutes}min`;
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}min`;
	};

	const formatVolume = (volume: string | null | undefined): string => {
		if (!volume) return "";
		const num = Number(volume);
		if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
		return String(Math.round(num));
	};

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Friends</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={() => setShowPendingRequests(true)}>
							<IonIcon slot="icon-only" icon={notifications} />
							{pendingCount > 0 && (
								<IonBadge
									color="danger"
									style={{
										position: "absolute",
										top: 4,
										right: 4,
										fontSize: "10px",
										minWidth: "18px",
									}}
								>
									{pendingCount > 9 ? "9+" : pendingCount}
								</IonBadge>
							)}
						</IonButton>
						<IonButton onClick={() => setShowSearch(true)}>
							<IonIcon slot="icon-only" icon={search} />
						</IonButton>
					</IonButtons>
				</IonToolbar>
				<IonToolbar>
					<IonSegment
						value={activeTab}
						onIonChange={(e) => setActiveTab(e.detail.value as TabType)}
					>
						<IonSegmentButton value="feed">
							<IonIcon icon={newspaper} />
							<IonLabel>Feed</IonLabel>
						</IonSegmentButton>
						<IonSegmentButton value="friends">
							<IonIcon icon={people} />
							<IonLabel>
								Friends {friendsCount > 0 && `(${friendsCount})`}
							</IonLabel>
						</IonSegmentButton>
					</IonSegment>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
					<IonRefresherContent />
				</IonRefresher>

				{activeTab === "feed" ? (
					<>
						{isLoading ? (
							<div className="loading-container">
								<p>Loading feed...</p>
							</div>
						) : feed.length === 0 ? (
							<div className="empty-feed">
								<h3>No workouts yet</h3>
								<p>Add friends to see their workouts here</p>
								<IonButton onClick={() => setShowSearch(true)}>
									<IonIcon slot="start" icon={personAdd} />
									Find Friends
								</IonButton>
							</div>
						) : (
							<div className="feed-container">
								{feed.map((item) => (
									<IonCard key={item.workout_id}>
										<IonCardHeader>
											<IonCardSubtitle>
												{item.real_name} (@{item.username})
											</IonCardSubtitle>
											<IonCardTitle>
												{item.workout_name || "Workout"}
											</IonCardTitle>
										</IonCardHeader>
										<IonCardContent>
											<div className="feed-stats">
												{item.duration_minutes && (
													<span>{formatDuration(item.duration_minutes)}</span>
												)}
												{item.total_volume && (
													<span>{formatVolume(item.total_volume)} vol</span>
												)}
												{item.total_sets && <span>{item.total_sets} sets</span>}
											</div>
											{item.gym_location && (
												<p className="gym-location">📍 {item.gym_location}</p>
											)}
											<p className="feed-time">
												{new Date(item.start_time).toLocaleDateString()}
											</p>
										</IonCardContent>
									</IonCard>
								))}
							</div>
						)}

						<IonInfiniteScroll
							onIonInfinite={handleInfinite}
							disabled={!hasNextPage}
						>
							<IonInfiniteScrollContent />
						</IonInfiniteScroll>
					</>
				) : (
					<FriendsList />
				)}

				<IonFab slot="fixed" vertical="bottom" horizontal="end">
					<IonFabButton onClick={() => setShowSearch(true)}>
						<IonIcon icon={personAdd} />
					</IonFabButton>
				</IonFab>

				<IonModal isOpen={showSearch} onDidDismiss={() => setShowSearch(false)}>
					<FriendSearch onClose={() => setShowSearch(false)} />
				</IonModal>

				<IonModal
					isOpen={showPendingRequests}
					onDidDismiss={() => setShowPendingRequests(false)}
				>
					<PendingRequests onClose={() => setShowPendingRequests(false)} />
				</IonModal>
			</IonContent>
		</IonPage>
	);
}
