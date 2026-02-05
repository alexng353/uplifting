import { IonButton, IonIcon } from "@ionic/react";
import { arrowForward, checkmark } from "ionicons/icons";

interface KeyboardAccessoryBarProps {
	isVisible: boolean;
	onNext: () => void;
	onDone: () => void;
	showNext: boolean;
}

export default function KeyboardAccessoryBar({
	isVisible,
	onNext,
	onDone,
	showNext,
}: KeyboardAccessoryBarProps) {
	return (
		<div className={`keyboard-accessory-bar${isVisible ? " is-visible" : ""}`}>
			{showNext && (
				<IonButton
					className="keyboard-accessory-button"
					fill="clear"
					onClick={onNext}
				>
					Next
					<IonIcon slot="end" icon={arrowForward} />
				</IonButton>
			)}
			<IonButton
				className="keyboard-accessory-button done-button"
				fill="clear"
				onClick={onDone}
			>
				Done
				<IonIcon slot="end" icon={checkmark} />
			</IonButton>
		</div>
	);
}
