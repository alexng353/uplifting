use axum::extract::Path;
use sqlx::query_scalar;
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::*;

/// Delete a set
#[utoipa::path(
    delete,
    path = "/{set_id}",
    params(
        ("set_id" = Uuid, Path, description = "Set ID")
    ),
    responses(
        (status = OK, description = "Set deleted"),
        (status = NOT_FOUND, description = "Set not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::SETS_TAG
)]
pub async fn delete_set(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(set_id): Path<Uuid>,
) -> Result<&'static str, AppError> {
    // Check set ownership
    let owner_id = query_scalar!("SELECT user_id FROM user_sets WHERE id = $1", set_id)
        .fetch_optional(&*state.db)
        .await?;

    match owner_id {
        None => return Err(AppError::Error(Errors::Unauthorized)),
        Some(id) if id != user_id => return Err(AppError::Error(Errors::Unauthorized)),
        _ => {}
    }

    sqlx::query!("DELETE FROM user_sets WHERE id = $1", set_id)
        .execute(&*state.db)
        .await?;

    Ok("deleted")
}
