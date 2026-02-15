import {
	IonAlert,
	IonBadge,
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
	IonSelect,
	IonSelectOption,
	IonText,
	IonTitle,
	IonToast,
	IonToggle,
	IonToolbar,
} from "@ionic/react";
import { useQueryClient } from "@tanstack/react-query";
import {
	business,
	cloudDownload,
	eye,
	lockClosed,
	logOut,
	mail,
	pencil,
	personCircle,
	refreshCircle,
	trash,
} from "ionicons/icons";
import { useCallback, useState } from "react";
import "./Settings.css";
import { useAuth } from "../../hooks/useAuth";
import { useCurrentGym } from "../../hooks/useCurrentGym";
import { useGyms } from "../../hooks/useGyms";
import { useMe } from "../../hooks/useMe";
import { useSettings } from "../../hooks/useSettings";
import { api } from "../../lib/api";
import { clearAllData } from "../../services/local-storage";
import GymManagerModal from "./components/GymManagerModal";

export default function Settings() {
	const { logout, isAuthenticated } = useAuth();
	const { settings, updateSettings } = useSettings();
	const { data: user, refetch: refetchUser } = useMe(isAuthenticated);
	const queryClient = useQueryClient();
	const { gyms, addGym, updateGym, deleteGym } = useGyms();
	const { currentGymId, setCurrentGymId, refreshCurrentGym } = useCurrentGym();

	const [showEditUsername, setShowEditUsername] = useState(false);
	const [newUsername, setNewUsername] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [showWipeConfirm, setShowWipeConfirm] = useState(false);
	const [isWiping, setIsWiping] = useState(false);
	const [showGymManager, setShowGymManager] = useState(false);

	// Email verification state
	const [showVerifyEmail, setShowVerifyEmail] = useState(false);
	const [verificationCode, setVerificationCode] = useState("");
	const [verificationStep, setVerificationStep] = useState<
		"request" | "verify"
	>("request");
	const [isVerifying, setIsVerifying] = useState(false);

	// Password change state
	const [showChangePassword, setShowChangePassword] = useState(false);
	const [passwordCode, setPasswordCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordStep, setPasswordStep] = useState<"request" | "change">(
		"request",
	);
	const [isChangingPassword, setIsChangingPassword] = useState(false);

	// Toast state
	const [toastMessage, setToastMessage] = useState("");
	const [showToast, setShowToast] = useState(false);

	const showMessage = useCallback((message: string) => {
		setToastMessage(message);
		setShowToast(true);
	}, []);

	const handleLogout = useCallback(async () => {
		await clearAllData();
		logout();
	}, [logout]);

	const handleDeleteAccount = useCallback(async () => {
		setShowDeleteConfirm(true);
	}, []);

	const confirmDeleteAccount = useCallback(async () => {
		await api.deleteMe();
		await clearAllData();
		logout();
	}, [logout]);

	const confirmWipeData = useCallback(async () => {
		setIsWiping(true);
		try {
			await clearAllData();
			await queryClient.invalidateQueries();
			showMessage("Local data wiped and re-syncing from server");
		} catch {
			showMessage("Failed to wipe local data");
		} finally {
			setIsWiping(false);
		}
	}, [queryClient, showMessage]);

	const handleEditUsername = useCallback(() => {
		setNewUsername(user?.username ?? "");
		setShowEditUsername(true);
	}, [user?.username]);

	const handleSaveUsername = useCallback(async () => {
		if (!newUsername.trim()) return;
		setIsSaving(true);
		try {
			await api.updateMe({ body: { username: newUsername.trim() } });
			await refetchUser();
			setShowEditUsername(false);
		} finally {
			setIsSaving(false);
		}
	}, [newUsername, refetchUser]);

	// Email verification handlers
	const handleOpenVerifyEmail = useCallback(() => {
		setVerificationCode("");
		setVerificationStep("request");
		setShowVerifyEmail(true);
	}, []);

	const handleRequestVerification = useCallback(async () => {
		setIsVerifying(true);
		try {
			const { error } = await api.sendVerification();
			if (error) throw error;
			setVerificationStep("verify");
			showMessage("Verification code sent to your email");
		} catch {
			showMessage("Failed to send verification code");
		} finally {
			setIsVerifying(false);
		}
	}, [showMessage]);

	const handleVerifyEmail = useCallback(async () => {
		if (!verificationCode.trim()) return;
		setIsVerifying(true);
		try {
			const { error } = await api.verifyEmail({
				body: { code: verificationCode.trim() },
			});
			if (error) throw error;
			await refetchUser();
			setShowVerifyEmail(false);
			showMessage("Email verified successfully");
		} catch {
			showMessage("Invalid or expired verification code");
		} finally {
			setIsVerifying(false);
		}
	}, [verificationCode, refetchUser, showMessage]);

	// Password change handlers
	const handleOpenChangePassword = useCallback(() => {
		setPasswordCode("");
		setNewPassword("");
		setConfirmPassword("");
		setPasswordStep("request");
		setShowChangePassword(true);
	}, []);

	const handleRequestPasswordChange = useCallback(async () => {
		setIsChangingPassword(true);
		try {
			const { error } = await api.requestPasswordChange();
			if (error) throw error;
			setPasswordStep("change");
			showMessage("Verification code sent to your email");
		} catch {
			showMessage(
				"Failed to send verification code. Please verify your email first.",
			);
		} finally {
			setIsChangingPassword(false);
		}
	}, [showMessage]);

	const handleChangePassword = useCallback(async () => {
		if (!passwordCode.trim() || !newPassword || newPassword !== confirmPassword)
			return;
		setIsChangingPassword(true);
		try {
			const { error } = await api.changePassword({
				body: { code: passwordCode.trim(), new_password: newPassword },
			});
			if (error) throw error;
			setShowChangePassword(false);
			showMessage("Password changed successfully");
		} catch {
			showMessage("Invalid or expired verification code");
		} finally {
			setIsChangingPassword(false);
		}
	}, [passwordCode, newPassword, confirmPassword, showMessage]);

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>Settings</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent fullscreen>
				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">Settings</IonTitle>
					</IonToolbar>
				</IonHeader>

				{user && (
					<div className="profile-section">
						<IonIcon icon={personCircle} className="profile-icon" />
						<h2>{user.real_name}</h2>
						<p>@{user.username}</p>
						{!user.email_verified && (
							<IonBadge color="warning" className="ion-margin-top">
								Email not verified
							</IonBadge>
						)}
					</div>
				)}

				{user && !user.email_verified && (
					<IonList inset>
						<IonItem button onClick={handleOpenVerifyEmail} detail>
							<IonIcon slot="start" icon={mail} color="warning" />
							<IonLabel color="warning">Verify Email</IonLabel>
						</IonItem>
					</IonList>
				)}

				<IonList inset>
					<IonListHeader>Profile</IonListHeader>

					<IonItem button onClick={handleEditUsername} detail>
						<IonIcon slot="start" icon={pencil} />
						<IonLabel>Change Username</IonLabel>
					</IonItem>

					<IonItem button onClick={handleOpenChangePassword} detail>
						<IonIcon slot="start" icon={lockClosed} />
						<IonLabel>Change Password</IonLabel>
					</IonItem>
				</IonList>

				<IonList inset>
					<IonListHeader>Preferences</IonListHeader>

					<IonItem>
						<IonLabel>Weight Unit</IonLabel>
						<IonSelect
							value={settings.displayUnit}
							onIonChange={(e) =>
								updateSettings({ displayUnit: e.detail.value })
							}
							interface="popover"
						>
							<IonSelectOption value={null}>Auto (locale)</IonSelectOption>
							<IonSelectOption value="kg">Kilograms (kg)</IonSelectOption>
							<IonSelectOption value="lbs">Pounds (lbs)</IonSelectOption>
						</IonSelect>
					</IonItem>

					<IonItem>
						<IonLabel>Default Privacy</IonLabel>
						<IonSelect
							value={settings.defaultPrivacy}
							onIonChange={(e) =>
								updateSettings({ defaultPrivacy: e.detail.value })
							}
							interface="popover"
						>
							<IonSelectOption value="public">Public</IonSelectOption>
							<IonSelectOption value="friends">Friends Only</IonSelectOption>
							<IonSelectOption value="private">Private</IonSelectOption>
						</IonSelect>
					</IonItem>

					<IonItem>
						<IonLabel>Rest Timer (seconds)</IonLabel>
						<IonSelect
							value={settings.defaultRestTimerSeconds}
							onIonChange={(e) =>
								updateSettings({
									defaultRestTimerSeconds: Number(e.detail.value),
								})
							}
							interface="popover"
						>
							<IonSelectOption value={30}>30</IonSelectOption>
							<IonSelectOption value={60}>60</IonSelectOption>
							<IonSelectOption value={90}>90</IonSelectOption>
							<IonSelectOption value={120}>120</IonSelectOption>
							<IonSelectOption value={180}>180</IonSelectOption>
						</IonSelect>
					</IonItem>

					<IonItem>
						<IonLabel>Max Workout Duration (min)</IonLabel>
						<IonSelect
							value={settings.maxWorkoutDurationMinutes}
							onIonChange={(e) =>
								updateSettings({
									maxWorkoutDurationMinutes: Number(e.detail.value),
								})
							}
							interface="popover"
						>
							<IonSelectOption value={60}>60</IonSelectOption>
							<IonSelectOption value={90}>90</IonSelectOption>
							<IonSelectOption value={120}>120</IonSelectOption>
							<IonSelectOption value={180}>180</IonSelectOption>
							<IonSelectOption value={240}>240</IonSelectOption>
						</IonSelect>
					</IonItem>

					<IonItem>
						<IonToggle
							checked={settings.shareGymLocation}
							onIonChange={(e) =>
								updateSettings({ shareGymLocation: e.detail.checked })
							}
						>
							Share Gym Location
						</IonToggle>
					</IonItem>
				</IonList>

				<IonList inset>
					<IonListHeader>Gym Locations</IonListHeader>

					<IonItem>
						<IonLabel>Current Gym</IonLabel>
						<IonSelect
							value={currentGymId}
							onIonChange={(e) => setCurrentGymId(e.detail.value)}
							interface="popover"
							placeholder="None"
						>
							<IonSelectOption value={null}>None</IonSelectOption>
							{gyms.map((gym) => (
								<IonSelectOption key={gym.id} value={gym.id}>
									{gym.name}
								</IonSelectOption>
							))}
						</IonSelect>
					</IonItem>

					<IonItem button onClick={() => setShowGymManager(true)} detail>
						<IonIcon slot="start" icon={business} />
						<IonLabel>Manage Gyms</IonLabel>
						<IonBadge slot="end">{gyms.length}</IonBadge>
					</IonItem>
				</IonList>

				<IonList inset>
					<IonListHeader>
						<IonIcon icon={eye} slot="start" style={{ marginRight: 8 }} />
						Sharing
					</IonListHeader>

					<IonItem>
						<IonToggle
							checked={settings.shareOnlineStatus}
							onIonChange={(e) =>
								updateSettings({ shareOnlineStatus: e.detail.checked })
							}
						>
							Show Online Status
						</IonToggle>
					</IonItem>

					<IonItem>
						<IonToggle
							checked={settings.shareWorkoutStatus}
							onIonChange={(e) =>
								updateSettings({ shareWorkoutStatus: e.detail.checked })
							}
						>
							Show Workout Status
						</IonToggle>
					</IonItem>

					<IonItem>
						<IonToggle
							checked={settings.shareWorkoutHistory}
							onIonChange={(e) =>
								updateSettings({ shareWorkoutHistory: e.detail.checked })
							}
						>
							Share Workout History
						</IonToggle>
					</IonItem>
				</IonList>

				<IonList inset>
					<IonListHeader>Account</IonListHeader>

					<IonItem button onClick={handleLogout} detail={false}>
						<IonIcon slot="start" icon={logOut} color="primary" />
						<IonLabel color="primary">Log Out</IonLabel>
					</IonItem>
				</IonList>

				<IonList inset>
					<IonListHeader>Destructive</IonListHeader>

					<IonItem
						button
						onClick={() => setShowWipeConfirm(true)}
						disabled={isWiping}
						detail={false}
					>
						<IonIcon slot="start" icon={cloudDownload} color="warning" />
						<IonLabel color="warning">
							{isWiping ? "Wiping..." : "Wipe Local Data"}
						</IonLabel>
					</IonItem>

					<IonItem button onClick={handleDeleteAccount} detail={false}>
						<IonIcon slot="start" icon={trash} color="danger" />
						<IonLabel color="danger">Delete Account</IonLabel>
					</IonItem>
				</IonList>

				<IonList inset>
					<IonListHeader>Build Info</IonListHeader>

					<IonItem>
						<IonLabel>
							<p>Commit</p>
						</IonLabel>
						<IonText slot="end" color="medium">
							{__COMMIT_HASH__}
						</IonText>
					</IonItem>

					<IonItem>
						<IonLabel>
							<p>Built</p>
						</IonLabel>
						<IonText slot="end" color="medium">
							{new Date(__BUILD_TIME__).toLocaleString(undefined, {
								month: "numeric",
								day: "numeric",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
								hour12: false,
							})}
						</IonText>
					</IonItem>

					<IonItem
						button
						onClick={async () => {
							// Force service worker update check and reload
							if ("serviceWorker" in navigator) {
								const registrations =
									await navigator.serviceWorker.getRegistrations();
								for (const registration of registrations) {
									await registration.update();
									if (registration.waiting) {
										registration.waiting.postMessage({ type: "SKIP_WAITING" });
									}
								}
							}
							window.location.reload();
						}}
						detail={false}
					>
						<IonIcon slot="start" icon={refreshCircle} color="primary" />
						<IonLabel color="primary">Check for Updates</IonLabel>
					</IonItem>
				</IonList>

				<IonModal
					isOpen={showEditUsername}
					onDidDismiss={() => setShowEditUsername(false)}
				>
					<IonHeader>
						<IonToolbar>
							<IonTitle>Change Username</IonTitle>
							<IonButtons slot="end">
								<IonButton onClick={() => setShowEditUsername(false)}>
									Cancel
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>
					<IonContent className="ion-padding">
						<IonInput
							label="New Username"
							labelPlacement="stacked"
							value={newUsername}
							onIonInput={(e) => setNewUsername(e.detail.value ?? "")}
							autocapitalize="off"
							autocorrect="off"
						/>
						<IonButton
							expand="block"
							onClick={handleSaveUsername}
							disabled={isSaving || !newUsername.trim()}
							className="ion-margin-top"
						>
							{isSaving ? "Saving..." : "Save"}
						</IonButton>
					</IonContent>
				</IonModal>

				<IonAlert
					isOpen={showWipeConfirm}
					onDidDismiss={() => setShowWipeConfirm(false)}
					header="Wipe Local Data"
					message="This will clear all locally stored data including any in-progress workout. Your data will be re-downloaded from the server."
					buttons={[
						{
							text: "Cancel",
							role: "cancel",
						},
						{
							text: "Wipe",
							role: "destructive",
							handler: confirmWipeData,
						},
					]}
				/>

				<IonAlert
					isOpen={showDeleteConfirm}
					onDidDismiss={() => setShowDeleteConfirm(false)}
					header="Delete Account"
					message="Are you sure you want to delete your account? This action cannot be undone."
					buttons={[
						{
							text: "Cancel",
							role: "cancel",
						},
						{
							text: "Delete",
							role: "destructive",
							handler: confirmDeleteAccount,
						},
					]}
				/>

				<IonModal
					isOpen={showVerifyEmail}
					onDidDismiss={() => setShowVerifyEmail(false)}
				>
					<IonHeader>
						<IonToolbar>
							<IonTitle>Verify Email</IonTitle>
							<IonButtons slot="end">
								<IonButton onClick={() => setShowVerifyEmail(false)}>
									Cancel
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>
					<IonContent className="ion-padding">
						{verificationStep === "request" ? (
							<>
								<IonText>
									<p>We'll send a verification code to your email address.</p>
								</IonText>
								<IonButton
									expand="block"
									onClick={handleRequestVerification}
									disabled={isVerifying}
									className="ion-margin-top"
								>
									{isVerifying ? "Sending..." : "Send Verification Code"}
								</IonButton>
							</>
						) : (
							<>
								<IonInput
									label="Verification Code"
									labelPlacement="stacked"
									value={verificationCode}
									onIonInput={(e) => setVerificationCode(e.detail.value ?? "")}
									type="text"
									inputmode="numeric"
									maxlength={6}
								/>
								<IonButton
									expand="block"
									onClick={handleVerifyEmail}
									disabled={isVerifying || !verificationCode.trim()}
									className="ion-margin-top"
								>
									{isVerifying ? "Verifying..." : "Verify Email"}
								</IonButton>
								<IonButton
									expand="block"
									fill="clear"
									onClick={handleRequestVerification}
									disabled={isVerifying}
									className="ion-margin-top"
								>
									Resend Code
								</IonButton>
							</>
						)}
					</IonContent>
				</IonModal>

				<IonModal
					isOpen={showChangePassword}
					onDidDismiss={() => setShowChangePassword(false)}
				>
					<IonHeader>
						<IonToolbar>
							<IonTitle>Change Password</IonTitle>
							<IonButtons slot="end">
								<IonButton onClick={() => setShowChangePassword(false)}>
									Cancel
								</IonButton>
							</IonButtons>
						</IonToolbar>
					</IonHeader>
					<IonContent className="ion-padding">
						{passwordStep === "request" ? (
							<>
								<IonText>
									<p>
										We'll send a verification code to your email to confirm the
										password change.
									</p>
								</IonText>
								<IonButton
									expand="block"
									onClick={handleRequestPasswordChange}
									disabled={isChangingPassword}
									className="ion-margin-top"
								>
									{isChangingPassword ? "Sending..." : "Send Verification Code"}
								</IonButton>
							</>
						) : (
							<>
								<IonInput
									label="Verification Code"
									labelPlacement="stacked"
									value={passwordCode}
									onIonInput={(e) => setPasswordCode(e.detail.value ?? "")}
									type="text"
									inputmode="numeric"
									maxlength={6}
									className="ion-margin-bottom"
								/>
								<IonInput
									label="New Password"
									labelPlacement="stacked"
									value={newPassword}
									onIonInput={(e) => setNewPassword(e.detail.value ?? "")}
									type="password"
									className="ion-margin-bottom"
								/>
								<IonInput
									label="Confirm Password"
									labelPlacement="stacked"
									value={confirmPassword}
									onIonInput={(e) => setConfirmPassword(e.detail.value ?? "")}
									type="password"
								/>
								{newPassword &&
									confirmPassword &&
									newPassword !== confirmPassword && (
										<IonText color="danger">
											<p>Passwords do not match</p>
										</IonText>
									)}
								<IonButton
									expand="block"
									onClick={handleChangePassword}
									disabled={
										isChangingPassword ||
										!passwordCode.trim() ||
										!newPassword ||
										newPassword !== confirmPassword
									}
									className="ion-margin-top"
								>
									{isChangingPassword ? "Changing..." : "Change Password"}
								</IonButton>
								<IonButton
									expand="block"
									fill="clear"
									onClick={handleRequestPasswordChange}
									disabled={isChangingPassword}
									className="ion-margin-top"
								>
									Resend Code
								</IonButton>
							</>
						)}
					</IonContent>
				</IonModal>

				<IonToast
					isOpen={showToast}
					onDidDismiss={() => setShowToast(false)}
					message={toastMessage}
					duration={3000}
					position="bottom"
				/>

				<GymManagerModal
					isOpen={showGymManager}
					onDismiss={() => {
						setShowGymManager(false);
						refreshCurrentGym();
					}}
					gyms={gyms}
					onAddGym={addGym}
					onUpdateGym={updateGym}
					onDeleteGym={deleteGym}
				/>
			</IonContent>
		</IonPage>
	);
}
