use axum::extract::Path;
use sqlx::{query, query_as};
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::structs::gyms::{CreateGymBody, Gym, UpdateGymBody};
use crate::*;

/// List all gyms for the current user
#[utoipa::path(
    get,
    path = "",
    responses(
        (status = OK, body = Vec<Gym>),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::GYMS_TAG
)]
pub async fn list_gyms(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<Vec<Gym>>, AppError> {
    let gyms = query_as!(
        Gym,
        r#"
        SELECT id, user_id, name, created_at
        FROM user_gyms
        WHERE user_id = $1
        ORDER BY created_at ASC
        "#,
        user_id
    )
    .fetch_all(&*state.db)
    .await?;

    Ok(Json(gyms))
}

/// Create a new gym
#[utoipa::path(
    post,
    path = "",
    request_body = CreateGymBody,
    responses(
        (status = OK, body = Gym),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::GYMS_TAG
)]
pub async fn create_gym(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(body): Json<CreateGymBody>,
) -> Result<Json<Gym>, AppError> {
    let gym = query_as!(
        Gym,
        r#"
        INSERT INTO user_gyms (user_id, name)
        VALUES ($1, $2)
        RETURNING id, user_id, name, created_at
        "#,
        user_id,
        body.name
    )
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(gym))
}

/// Update a gym
#[utoipa::path(
    put,
    path = "/{gym_id}",
    params(
        ("gym_id" = Uuid, Path, description = "Gym ID")
    ),
    request_body = UpdateGymBody,
    responses(
        (status = OK, body = Gym),
        (status = NOT_FOUND, description = "Gym not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::GYMS_TAG
)]
pub async fn update_gym(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(gym_id): Path<Uuid>,
    Json(body): Json<UpdateGymBody>,
) -> Result<Json<Gym>, AppError> {
    let gym = query_as!(
        Gym,
        r#"
        UPDATE user_gyms
        SET name = $3
        WHERE id = $1 AND user_id = $2
        RETURNING id, user_id, name, created_at
        "#,
        gym_id,
        user_id,
        body.name
    )
    .fetch_optional(&*state.db)
    .await?;

    match gym {
        Some(g) => Ok(Json(g)),
        None => Err(AppError::not_found("Gym not found")),
    }
}

/// Delete a gym
#[utoipa::path(
    delete,
    path = "/{gym_id}",
    params(
        ("gym_id" = Uuid, Path, description = "Gym ID")
    ),
    responses(
        (status = NO_CONTENT, description = "Gym deleted"),
        (status = NOT_FOUND, description = "Gym not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::GYMS_TAG
)]
pub async fn delete_gym(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(gym_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let result = query!(
        r#"
        DELETE FROM user_gyms
        WHERE id = $1 AND user_id = $2
        "#,
        gym_id,
        user_id
    )
    .execute(&*state.db)
    .await?;

    if result.rows_affected() == 0 {
        Err(AppError::not_found("Gym not found"))
    } else {
        Ok(StatusCode::NO_CONTENT)
    }
}
