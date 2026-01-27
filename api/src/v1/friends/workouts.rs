use axum::extract::{Path, Query};
use rust_decimal::Decimal;
use serde::Deserialize;
use sqlx::query_as;
use utoipa::IntoParams;
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::structs::workouts::WorkoutSummary;
use crate::*;

#[derive(Debug, Deserialize, IntoParams)]
pub struct FriendWorkoutsQuery {
    #[serde(default = "default_limit")]
    pub limit: i64,
    #[serde(default)]
    pub offset: i64,
}

fn default_limit() -> i64 {
    20
}

/// Response for friend workouts including week summary
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct FriendWorkoutsResponse {
    pub workouts: Vec<WorkoutSummary>,
    pub this_week_count: i64,
    pub this_week_volume: Decimal,
    pub this_week_duration_minutes: i64,
    pub can_view: bool,
}

/// Get a friend's workout history
///
/// Returns the friend's workouts if they have sharing enabled and you are friends.
#[utoipa::path(
    get,
    path = "/{friend_id}/workouts",
    params(
        ("friend_id" = Uuid, Path, description = "Friend's user ID"),
        FriendWorkoutsQuery
    ),
    responses(
        (status = OK, body = FriendWorkoutsResponse),
        (status = FORBIDDEN, description = "Not friends or sharing disabled"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::FRIENDS_TAG
)]
pub async fn get_friend_workouts(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(friend_id): Path<Uuid>,
    Query(query): Query<FriendWorkoutsQuery>,
) -> Result<Json<FriendWorkoutsResponse>, AppError> {
    // Check if they are friends
    let is_friend = sqlx::query_scalar!(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM friendships
            WHERE status = 'accepted' AND (
                (user_id = $1 AND friend_id = $2) OR
                (user_id = $2 AND friend_id = $1)
            )
        ) as "exists!"
        "#,
        user_id,
        friend_id
    )
    .fetch_one(&*state.db)
    .await?;

    if !is_friend {
        return Err(AppError::forbidden("Not friends with this user"));
    }

    // Check if the friend has sharing enabled
    let can_share = sqlx::query_scalar!(
        r#"
        SELECT COALESCE(share_workout_history, true) as "can_share!"
        FROM user_settings
        WHERE user_id = $1
        "#,
        friend_id
    )
    .fetch_optional(&*state.db)
    .await?
    .unwrap_or(true);

    if !can_share {
        return Ok(Json(FriendWorkoutsResponse {
            workouts: vec![],
            this_week_count: 0,
            this_week_volume: Decimal::ZERO,
            this_week_duration_minutes: 0,
            can_view: false,
        }));
    }

    // Get this week's summary (Monday to Sunday)
    let week_stats = sqlx::query!(
        r#"
        SELECT 
            COUNT(*)::bigint as "count!",
            COALESCE(SUM(
                (SELECT COALESCE(SUM(s.weight * s.reps), 0) FROM user_sets s WHERE s.workout_id = w.id)
            ), 0) as "volume!",
            COALESCE(SUM(
                EXTRACT(EPOCH FROM (COALESCE(w.end_time, NOW()) - w.start_time))::bigint / 60
            ), 0)::bigint as "duration!"
        FROM workouts w
        WHERE w.user_id = $1 
          AND w.end_time IS NOT NULL
          AND w.kind = 'workout'
          AND w.start_time >= date_trunc('week', CURRENT_DATE)
        "#,
        friend_id
    )
    .fetch_one(&*state.db)
    .await?;

    // Get workout history
    let workouts = query_as!(
        WorkoutSummary,
        r#"
        SELECT 
            w.id,
            w.name,
            w.start_time,
            w.end_time,
            EXTRACT(EPOCH FROM (COALESCE(w.end_time, NOW()) - w.start_time))::bigint / 60 as "duration_minutes!",
            COALESCE((SELECT SUM(s.weight * s.reps) FROM user_sets s WHERE s.workout_id = w.id), 0) as "total_volume!",
            (SELECT COUNT(*) FROM user_sets s WHERE s.workout_id = w.id)::bigint as "total_sets!",
            (SELECT COALESCE(SUM(s.reps), 0) FROM user_sets s WHERE s.workout_id = w.id)::bigint as "total_reps!",
            (SELECT COUNT(DISTINCT s.exercise_id) FROM user_sets s WHERE s.workout_id = w.id)::bigint as "exercises_count!"
        FROM workouts w
        WHERE w.user_id = $1 
          AND w.end_time IS NOT NULL
          AND w.kind = 'workout'
          AND w.privacy IN ('friends', 'public')
        ORDER BY w.end_time DESC
        LIMIT $2 OFFSET $3
        "#,
        friend_id,
        query.limit,
        query.offset
    )
    .fetch_all(&*state.db)
    .await?;

    Ok(Json(FriendWorkoutsResponse {
        workouts,
        this_week_count: week_stats.count,
        this_week_volume: week_stats.volume,
        this_week_duration_minutes: week_stats.duration,
        can_view: true,
    }))
}
