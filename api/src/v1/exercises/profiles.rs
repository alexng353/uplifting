use axum::extract::Path;
use sqlx::query_as;
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::structs::profiles::{CreateProfileBody, ExerciseProfile};
use crate::*;

/// Get all profiles for the current user
#[utoipa::path(
    get,
    path = "/profiles",
    responses(
        (status = OK, body = Vec<ExerciseProfile>),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::EXERCISES_TAG
)]
pub async fn get_all_profiles(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<Vec<ExerciseProfile>>, AppError> {
    let profiles = query_as!(
        ExerciseProfile,
        r#"
        SELECT id, user_id, exercise_id, name, created_at
        FROM exercise_profiles
        WHERE user_id = $1
        ORDER BY exercise_id, name ASC
        "#,
        user_id
    )
    .fetch_all(&*state.db)
    .await?;

    Ok(Json(profiles))
}

/// Get user's profiles for an exercise
#[utoipa::path(
    get,
    path = "/{exercise_id}/profiles",
    params(
        ("exercise_id" = Uuid, Path, description = "Exercise ID")
    ),
    responses(
        (status = OK, body = Vec<ExerciseProfile>),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::EXERCISES_TAG
)]
pub async fn get_profiles(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(exercise_id): Path<Uuid>,
) -> Result<Json<Vec<ExerciseProfile>>, AppError> {
    let profiles = query_as!(
        ExerciseProfile,
        r#"
        SELECT id, user_id, exercise_id, name, created_at
        FROM exercise_profiles
        WHERE user_id = $1 AND exercise_id = $2
        ORDER BY name ASC
        "#,
        user_id,
        exercise_id
    )
    .fetch_all(&*state.db)
    .await?;

    Ok(Json(profiles))
}

/// Create a new profile for an exercise
#[utoipa::path(
    post,
    path = "/{exercise_id}/profiles",
    params(
        ("exercise_id" = Uuid, Path, description = "Exercise ID")
    ),
    request_body = CreateProfileBody,
    responses(
        (status = OK, body = ExerciseProfile),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::EXERCISES_TAG
)]
pub async fn create_profile(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(exercise_id): Path<Uuid>,
    Json(body): Json<CreateProfileBody>,
) -> Result<Json<ExerciseProfile>, AppError> {
    let profile = query_as!(
        ExerciseProfile,
        r#"
        INSERT INTO exercise_profiles (user_id, exercise_id, name)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, exercise_id, name, created_at
        "#,
        user_id,
        exercise_id,
        body.name
    )
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(profile))
}
