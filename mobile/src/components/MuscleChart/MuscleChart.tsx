import { useCallback } from "react";
import "./MuscleChart.css";
import { MuscleChartBack } from "./MuscleChartBack";
import { MuscleChartFront } from "./MuscleChartFront";

export type MuscleStatus = "primary" | "secondary" | "none";

export interface MuscleStatusMap {
	[muscleId: string]: MuscleStatus;
}

interface MuscleChartProps {
	/**
	 * Map of muscle group IDs to their training status
	 * e.g., { chest: "primary", biceps: "secondary", abs: "none" }
	 */
	muscles: MuscleStatusMap;
	/**
	 * Which view to display
	 */
	view: "front" | "back";
}

/**
 * MuscleChart Component
 *
 * Displays a human body diagram with muscles colored based on training status.
 *
 * Usage:
 * ```tsx
 * const trainedMuscles = {
 *   chest: "primary",
 *   biceps: "secondary",
 *   triceps: "primary",
 * };
 *
 * <MuscleChart muscles={trainedMuscles} view="front" />
 * ```
 */
export function MuscleChart({ muscles, view }: MuscleChartProps) {
	const getColor = useCallback(
		(muscleId: string): string => {
			const status = muscles[muscleId] ?? "none";

			switch (status) {
				case "primary":
					return "var(--muscle-color-primary, var(--ion-color-primary))";
				case "secondary":
					return "var(--muscle-color-secondary, var(--ion-color-primary-tint))";
				default:
					return "var(--muscle-color-none, var(--ion-color-medium-tint))";
			}
		},
		[muscles],
	);

	return (
		<div className="muscle-chart-wrapper">
			{view === "front" ? (
				<MuscleChartFront getColor={getColor} />
			) : (
				<MuscleChartBack getColor={getColor} />
			)}
		</div>
	);
}

export type { MuscleGroup, MuscleView } from "./muscle-map";
// Re-export utilities
export {
	calculateMusclePercentage,
	findMuscleGroup,
	MUSCLE_GROUPS,
} from "./muscle-map";
