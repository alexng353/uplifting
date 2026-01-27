use axum::extract::Path;
use sqlx::query_scalar;
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::*;

/// Delete a workout and all its sets
#[utoipa::path(
    delete,
    path = "/{workout_id}",
    params(
        ("workout_id" = Uuid, Path, description = "Workout ID")
    ),
    responses(
        (status = OK, description = "Workout deleted"),
        (status = NOT_FOUND, description = "Workout not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::WORKOUTS_TAG
)]
pub async fn delete_workout(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(workout_id): Path<Uuid>,
) -> Result<&'static str, AppError> {
    // Check ownership
    let owner_id = query_scalar!("SELECT user_id FROM workouts WHERE id = $1", workout_id)
        .fetch_optional(&*state.db)
        .await?;

    match owner_id {
        None => return Err(AppError::Error(Errors::Unauthorized)),
        Some(id) if id != user_id => return Err(AppError::Error(Errors::Unauthorized)),
        _ => {}
    }

    // Delete sets first (foreign key constraint)
    sqlx::query!("DELETE FROM user_sets WHERE workout_id = $1", workout_id)
        .execute(&*state.db)
        .await?;

    // Delete workout
    sqlx::query!("DELETE FROM workouts WHERE id = $1", workout_id)
        .execute(&*state.db)
        .await?;

    Ok("deleted")
}
