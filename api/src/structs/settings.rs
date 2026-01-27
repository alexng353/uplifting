use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct UserSettings {
    pub user_id: Uuid,
    pub display_unit: Option<String>,
    pub max_workout_duration_minutes: i32,
    pub default_rest_timer_seconds: i32,
    pub default_privacy: String,
    pub share_gym_location: bool,
    // Sharing settings
    pub share_online_status: bool,
    pub share_workout_status: bool,
    pub share_workout_history: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UpdateSettingsBody {
    pub display_unit: Option<String>,
    pub max_workout_duration_minutes: Option<i32>,
    pub default_rest_timer_seconds: Option<i32>,
    pub default_privacy: Option<String>,
    pub share_gym_location: Option<bool>,
    // Sharing settings
    pub share_online_status: Option<bool>,
    pub share_workout_status: Option<bool>,
    pub share_workout_history: Option<bool>,
}

impl Default for UserSettings {
    fn default() -> Self {
        Self {
            user_id: Uuid::nil(),
            display_unit: None,
            max_workout_duration_minutes: 120,
            default_rest_timer_seconds: 90,
            default_privacy: "friends".to_string(),
            share_gym_location: true,
            share_online_status: true,
            share_workout_status: true,
            share_workout_history: true,
        }
    }
}
