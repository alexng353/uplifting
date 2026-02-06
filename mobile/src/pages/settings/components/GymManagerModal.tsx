import {
	IonAlert,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonItem,
	IonItemOption,
	IonItemOptions,
	IonItemSliding,
	IonLabel,
	IonList,
	IonModal,
	IonText,
	IonTitle,
	IonToolbar,
} from "@ionic/react";
import { add, pencil, trash } from "ionicons/icons";
import { useState } from "react";
import { getCurrentPosition } from "../../../services/geolocation";
import type { StoredGym } from "../../../services/local-storage";

interface GymManagerModalProps {
	isOpen: boolean;
	onDismiss: () => void;
	gyms: StoredGym[];
	onAddGym: (
		name: string,
		latitude?: number | null,
		longitude?: number | null,
	) => Promise<StoredGym>;
	onUpdateGym: (id: string, name: string) => Promise<void>;
	onDeleteGym: (id: string) => Promise<void>;
}

export default function GymManagerModal({
	isOpen,
	onDismiss,
	gyms,
	onAddGym,
	onUpdateGym,
	onDeleteGym,
}: GymManagerModalProps) {
	const [showAddAlert, setShowAddAlert] = useState(false);
	const [showEditAlert, setShowEditAlert] = useState(false);
	const [showDeleteAlert, setShowDeleteAlert] = useState(false);
	const [selectedGym, setSelectedGym] = useState<StoredGym | null>(null);

	const handleAdd = async (name: string) => {
		if (!name.trim()) return;
		const position = await getCurrentPosition();
		await onAddGym(name.trim(), position?.latitude, position?.longitude);
	};

	const handleEdit = (gym: StoredGym) => {
		setSelectedGym(gym);
		setShowEditAlert(true);
	};

	const handleEditConfirm = async (name: string) => {
		if (!selectedGym || !name.trim()) return;
		await onUpdateGym(selectedGym.id, name.trim());
		setSelectedGym(null);
	};

	const handleDelete = (gym: StoredGym) => {
		setSelectedGym(gym);
		setShowDeleteAlert(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedGym) return;
		await onDeleteGym(selectedGym.id);
		setSelectedGym(null);
	};

	return (
		<IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Manage Gyms</IonTitle>
					<IonButtons slot="end">
						<IonButton onClick={onDismiss}>Done</IonButton>
					</IonButtons>
				</IonToolbar>
			</IonHeader>
			<IonContent>
				<IonList inset>
					<IonItem button onClick={() => setShowAddAlert(true)}>
						<IonIcon slot="start" icon={add} color="primary" />
						<IonLabel color="primary">Add New Gym</IonLabel>
					</IonItem>
				</IonList>

				{gyms.length === 0 ? (
					<div className="ion-padding ion-text-center">
						<IonText color="medium">
							<p>No gyms added yet.</p>
							<p>
								Add a gym to start tracking profile preferences by location.
							</p>
						</IonText>
					</div>
				) : (
					<IonList inset>
						{gyms.map((gym) => (
							<IonItemSliding key={gym.id}>
								<IonItem>
									<IonLabel>{gym.name}</IonLabel>
								</IonItem>
								<IonItemOptions side="end">
									<IonItemOption
										color="primary"
										onClick={() => handleEdit(gym)}
									>
										<IonIcon slot="icon-only" icon={pencil} />
									</IonItemOption>
									<IonItemOption
										color="danger"
										onClick={() => handleDelete(gym)}
									>
										<IonIcon slot="icon-only" icon={trash} />
									</IonItemOption>
								</IonItemOptions>
							</IonItemSliding>
						))}
					</IonList>
				)}

				<IonAlert
					isOpen={showAddAlert}
					onDidDismiss={() => setShowAddAlert(false)}
					header="Add New Gym"
					inputs={[
						{
							name: "gymName",
							type: "text",
							placeholder: "e.g., Gold's Gym, Home Gym",
						},
					]}
					buttons={[
						{
							text: "Cancel",
							role: "cancel",
						},
						{
							text: "Add",
							handler: (data) => {
								if (data.gymName) {
									handleAdd(data.gymName);
								}
							},
						},
					]}
				/>

				<IonAlert
					isOpen={showEditAlert}
					onDidDismiss={() => {
						setShowEditAlert(false);
						setSelectedGym(null);
					}}
					header="Edit Gym"
					inputs={[
						{
							name: "gymName",
							type: "text",
							value: selectedGym?.name ?? "",
						},
					]}
					buttons={[
						{
							text: "Cancel",
							role: "cancel",
						},
						{
							text: "Save",
							handler: (data) => {
								if (data.gymName) {
									handleEditConfirm(data.gymName);
								}
							},
						},
					]}
				/>

				<IonAlert
					isOpen={showDeleteAlert}
					onDidDismiss={() => {
						setShowDeleteAlert(false);
						setSelectedGym(null);
					}}
					header="Delete Gym"
					message={`Are you sure you want to delete "${selectedGym?.name}"? This won't delete your workout history.`}
					buttons={[
						{
							text: "Cancel",
							role: "cancel",
						},
						{
							text: "Delete",
							role: "destructive",
							handler: handleDeleteConfirm,
						},
					]}
				/>
			</IonContent>
		</IonModal>
	);
}
