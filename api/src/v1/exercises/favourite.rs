use axum::extract::Path;
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::*;

/// Get all favourite exercise IDs
#[utoipa::path(
    get,
    path = "/favourites",
    responses(
        (status = OK, body = Vec<Uuid>, description = "List of favourite exercise IDs"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::EXERCISES_TAG
)]
pub async fn list_favourites(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<Vec<Uuid>>, AppError> {
    let favourites = sqlx::query_scalar!(
        "SELECT exercise_id FROM favourite_exercises WHERE user_id = $1",
        user_id
    )
    .fetch_all(&*state.db)
    .await?;

    Ok(Json(favourites))
}

/// Add exercise to favourites
#[utoipa::path(
    post,
    path = "/{exercise_id}/favourite",
    params(
        ("exercise_id" = Uuid, Path, description = "Exercise ID")
    ),
    responses(
        (status = OK, description = "Added to favourites"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::EXERCISES_TAG
)]
pub async fn add_favourite(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(exercise_id): Path<Uuid>,
) -> Result<&'static str, AppError> {
    sqlx::query!(
        r#"
        INSERT INTO favourite_exercises (user_id, exercise_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, exercise_id) DO NOTHING
        "#,
        user_id,
        exercise_id
    )
    .execute(&*state.db)
    .await?;

    Ok("added")
}

/// Remove exercise from favourites
#[utoipa::path(
    delete,
    path = "/{exercise_id}/favourite",
    params(
        ("exercise_id" = Uuid, Path, description = "Exercise ID")
    ),
    responses(
        (status = OK, description = "Removed from favourites"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::EXERCISES_TAG
)]
pub async fn remove_favourite(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(exercise_id): Path<Uuid>,
) -> Result<&'static str, AppError> {
    sqlx::query!(
        "DELETE FROM favourite_exercises WHERE user_id = $1 AND exercise_id = $2",
        user_id,
        exercise_id
    )
    .execute(&*state.db)
    .await?;

    Ok("removed")
}
