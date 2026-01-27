use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum FriendStatus {
    Pending,
    Accepted,
    Blocked,
}

impl std::fmt::Display for FriendStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FriendStatus::Pending => write!(f, "pending"),
            FriendStatus::Accepted => write!(f, "accepted"),
            FriendStatus::Blocked => write!(f, "blocked"),
        }
    }
}

impl std::str::FromStr for FriendStatus {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "pending" => Ok(FriendStatus::Pending),
            "accepted" => Ok(FriendStatus::Accepted),
            "blocked" => Ok(FriendStatus::Blocked),
            _ => Err(anyhow::anyhow!("Invalid friend status: {}", s)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct Friendship {
    pub id: Uuid,
    pub user_id: Uuid,
    pub friend_id: Uuid,
    pub status: String,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct FriendWithProfile {
    pub friendship_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub real_name: String,
    pub avatar_url: Option<String>,
    pub status: String,
    pub created_at: NaiveDateTime,
}

/// Friend with activity status (online, in workout)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct FriendWithStatus {
    pub friendship_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub real_name: String,
    pub avatar_url: Option<String>,
    pub status: String,
    pub created_at: NaiveDateTime,
    // Activity status (null if sharing is disabled)
    pub is_online: Option<bool>,
    pub is_in_workout: Option<bool>,
    pub current_workout_name: Option<String>,
    pub current_workout_started_at: Option<NaiveDateTime>,
}

/// User activity tracking
#[derive(Debug, Clone, Serialize, Deserialize, FromRow, ToSchema)]
pub struct UserActivity {
    pub user_id: Uuid,
    pub last_seen_at: NaiveDateTime,
    pub current_workout_id: Option<Uuid>,
    pub current_workout_started_at: Option<NaiveDateTime>,
}

/// Request body for updating activity (heartbeat)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct UpdateActivityBody {
    pub current_workout_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct SendFriendRequestBody {
    pub friend_id: Uuid,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RespondFriendRequestBody {
    pub action: String, // "accept", "decline", "block"
}

/// Feed item showing a friend's workout
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct FeedItem {
    pub workout_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub real_name: String,
    pub avatar_url: Option<String>,
    pub workout_name: Option<String>,
    pub start_time: NaiveDateTime,
    pub end_time: Option<NaiveDateTime>,
    pub duration_minutes: Option<i64>,
    pub total_volume: Option<rust_decimal::Decimal>,
    pub total_sets: Option<i64>,
    pub gym_location: Option<String>,
}
