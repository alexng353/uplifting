use axum::extract::Path;
use sqlx::{query_as, query_scalar};
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::structs::friends::{Friendship, RespondFriendRequestBody};
use crate::*;

/// Respond to a friend request (accept, decline, or block)
#[utoipa::path(
    put,
    path = "/{friendship_id}",
    params(
        ("friendship_id" = Uuid, Path, description = "Friendship ID")
    ),
    request_body = RespondFriendRequestBody,
    responses(
        (status = OK, body = Friendship),
        (status = NOT_FOUND, description = "Request not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::FRIENDS_TAG
)]
pub async fn respond_request(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(friendship_id): Path<Uuid>,
    Json(body): Json<RespondFriendRequestBody>,
) -> Result<Json<Friendship>, AppError> {
    // Check that this is a pending request to the current user
    let friend_id = query_scalar!(
        "SELECT friend_id FROM friendships WHERE id = $1 AND status = 'pending'",
        friendship_id
    )
    .fetch_optional(&*state.db)
    .await?;

    match friend_id {
        None => return Err(AppError::Error(Errors::Unauthorized)),
        Some(id) if id != user_id => return Err(AppError::Error(Errors::Unauthorized)),
        _ => {}
    }

    let new_status = match body.action.as_str() {
        "accept" => "accepted",
        "decline" => {
            // Delete the request instead of updating status
            sqlx::query!("DELETE FROM friendships WHERE id = $1", friendship_id)
                .execute(&*state.db)
                .await?;
            return Ok(Json(Friendship {
                id: friendship_id,
                user_id: Uuid::nil(),
                friend_id: user_id,
                status: "declined".to_string(),
                created_at: chrono::Utc::now().naive_utc(),
            }));
        }
        "block" => "blocked",
        _ => return Err(AppError::Error(Errors::Unauthorized)),
    };

    let friendship = query_as!(
        Friendship,
        r#"
        UPDATE friendships
        SET status = $2
        WHERE id = $1
        RETURNING id, user_id, friend_id, status, created_at
        "#,
        friendship_id,
        new_status
    )
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(friendship))
}
