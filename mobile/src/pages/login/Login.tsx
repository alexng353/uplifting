import {
	IonButton,
	IonContent,
	IonHeader,
	IonInput,
	IonPage,
	IonText,
	IonTitle,
	IonToast,
	IonToolbar,
} from "@ionic/react";
import { useCallback, useState } from "react";
import "./Login.css";
import { useAuth } from "../../hooks/useAuth";
import {
	useLoginMutation,
	useSignupMutation,
} from "../../hooks/useAuth.mutations";

export default function Login() {
	const { login } = useAuth();
	const [isRegistering, setIsRegistering] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [realName, setRealName] = useState("");
	const [email, setEmail] = useState("");
	const [errorMessage, setErrorMessage] = useState("");
	const [showError, setShowError] = useState(false);

	const loginMutation = useLoginMutation();
	const signupMutation = useSignupMutation();

	const title = isRegistering ? "Register" : "Login";

	const handleLogin = useCallback(async () => {
		try {
			const data = await loginMutation.mutateAsync({ username, password });
			await login(data);
		} catch (error) {
			console.error("Failed to login", error);
			setErrorMessage("Invalid username or password");
			setShowError(true);
		}
	}, [username, password, login, loginMutation]);

	const handleRegister = useCallback(async () => {
		try {
			const data = await signupMutation.mutateAsync({
				username,
				password,
				real_name: realName,
				email,
			});
			await login(data);
		} catch (error) {
			console.error("Failed to register", error);
			setErrorMessage("Registration failed. Username may already be taken.");
			setShowError(true);
		}
	}, [username, password, realName, email, login, signupMutation]);

	const handleClick = useCallback(() => {
		if (isRegistering) {
			handleRegister();
		} else {
			handleLogin();
		}
	}, [isRegistering, handleLogin, handleRegister]);

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>{title}</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent>
				<IonHeader collapse="condense">
					<IonToolbar>
						<IonTitle size="large">{title}</IonTitle>
					</IonToolbar>
				</IonHeader>
				<div className="login-container">
					<div className="login-form">
						{isRegistering && (
							<>
								<IonInput
									type="text"
									placeholder="Full Name"
									value={realName}
									onIonInput={(e) => setRealName(e.detail.value ?? "")}
								/>
								<IonInput
									type="email"
									placeholder="Email"
									value={email}
									onIonInput={(e) => setEmail(e.detail.value ?? "")}
								/>
							</>
						)}
						<IonInput
							type="text"
							placeholder="Username"
							value={username}
							onIonInput={(e) => setUsername(e.detail.value ?? "")}
							autocapitalize="off"
							autocorrect="off"
							spellcheck={false}
						/>
						<IonInput
							type="password"
							placeholder="Password"
							value={password}
							onIonInput={(e) => setPassword(e.detail.value ?? "")}
						/>
						<div className="login-form-buttons">
							<IonButton onClick={handleClick} expand="block">
								{isRegistering ? "Register" : "Login"}
							</IonButton>
						</div>
						<div className="login-toggle">
							<IonText color="medium">
								{isRegistering
									? "Already have an account?"
									: "Don't have an account?"}
							</IonText>
							<IonButton
								fill="clear"
								size="small"
								onClick={() => setIsRegistering(!isRegistering)}
							>
								{isRegistering ? "Login" : "Register"}
							</IonButton>
						</div>
					</div>
				</div>

				<IonToast
					isOpen={showError}
					onDidDismiss={() => setShowError(false)}
					message={errorMessage}
					duration={3000}
					position="bottom"
					color="danger"
				/>
			</IonContent>
		</IonPage>
	);
}
