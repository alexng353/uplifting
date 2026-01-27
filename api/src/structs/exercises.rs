use chrono::NaiveDateTime;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

use super::exercise_types::ExerciseType;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Exercise {
    pub id: Uuid,
    pub name: String,
    pub exercise_type: ExerciseType,
    pub official: bool,
    pub author_id: Option<Uuid>,
    pub description: Option<String>,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ExerciseWithDetails {
    #[serde(flatten)]
    pub exercise: Exercise,
    pub primary_muscles: Vec<String>,
    pub secondary_muscles: Vec<String>,
    pub is_favourite: bool,
    pub personal_record: Option<PersonalRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PersonalRecord {
    pub weight: Decimal,
    pub weight_unit: String,
    pub reps: i32,
    pub date: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct ExerciseListResponse {
    pub exercises: Vec<Exercise>,
    pub total: i64,
}
