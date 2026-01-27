use axum::extract::Path;
use sqlx::{query_as, query_scalar};
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::structs::sets::{CreateSetBody, UserSet};
use crate::*;

/// Add a set to a workout
#[utoipa::path(
    post,
    path = "/workouts/{workout_id}/sets",
    params(
        ("workout_id" = Uuid, Path, description = "Workout ID")
    ),
    request_body = CreateSetBody,
    responses(
        (status = OK, body = UserSet),
        (status = NOT_FOUND, description = "Workout not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::SETS_TAG
)]
pub async fn create_set(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(workout_id): Path<Uuid>,
    Json(body): Json<CreateSetBody>,
) -> Result<Json<UserSet>, AppError> {
    // Check workout ownership
    let owner_id = query_scalar!("SELECT user_id FROM workouts WHERE id = $1", workout_id)
        .fetch_optional(&*state.db)
        .await?;

    match owner_id {
        None => return Err(AppError::Error(Errors::Unauthorized)),
        Some(id) if id != user_id => return Err(AppError::Error(Errors::Unauthorized)),
        _ => {}
    }

    let set = query_as!(
        UserSet,
        r#"
        INSERT INTO user_sets (user_id, exercise_id, workout_id, profile_id, reps, weight, weight_unit, side)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, user_id, exercise_id, workout_id, profile_id, reps, weight, weight_unit, created_at, side
        "#,
        user_id,
        body.exercise_id,
        workout_id,
        body.profile_id,
        body.reps,
        body.weight,
        body.weight_unit,
        body.side
    )
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(set))
}
