use chrono::NaiveDateTime;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct UserSet {
    pub id: Uuid,
    pub user_id: Uuid,
    pub exercise_id: Uuid,
    pub workout_id: Uuid,
    pub profile_id: Option<Uuid>,
    pub reps: i32,
    pub weight: Decimal,
    pub weight_unit: String,
    pub created_at: NaiveDateTime,
    /// Side for unilateral exercises: "L" or "R"
    pub side: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CreateSetBody {
    pub exercise_id: Uuid,
    pub profile_id: Option<Uuid>,
    pub reps: i32,
    pub weight: Decimal,
    pub weight_unit: String,
    /// Side for unilateral exercises: "L" or "R"
    pub side: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UpdateSetBody {
    pub reps: Option<i32>,
    pub weight: Option<Decimal>,
    pub weight_unit: Option<String>,
}

/// Previous session data for an exercise+profile combination
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PreviousSetData {
    pub exercise_id: Uuid,
    pub profile_id: Option<Uuid>,
    pub sets: Vec<PreviousSet>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct PreviousSet {
    pub reps: i32,
    pub weight: Decimal,
    pub weight_unit: String,
    /// Side for unilateral exercises: "L" or "R"
    pub side: Option<String>,
}
