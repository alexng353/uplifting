use axum::extract::Path;
use sqlx::query_as;
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::structs::gyms::{GymProfileMappingResponse, SetGymProfileMappingBody};
use crate::*;

/// Get profile mappings for a gym
#[utoipa::path(
    get,
    path = "/{gym_id}/profile-mappings",
    params(
        ("gym_id" = Uuid, Path, description = "Gym ID")
    ),
    responses(
        (status = OK, body = Vec<GymProfileMappingResponse>),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::GYMS_TAG
)]
pub async fn get_profile_mappings(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(gym_id): Path<Uuid>,
) -> Result<Json<Vec<GymProfileMappingResponse>>, AppError> {
    let mappings = query_as!(
        GymProfileMappingResponse,
        r#"
        SELECT exercise_id, profile_id
        FROM user_gym_profile_mappings
        WHERE user_id = $1 AND gym_id = $2
        "#,
        user_id,
        gym_id
    )
    .fetch_all(&*state.db)
    .await?;

    Ok(Json(mappings))
}

/// Set profile mapping for an exercise at a gym
#[utoipa::path(
    put,
    path = "/{gym_id}/profile-mappings",
    params(
        ("gym_id" = Uuid, Path, description = "Gym ID")
    ),
    request_body = SetGymProfileMappingBody,
    responses(
        (status = OK, body = GymProfileMappingResponse),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::GYMS_TAG
)]
pub async fn set_profile_mapping(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(gym_id): Path<Uuid>,
    Json(body): Json<SetGymProfileMappingBody>,
) -> Result<Json<GymProfileMappingResponse>, AppError> {
    let mapping = query_as!(
        GymProfileMappingResponse,
        r#"
        INSERT INTO user_gym_profile_mappings (user_id, gym_id, exercise_id, profile_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, gym_id, exercise_id) DO UPDATE
        SET profile_id = $4, updated_at = NOW()
        RETURNING exercise_id, profile_id
        "#,
        user_id,
        gym_id,
        body.exercise_id,
        body.profile_id
    )
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(mapping))
}
