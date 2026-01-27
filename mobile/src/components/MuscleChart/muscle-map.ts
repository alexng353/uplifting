// Maps simplified muscle group IDs to their SVG regions and API muscle names
// The `apiNames` array contains muscle names as they appear in the backend exercise data

export type MuscleView = "front" | "back" | "both";

export interface MuscleGroup {
	id: string;
	view: MuscleView;
	label: string;
	apiNames: string[]; // Names from the API that map to this visual group
}

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = {
	// === FRONT VIEW ===
	chest: {
		id: "chest",
		view: "front",
		label: "Chest",
		apiNames: ["pectoralis major", "pectoralis minor", "chest"],
	},
	front_delts: {
		id: "front_delts",
		view: "front",
		label: "Front Delts",
		apiNames: ["deltoid, anterior part", "anterior deltoid", "front deltoid"],
	},
	biceps: {
		id: "biceps",
		view: "front",
		label: "Biceps",
		apiNames: ["biceps brachii", "biceps"],
	},
	forearms_front: {
		id: "forearms_front",
		view: "front",
		label: "Forearms",
		apiNames: [
			"brachioradialis",
			"flexor carpi radialis",
			"flexor carpi ulnaris",
			"forearms",
		],
	},
	abs: {
		id: "abs",
		view: "front",
		label: "Abs",
		apiNames: ["rectus abdominis", "abs", "abdominals"],
	},
	obliques: {
		id: "obliques",
		view: "front",
		label: "Obliques",
		apiNames: ["external oblique", "internal oblique", "obliques"],
	},
	quads: {
		id: "quads",
		view: "front",
		label: "Quads",
		apiNames: [
			"quadriceps",
			"vastus lateralis",
			"vastus medialis",
			"vastus intermedius",
			"rectus femoris",
			"quads",
		],
	},
	hip_flexors: {
		id: "hip_flexors",
		view: "front",
		label: "Hip Flexors",
		apiNames: ["iliopsoas", "psoas major", "iliacus", "hip flexors"],
	},
	adductors: {
		id: "adductors",
		view: "front",
		label: "Adductors",
		apiNames: [
			"adductor magnus",
			"adductor longus",
			"adductor brevis",
			"adductors",
		],
	},
	tibialis: {
		id: "tibialis",
		view: "front",
		label: "Tibialis",
		apiNames: ["tibialis anterior", "shins"],
	},

	// === BACK VIEW ===
	traps: {
		id: "traps",
		view: "back",
		label: "Traps",
		apiNames: ["trapezius", "traps"],
	},
	rear_delts: {
		id: "rear_delts",
		view: "back",
		label: "Rear Delts",
		apiNames: ["deltoid, posterior part", "posterior deltoid", "rear deltoid"],
	},
	lats: {
		id: "lats",
		view: "back",
		label: "Lats",
		apiNames: ["latissimus dorsi", "lats"],
	},
	rhomboids: {
		id: "rhomboids",
		view: "back",
		label: "Rhomboids",
		apiNames: ["rhomboid major", "rhomboid minor", "rhomboids"],
	},
	lower_back: {
		id: "lower_back",
		view: "back",
		label: "Lower Back",
		apiNames: ["erector spinae", "lower back", "spinal erectors"],
	},
	glutes: {
		id: "glutes",
		view: "back",
		label: "Glutes",
		apiNames: [
			"gluteus maximus",
			"gluteus medius",
			"gluteus minimus",
			"glutes",
		],
	},
	hamstrings: {
		id: "hamstrings",
		view: "back",
		label: "Hamstrings",
		apiNames: [
			"biceps femoris",
			"semitendinosus",
			"semimembranosus",
			"hamstrings",
		],
	},
	calves: {
		id: "calves",
		view: "back",
		label: "Calves",
		apiNames: ["gastrocnemius", "soleus", "calves"],
	},
	forearms_back: {
		id: "forearms_back",
		view: "back",
		label: "Forearms",
		apiNames: [
			"extensor carpi radialis",
			"extensor carpi ulnaris",
			"extensor digitorum",
		],
	},

	// === BOTH VIEWS (shown on front and back) ===
	side_delts: {
		id: "side_delts",
		view: "both",
		label: "Side Delts",
		apiNames: ["deltoid, lateral part", "lateral deltoid", "side deltoid"],
	},
	triceps: {
		id: "triceps",
		view: "both",
		label: "Triceps",
		apiNames: ["triceps brachii", "triceps"],
	},
	neck: {
		id: "neck",
		view: "both",
		label: "Neck",
		apiNames: ["sternocleidomastoid", "neck", "scalenes"],
	},
} as const;

// Helper to find which muscle group an API muscle name belongs to
export function findMuscleGroup(apiMuscleName: string): string | null {
	const normalized = apiMuscleName.toLowerCase().trim();

	for (const [groupId, group] of Object.entries(MUSCLE_GROUPS)) {
		if (
			group.apiNames.some(
				(name) =>
					normalized.includes(name.toLowerCase()) ||
					name.toLowerCase().includes(normalized),
			)
		) {
			return groupId;
		}
	}

	return null;
}

// Get all muscle groups for a specific view
export function getMuscleGroupsForView(
	view: "front" | "back",
): Record<string, MuscleGroup> {
	return Object.fromEntries(
		Object.entries(MUSCLE_GROUPS).filter(
			([_, group]) => group.view === view || group.view === "both",
		),
	);
}

// Calculate total muscle groups and how many are trained
export function calculateMusclePercentage(
	trainedMuscles: Record<string, "primary" | "secondary" | "none">,
): number {
	const totalGroups = Object.keys(MUSCLE_GROUPS).length;
	const trainedGroups = Object.values(trainedMuscles).filter(
		(status) => status === "primary" || status === "secondary",
	).length;

	return Math.round((trainedGroups / totalGroups) * 100);
}
