use axum::extract::Query;
use serde::Deserialize;
use sqlx::query_as;

use crate::extractors::users::UserId;
use crate::structs::friends::FeedItem;
use crate::*;

#[derive(Debug, Deserialize, ToSchema)]
pub struct FeedQuery {
    #[serde(default = "default_limit")]
    pub limit: i64,
    #[serde(default)]
    pub offset: i64,
}

fn default_limit() -> i64 {
    20
}

/// Get friends' activity feed
#[utoipa::path(
    get,
    path = "/feed",
    params(
        ("limit" = Option<i64>, Query, description = "Number of items (default: 20)"),
        ("offset" = Option<i64>, Query, description = "Offset for pagination")
    ),
    responses(
        (status = OK, body = Vec<FeedItem>),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::FRIENDS_TAG
)]
pub async fn get_feed(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Query(query): Query<FeedQuery>,
) -> Result<Json<Vec<FeedItem>>, AppError> {
    let feed = query_as!(
        FeedItem,
        r#"
        SELECT 
            w.id as workout_id,
            u.id as user_id,
            u.username,
            u.real_name,
            u.avatar_url,
            w.name as workout_name,
            w.start_time,
            w.end_time,
            EXTRACT(EPOCH FROM (COALESCE(w.end_time, NOW()) - w.start_time))::bigint / 60 as duration_minutes,
            (SELECT SUM(s.weight * s.reps) FROM user_sets s WHERE s.workout_id = w.id) as total_volume,
            (SELECT COUNT(*) FROM user_sets s WHERE s.workout_id = w.id) as total_sets,
            w.gym_location
        FROM workouts w
        JOIN users u ON u.id = w.user_id
        WHERE w.privacy = 'friends'
          AND w.end_time IS NOT NULL
          AND (
            -- Friends where I sent the request
            EXISTS (
                SELECT 1 FROM friendships f 
                WHERE f.user_id = $1 AND f.friend_id = w.user_id AND f.status = 'accepted'
            )
            OR
            -- Friends where they sent the request
            EXISTS (
                SELECT 1 FROM friendships f 
                WHERE f.friend_id = $1 AND f.user_id = w.user_id AND f.status = 'accepted'
            )
          )
        ORDER BY w.end_time DESC
        LIMIT $2 OFFSET $3
        "#,
        user_id,
        query.limit,
        query.offset
    )
    .fetch_all(&*state.db)
    .await?;

    Ok(Json(feed))
}
