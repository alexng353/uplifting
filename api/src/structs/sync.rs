use std::collections::HashMap;

use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

use super::gyms::Gym;
use super::profiles::ExerciseProfile;
use super::serde_utils::JSDate;
use super::sets::PreviousSetData;
use super::workouts::WorkoutKind;

/// Request to sync a completed workout from offline storage
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SyncWorkoutRequest {
    pub name: Option<String>,
    pub start_time: JSDate,
    pub end_time: JSDate,
    pub privacy: String,
    pub gym_location: Option<String>,
    pub exercises: Vec<SyncExercise>,
    #[serde(default)]
    pub kind: WorkoutKind,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SyncExercise {
    pub exercise_id: Uuid,
    pub profile_id: Option<Uuid>,
    pub sets: Vec<SyncSet>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SyncSet {
    pub reps: i32,
    pub weight: Decimal,
    pub weight_unit: String,
    pub created_at: JSDate,
    /// Side for unilateral exercises: "L" or "R"
    pub side: Option<String>,
}

/// Response after syncing a workout
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SyncWorkoutResponse {
    pub workout_id: Uuid,
    /// Updated previous sets data for exercises used in this workout
    pub previous_sets: Vec<PreviousSetData>,
}

/// Response containing all user data for initial bootstrap
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct BootstrapResponse {
    pub gyms: Vec<Gym>,
    pub profiles: Vec<ExerciseProfile>,
    pub gym_profile_mappings: Vec<BootstrapGymProfileMapping>,
    /// Previous sets keyed by "{exercise_id}_{profile_id}" or "{exercise_id}_default"
    pub previous_sets: HashMap<String, Vec<BootstrapPreviousSet>>,
}

/// Gym profile mapping for bootstrap (includes gym_id)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct BootstrapGymProfileMapping {
    pub gym_id: Uuid,
    pub exercise_id: Uuid,
    pub profile_id: Uuid,
}

/// Previous set data for bootstrap
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct BootstrapPreviousSet {
    pub reps: i32,
    pub weight: Decimal,
    pub weight_unit: String,
    pub side: Option<String>,
}
