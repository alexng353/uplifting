use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct UserProfile {
    pub id: Uuid,
    pub username: String,
    pub real_name: String,
    pub email: String,
    pub avatar_url: Option<String>,
    pub email_verified: bool,
    pub is_admin: bool,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UpdateProfileBody {
    pub username: Option<String>,
    pub real_name: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UserSearchResult {
    pub id: Uuid,
    pub username: String,
    pub real_name: String,
    pub avatar_url: Option<String>,
}
