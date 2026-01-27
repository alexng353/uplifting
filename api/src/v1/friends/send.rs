use sqlx::query_as;

use crate::extractors::users::UserId;
use crate::structs::friends::{Friendship, SendFriendRequestBody};
use crate::*;

/// Send a friend request
#[utoipa::path(
    post,
    path = "",
    request_body = SendFriendRequestBody,
    responses(
        (status = OK, body = Friendship),
        (status = BAD_REQUEST, description = "Cannot send request to self or already exists"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::FRIENDS_TAG
)]
pub async fn send_request(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(body): Json<SendFriendRequestBody>,
) -> Result<Json<Friendship>, AppError> {
    // Cannot send request to self
    if user_id == body.friend_id {
        return Err(AppError::Error(Errors::Unauthorized));
    }

    // Check if friendship already exists in either direction
    let existing = sqlx::query_scalar!(
        r#"
        SELECT id FROM friendships 
        WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)
        "#,
        user_id,
        body.friend_id
    )
    .fetch_optional(&*state.db)
    .await?;

    if existing.is_some() {
        return Err(AppError::Error(Errors::Unauthorized));
    }

    let friendship = query_as!(
        Friendship,
        r#"
        INSERT INTO friendships (user_id, friend_id, status)
        VALUES ($1, $2, 'pending')
        RETURNING id, user_id, friend_id, status, created_at
        "#,
        user_id,
        body.friend_id
    )
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(friendship))
}
