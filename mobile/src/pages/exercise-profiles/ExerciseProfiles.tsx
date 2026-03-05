import {
	IonBackButton,
	IonButton,
	IonButtons,
	IonContent,
	IonHeader,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonModal,
	IonPage,
	IonSearchbar,
	IonTitle,
	IonToast,
	IonToolbar,
} from "@ionic/react";
import { barbell } from "ionicons/icons";
import { useCallback, useMemo, useState } from "react";
import {
	useAllExerciseProfiles,
	useRenameExerciseProfile,
} from "../../hooks/useExerciseProfiles";
import { useExercises } from "../../hooks/useExercises";

export default function ExerciseProfiles() {
	const { data: allProfiles } = useAllExerciseProfiles();
	const { data: exercises } = useExercises();
	const renameProfileMutation = useRenameExerciseProfile();

	const [searchText, setSearchText] = useState("");

	// Rename profile state
	const [showRenameProfile, setShowRenameProfile] = useState(false);
	const [renameProfileData, setRenameProfileData] = useState<{
		exerciseId: string;
		profileId: string;
		currentName: string;
	} | null>(null);
	const [newProfileName, setNewProfileName] = useState("");

	// Toast state
	const [toastMessage, setToastMessage] = useState("");
	const [showToast, setShowToast] = useState(false);

	const showMessage = useCallback((message: string) => {
		setToastMessage(message);
		setShowToast(true);
	}, []);

	// Flatten profiles into a list with exercise info, then filter and sort
	const filteredProfiles = useMemo(() => {
		if (!allProfiles || !exercises) return [];

		const items: {
			exerciseId: string;
			exerciseName: string;
			profileId: string;
			profileName: string;
		}[] = [];

		for (const [exerciseId, profiles] of allProfiles.entries()) {
			const exercise = exercises.find((e) => e.id === exerciseId);
			const exerciseName = exercise?.name ?? "Unknown exercise";
			for (const profile of profiles) {
				items.push({
					exerciseId,
					exerciseName,
					profileId: profile.id,
					profileName: profile.name,
				});
			}
		}

		// Filter by search text (matches exercise name or profile name)
		const query = searchText.trim().toLowerCase();
		const filtered = query
			? items.filter(
					(item) =>
						item.exerciseName.toLowerCase().includes(query) ||
						item.profileName.toLowerCase().includes(query),
				)
			: items;

		// Sort alphabetically by exercise name, then profile name
		filtered.sort((a, b) => {
			const exerciseCompare = a.exerciseName.localeCompare(b.exerciseName);
			if (exerciseCompare !== 0) return exerciseCompare;
			return a.profileName.localeCompare(b.profileName);
		});

		return filtered;
	}, [allProfiles, exercises, searchText]);

	// Group filtered profiles by exercise for display
	const groupedProfiles = useMemo(() => {
		const groups: Map<
			string,
			{
				exerciseName: string;
				profiles: { profileId: string; profileName: string }[];
			}
		> = new Map();

		for (const item of filteredProfiles) {
			const existing = groups.get(item.exerciseId);
			if (existing) {
				existing.profiles.push({
					profileId: item.profileId,
					profileName: item.profileName,
				});
			} else {
				groups.set(item.exerciseId, {
					exerciseName: item.exerciseName,
					profiles: [
						{
							profileId: item.profileId,
							profileName: item.profileName,
						},
					],
				});
			}
		}

		return groups;
	}, [filteredProfiles]);

	const handleOpenRenameProfile = useCallback(
		(exerciseId: string, profileId: string, currentName: string) => {
			setRenameProfileData({ exerciseId, profileId, currentName });
			setNewProfileName(currentName);
			setShowRenameProfile(true);
		},
		[],
	);

	const handleSaveProfileName = useCallback(async () => {
		if (!renameProfileData || !newProfileName.trim()) return;
		try {
			await renameProfileMutation.mutateAsync({
				exerciseId: renameProfileData.exerciseId,
				profileId: renameProfileData.profileId,
				name: newProfileName.trim(),
			});
			setShowRenameProfile(false);
			showMessage("Profile renamed");
		} catch {
			showMessage("Failed to rename profile");
		}
	}, [renameProfileData, newProfileName, renameProfileMutation, showMessage]);

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonButtons slot="start">
						<IonBackButton defaultHref="/settings" />
					</IonButtons>
					<IonTitle>Exercise Profiles</IonTitle>
				</IonToolbar>
				<IonToolbar>
					<IonSearchbar
						value={searchText}
						onIonInput={(e) => setSearchText(e.detail.value ?? "")}
						placeholder="Filter by exercise or profile name"
						debounce={150}
					/>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				{groupedProfiles.size === 0 ? (
					<div className="ion-padding ion-text-center">
						<p>
							{searchText.trim()
								? "No profiles match your search."
								: "No exercise profiles yet."}
						</p>
					</div>
				) : (
					Array.from(groupedProfiles.entries()).map(
						([exerciseId, { exerciseName, profiles }]) => (
							<IonList key={exerciseId} inset>
								<IonListHeader>{exerciseName}</IonListHeader>
								{profiles.map((profile) => (
									<IonItem
										key={profile.profileId}
										button
										onClick={() =>
											handleOpenRenameProfile(
												exerciseId,
												profile.profileId,
												profile.profileName,
											)
										}
										detail
									>
										<IonIcon slot="start" icon={barbell} />
										<IonLabel>{profile.profileName}</IonLabel>
									</IonItem>
								))}
							</IonList>
						),
					)
				)}

				<IonModal
					isOpen={showRenameProfile}
					onDidDismiss={() => setShowRenameProfile(false)}
				>
					<IonHeader>
						<IonToolbar>
							<IonTitle>Rename Profile</IonTitle>
							<IonButtons slot="end">
								<IonButton onClick={() => setShowRenameProfile(false)}>
									Cancel
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>
					<IonContent className="ion-padding">
						<IonInput
							label="Profile Name"
							labelPlacement="stacked"
							value={newProfileName}
							onIonInput={(e) => setNewProfileName(e.detail.value ?? "")}
						/>
						<IonButton
							expand="block"
							onClick={handleSaveProfileName}
							disabled={
								renameProfileMutation.isPending || !newProfileName.trim()
							}
							className="ion-margin-top"
						>
							{renameProfileMutation.isPending ? "Saving..." : "Save"}
						</IonButton>
					</IonContent>
				</IonModal>

				<IonToast
					isOpen={showToast}
					onDidDismiss={() => setShowToast(false)}
					message={toastMessage}
					duration={3000}
					position="bottom"
				/>
			</IonContent>
		</IonPage>
	);
}
