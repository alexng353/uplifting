use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Gym {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct CreateGymBody {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UpdateGymBody {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct GymProfileMapping {
    pub id: Uuid,
    pub user_id: Uuid,
    pub gym_id: Uuid,
    pub exercise_id: Uuid,
    pub profile_id: Uuid,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SetGymProfileMappingBody {
    pub exercise_id: Uuid,
    pub profile_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct GymProfileMappingResponse {
    pub exercise_id: Uuid,
    pub profile_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SetCurrentGymBody {
    pub gym_id: Option<Uuid>,
}
