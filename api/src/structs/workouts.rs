use chrono::NaiveDateTime;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

use super::sets::UserSet;

/// The kind of workout entry
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema, Default, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WorkoutKind {
    #[default]
    Workout,
    Rest,
}

impl From<String> for WorkoutKind {
    fn from(s: String) -> Self {
        match s.as_str() {
            "rest" => WorkoutKind::Rest,
            _ => WorkoutKind::Workout,
        }
    }
}

impl From<WorkoutKind> for String {
    fn from(kind: WorkoutKind) -> Self {
        match kind {
            WorkoutKind::Workout => "workout".to_string(),
            WorkoutKind::Rest => "rest".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Workout {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: Option<String>,
    pub start_time: NaiveDateTime,
    pub end_time: Option<NaiveDateTime>,
    pub privacy: String,
    pub gym_location: Option<String>,
    #[sqlx(try_from = "String")]
    pub kind: WorkoutKind,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct WorkoutWithSets {
    #[serde(flatten)]
    pub workout: Workout,
    pub sets: Vec<UserSet>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct WorkoutSummary {
    pub id: Uuid,
    pub name: Option<String>,
    pub start_time: NaiveDateTime,
    pub end_time: Option<NaiveDateTime>,
    pub duration_minutes: i64,
    pub total_volume: Decimal,
    pub total_sets: i64,
    pub total_reps: i64,
    pub exercises_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CreateWorkoutBody {
    pub name: Option<String>,
    pub privacy: Option<String>,
    pub gym_location: Option<String>,
    #[serde(default)]
    pub kind: WorkoutKind,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UpdateWorkoutBody {
    pub name: Option<String>,
    pub privacy: Option<String>,
    pub gym_location: Option<String>,
    pub end_time: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct WorkoutListResponse {
    pub workouts: Vec<Workout>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}
