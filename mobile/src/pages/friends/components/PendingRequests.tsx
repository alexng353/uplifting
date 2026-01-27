import {
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonSpinner,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { checkmark, close } from "ionicons/icons";
import { usePendingFriendRequests } from "../../../hooks/usePendingFriendRequests";
import { useRespondFriendRequest } from "../../../hooks/useRespondFriendRequest";

interface PendingRequestsProps {
	onClose: () => void;
}

export default function PendingRequests({ onClose }: PendingRequestsProps) {
	const { data: requests = [], isLoading } = usePendingFriendRequests();
	const respondMutation = useRespondFriendRequest();

	const handleAccept = async (friendshipId: string) => {
		await respondMutation.mutateAsync({ friendshipId, action: "accept" });
	};

	const handleDecline = async (friendshipId: string) => {
		await respondMutation.mutateAsync({ friendshipId, action: "decline" });
	};

	return (
		<>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Friend Requests</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={onClose}>Done</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding">
				{isLoading ? (
					<div className="ion-text-center ion-padding">
						<IonSpinner />
					</div>
				) : requests.length === 0 ? (
					<div className="ion-text-center ion-padding">
						<p>No pending friend requests</p>
					</div>
				) : (
					<IonList>
						{requests.map((request) => (
							<IonItem key={request.friendship_id}>
								<IonLabel>
									<h2>{request.real_name}</h2>
									<p>@{request.username}</p>
								</IonLabel>
								<IonButton
									slot="end"
									fill="clear"
									color="success"
									onClick={() => handleAccept(request.friendship_id)}
									disabled={respondMutation.isPending}
								>
									<IonIcon slot="icon-only" icon={checkmark} />
								</IonButton>
								<IonButton
									slot="end"
									fill="clear"
									color="danger"
									onClick={() => handleDecline(request.friendship_id)}
									disabled={respondMutation.isPending}
								>
									<IonIcon slot="icon-only" icon={close} />
								</IonButton>
							</IonItem>
						))}
					</IonList>
				)}
			</IonContent>
		</>
	);
}
