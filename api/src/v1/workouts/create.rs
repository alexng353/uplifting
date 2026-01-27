use sqlx::query_as;

use crate::extractors::users::UserId;
use crate::structs::workouts::{CreateWorkoutBody, Workout};
use crate::*;

/// Create a new workout
#[utoipa::path(
    post,
    path = "",
    request_body = CreateWorkoutBody,
    responses(
        (status = OK, body = Workout),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::WORKOUTS_TAG
)]
pub async fn create_workout(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(body): Json<CreateWorkoutBody>,
) -> Result<Json<Workout>, AppError> {
    let privacy = body.privacy.unwrap_or_else(|| "friends".to_string());
    let kind: String = body.kind.into();

    let workout = query_as!(
        Workout,
        r#"
        INSERT INTO workouts (user_id, name, start_time, privacy, gym_location, kind)
        VALUES ($1, $2, NOW(), $3, $4, $5)
        RETURNING id, user_id, name, start_time, end_time, privacy, gym_location, kind
        "#,
        user_id,
        body.name,
        privacy,
        body.gym_location,
        kind
    )
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(workout))
}
