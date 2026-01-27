use axum::extract::Path;
use sqlx::{query_as, query_scalar};
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::structs::sets::{UpdateSetBody, UserSet};
use crate::*;

/// Update a set
#[utoipa::path(
    put,
    path = "/{set_id}",
    params(
        ("set_id" = Uuid, Path, description = "Set ID")
    ),
    request_body = UpdateSetBody,
    responses(
        (status = OK, body = UserSet),
        (status = NOT_FOUND, description = "Set not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::SETS_TAG
)]
pub async fn update_set(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(set_id): Path<Uuid>,
    Json(body): Json<UpdateSetBody>,
) -> Result<Json<UserSet>, AppError> {
    // Check set ownership
    let owner_id = query_scalar!("SELECT user_id FROM user_sets WHERE id = $1", set_id)
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
        UPDATE user_sets
        SET 
            reps = COALESCE($2, reps),
            weight = COALESCE($3, weight),
            weight_unit = COALESCE($4, weight_unit)
        WHERE id = $1
        RETURNING id, user_id, exercise_id, workout_id, profile_id, reps, weight, weight_unit, created_at, side
        "#,
        set_id,
        body.reps,
        body.weight,
        body.weight_unit
    )
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(set))
}
