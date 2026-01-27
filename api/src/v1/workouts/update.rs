use axum::extract::Path;
use sqlx::{query_as, query_scalar};
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::structs::workouts::{UpdateWorkoutBody, Workout};
use crate::*;

/// Update a workout
#[utoipa::path(
    put,
    path = "/{workout_id}",
    params(
        ("workout_id" = Uuid, Path, description = "Workout ID")
    ),
    request_body = UpdateWorkoutBody,
    responses(
        (status = OK, body = Workout),
        (status = NOT_FOUND, description = "Workout not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::WORKOUTS_TAG
)]
pub async fn update_workout(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(workout_id): Path<Uuid>,
    Json(body): Json<UpdateWorkoutBody>,
) -> Result<Json<Workout>, AppError> {
    // Check ownership
    let owner_id = query_scalar!("SELECT user_id FROM workouts WHERE id = $1", workout_id)
        .fetch_optional(&*state.db)
        .await?;

    match owner_id {
        None => return Err(AppError::Error(Errors::Unauthorized)),
        Some(id) if id != user_id => return Err(AppError::Error(Errors::Unauthorized)),
        _ => {}
    }

    let workout = query_as!(
        Workout,
        r#"
        UPDATE workouts
        SET 
            name = COALESCE($2, name),
            privacy = COALESCE($3, privacy),
            gym_location = COALESCE($4, gym_location),
            end_time = COALESCE($5, end_time)
        WHERE id = $1
        RETURNING id, user_id, name, start_time, end_time, privacy, gym_location, kind
        "#,
        workout_id,
        body.name,
        body.privacy,
        body.gym_location,
        body.end_time
    )
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(workout))
}
