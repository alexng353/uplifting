use axum::extract::Path;
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::*;

/// Remove a friend (unfriend)
#[utoipa::path(
    delete,
    path = "/{friendship_id}",
    params(
        ("friendship_id" = Uuid, Path, description = "Friendship ID")
    ),
    responses(
        (status = OK, description = "Friend removed"),
        (status = NOT_FOUND, description = "Friendship not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::FRIENDS_TAG
)]
pub async fn remove_friend(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(friendship_id): Path<Uuid>,
) -> Result<&'static str, AppError> {
    // Check that user is part of this friendship
    let friendship = sqlx::query!(
        "SELECT user_id, friend_id FROM friendships WHERE id = $1",
        friendship_id
    )
    .fetch_optional(&*state.db)
    .await?;

    match friendship {
        None => return Err(AppError::Error(Errors::Unauthorized)),
        Some(f) if f.user_id != user_id && f.friend_id != user_id => {
            return Err(AppError::Error(Errors::Unauthorized))
        }
        _ => {}
    }

    sqlx::query!("DELETE FROM friendships WHERE id = $1", friendship_id)
        .execute(&*state.db)
        .await?;

    Ok("deleted")
}
