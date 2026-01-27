use axum::extract::Path;
use sqlx::{query_as, query_scalar};
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::structs::sets::UserSet;
use crate::structs::workouts::{Workout, WorkoutWithSets};
use crate::*;

/// Get a workout with all its sets
#[utoipa::path(
    get,
    path = "/{workout_id}",
    params(
        ("workout_id" = Uuid, Path, description = "Workout ID")
    ),
    responses(
        (status = OK, body = WorkoutWithSets),
        (status = NOT_FOUND, description = "Workout not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::WORKOUTS_TAG
)]
pub async fn get_workout(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(workout_id): Path<Uuid>,
) -> Result<Json<WorkoutWithSets>, AppError> {
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
        SELECT id, user_id, name, start_time, end_time, privacy, gym_location, kind
        FROM workouts
        WHERE id = $1
        "#,
        workout_id
    )
    .fetch_one(&*state.db)
    .await?;

    let sets = query_as!(
        UserSet,
        r#"
        SELECT id, user_id, exercise_id, workout_id, profile_id, reps, weight, weight_unit, created_at, side
        FROM user_sets
        WHERE workout_id = $1
        ORDER BY created_at ASC
        "#,
        workout_id
    )
    .fetch_all(&*state.db)
    .await?;

    Ok(Json(WorkoutWithSets { workout, sets }))
}
