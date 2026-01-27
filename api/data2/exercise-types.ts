export type MovementPattern =
  | "horizontal_push"
  | "horizontal_pull"
  | "vertical_push"
  | "vertical_pull"
  | "hip_hinge"
  | "squat"
  | "lunge"
  | "carry"
  | "rotation"
  | "isolation";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "kettlebell"
  | "band"
  | "ez_bar"
  | "trap_bar"
  | "smith_machine"
  | "suspension"
  | "landmine"
  | "medicine_ball"
  | "plate";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "quadriceps"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "adductors"
  | "hip_flexors"
  | "rotator_cuff"
  | "neck";

export interface Exercise {
  name: string;
  movement_pattern: MovementPattern;
  equipment: Equipment[];
  muscle_group: MuscleGroup;
  primary_muscles: string[];
  secondary_muscles: string[];
}
