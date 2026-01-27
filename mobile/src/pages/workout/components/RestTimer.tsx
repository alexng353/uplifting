import { IonButton, IonIcon } from "@ionic/react";
import { pauseOutline, playOutline } from "ionicons/icons";
import { useCallback, useEffect, useRef, useState } from "react";

type RestTimerProps = {
	isHidden?: boolean;
};

export default function RestTimer({ isHidden = false }: RestTimerProps) {
	const [elapsedMs, setElapsedMs] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const longPressTriggered = useRef(false);
	const elapsedMsRef = useRef(elapsedMs);

	// Keep ref in sync with state
	useEffect(() => {
		elapsedMsRef.current = elapsedMs;
	}, [elapsedMs]);

	// Format milliseconds to MM:SS
	const formatTime = (ms: number): string => {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
	};

	useEffect(() => {
		if (isRunning) {
			const startTime = Date.now() - elapsedMsRef.current;
			intervalRef.current = setInterval(() => {
				setElapsedMs(Date.now() - startTime);
			}, 100);
		} else if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [isRunning]);

	const handleClick = useCallback(() => {
		// Don't toggle if long press was just triggered
		if (longPressTriggered.current) {
			longPressTriggered.current = false;
			return;
		}
		setIsRunning((prev) => !prev);
	}, []);

	const handlePointerDown = useCallback(() => {
		longPressTriggered.current = false;
		longPressRef.current = setTimeout(() => {
			longPressTriggered.current = true;
			// Reset timer
			setIsRunning(false);
			setElapsedMs(0);
		}, 600);
	}, []);

	const handlePointerUp = useCallback(() => {
		if (longPressRef.current) {
			clearTimeout(longPressRef.current);
			longPressRef.current = null;
		}
	}, []);

	const handlePointerLeave = useCallback(() => {
		if (longPressRef.current) {
			clearTimeout(longPressRef.current);
			longPressRef.current = null;
		}
	}, []);

	return (
		<div className={`rest-timer-container${isHidden ? " is-hidden" : ""}`}>
			<div className="rest-timer-display">{formatTime(elapsedMs)}</div>
			<IonButton
				className="rest-timer-button"
				fill="solid"
				color={isRunning ? "warning" : "primary"}
				onClick={handleClick}
				onPointerDown={handlePointerDown}
				onPointerUp={handlePointerUp}
				onPointerLeave={handlePointerLeave}
			>
				<IonIcon
					slot="icon-only"
					icon={isRunning ? pauseOutline : playOutline}
				/>
			</IonButton>
		</div>
	);
}
