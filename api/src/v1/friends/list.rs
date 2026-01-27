use chrono::{NaiveDateTime, Utc};
use sqlx::{query_as, FromRow};

use crate::extractors::users::UserId;
use crate::structs::friends::FriendWithStatus;
use crate::*;

// Internal struct for the raw query result
#[derive(FromRow)]
struct FriendRow {
    friendship_id: uuid::Uuid,
    user_id: uuid::Uuid,
    username: String,
    real_name: String,
    avatar_url: Option<String>,
    status: String,
    created_at: NaiveDateTime,
    // Activity data
    last_seen_at: Option<NaiveDateTime>,
    current_workout_id: Option<uuid::Uuid>,
    current_workout_started_at: Option<NaiveDateTime>,
    current_workout_name: Option<String>,
    // Settings
    share_online_status: Option<bool>,
    share_workout_status: Option<bool>,
    max_workout_duration_minutes: Option<i32>,
}

/// List accepted friends with activity status
#[utoipa::path(
    get,
    path = "",
    responses(
        (status = OK, body = Vec<FriendWithStatus>),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::FRIENDS_TAG
)]
pub async fn list_friends(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<Vec<FriendWithStatus>>, AppError> {
    let rows = query_as!(
        FriendRow,
        r#"
        SELECT * FROM (
            SELECT 
                f.id as "friendship_id!",
                u.id as "user_id!",
                u.username as "username!",
                u.real_name as "real_name!",
                u.avatar_url,
                f.status as "status!",
                f.created_at as "created_at!",
                ua.last_seen_at,
                ua.current_workout_id,
                ua.current_workout_started_at,
                w.name as current_workout_name,
                us.share_online_status,
                us.share_workout_status,
                us.max_workout_duration_minutes
            FROM friendships f
            JOIN users u ON u.id = f.friend_id
            LEFT JOIN user_activity ua ON ua.user_id = u.id
            LEFT JOIN user_settings us ON us.user_id = u.id
            LEFT JOIN workouts w ON w.id = ua.current_workout_id
            WHERE f.user_id = $1 AND f.status = 'accepted'
            UNION
            SELECT 
                f.id as "friendship_id!",
                u.id as "user_id!",
                u.username as "username!",
                u.real_name as "real_name!",
                u.avatar_url,
                f.status as "status!",
                f.created_at as "created_at!",
                ua.last_seen_at,
                ua.current_workout_id,
                ua.current_workout_started_at,
                w.name as current_workout_name,
                us.share_online_status,
                us.share_workout_status,
                us.max_workout_duration_minutes
            FROM friendships f
            JOIN users u ON u.id = f.user_id
            LEFT JOIN user_activity ua ON ua.user_id = u.id
            LEFT JOIN user_settings us ON us.user_id = u.id
            LEFT JOIN workouts w ON w.id = ua.current_workout_id
            WHERE f.friend_id = $1 AND f.status = 'accepted'
        ) friends
        ORDER BY "created_at!" DESC
        "#,
        user_id
    )
    .fetch_all(&*state.db)
    .await?;

    let now = Utc::now().naive_utc();
    let online_threshold = chrono::Duration::minutes(5);

    let friends: Vec<FriendWithStatus> = rows
        .into_iter()
        .map(|row| {
            // Determine online status based on settings and last_seen
            let is_online = if row.share_online_status.unwrap_or(true) {
                row.last_seen_at
                    .map(|last_seen| now - last_seen < online_threshold)
            } else {
                None
            };

            // Determine workout status based on settings and max duration
            let max_duration = row.max_workout_duration_minutes.unwrap_or(120);
            let is_in_workout = if row.share_workout_status.unwrap_or(true) {
                row.current_workout_started_at.map(|started| {
                    let elapsed = now - started;
                    elapsed < chrono::Duration::minutes(max_duration as i64)
                })
            } else {
                None
            };

            // Only show workout details if sharing is enabled and in workout
            let (workout_name, workout_started) = if is_in_workout == Some(true) {
                (row.current_workout_name, row.current_workout_started_at)
            } else {
                (None, None)
            };

            FriendWithStatus {
                friendship_id: row.friendship_id,
                user_id: row.user_id,
                username: row.username,
                real_name: row.real_name,
                avatar_url: row.avatar_url,
                status: row.status,
                created_at: row.created_at,
                is_online,
                is_in_workout,
                current_workout_name: workout_name,
                current_workout_started_at: workout_started,
            }
        })
        .collect();

    Ok(Json(friends))
}
