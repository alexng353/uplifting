use sqlx::query;

use crate::extractors::users::UserId;
use crate::structs::friends::UpdateActivityBody;
use crate::*;

/// Update user activity (heartbeat)
///
/// Call this periodically to update online status and current workout.
/// Should be called every ~60 seconds when app is open.
#[utoipa::path(
    post,
    path = "/activity",
    request_body = UpdateActivityBody,
    responses(
        (status = OK, description = "Activity updated"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::FRIENDS_TAG
)]
pub async fn update_activity(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(body): Json<UpdateActivityBody>,
) -> Result<(), AppError> {
    // Get the workout start time if a workout_id is provided
    let workout_started_at: Option<chrono::NaiveDateTime> =
        if let Some(workout_id) = body.current_workout_id {
            sqlx::query_scalar!(
                r#"SELECT start_time FROM workouts WHERE id = $1 AND user_id = $2"#,
                workout_id,
                user_id
            )
            .fetch_optional(&*state.db)
            .await?
        } else {
            None
        };

    query!(
        r#"
        INSERT INTO user_activity (user_id, last_seen_at, current_workout_id, current_workout_started_at)
        VALUES ($1, NOW(), $2, $3)
        ON CONFLICT (user_id) DO UPDATE
        SET 
            last_seen_at = NOW(),
            current_workout_id = $2,
            current_workout_started_at = COALESCE($3, user_activity.current_workout_started_at)
        "#,
        user_id,
        body.current_workout_id,
        workout_started_at
    )
    .execute(&*state.db)
    .await?;

    Ok(())
}
