use sqlx::query_as;

use crate::extractors::users::UserId;
use crate::structs::friends::FriendWithProfile;
use crate::*;

/// List pending friend requests (received)
#[utoipa::path(
    get,
    path = "/requests",
    responses(
        (status = OK, body = Vec<FriendWithProfile>),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::FRIENDS_TAG
)]
pub async fn list_requests(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<Vec<FriendWithProfile>>, AppError> {
    let requests = query_as!(
        FriendWithProfile,
        r#"
        SELECT 
            f.id as friendship_id,
            u.id as user_id,
            u.username,
            u.real_name,
            u.avatar_url,
            f.status,
            f.created_at
        FROM friendships f
        JOIN users u ON u.id = f.user_id
        WHERE f.friend_id = $1 AND f.status = 'pending'
        ORDER BY f.created_at DESC
        "#,
        user_id
    )
    .fetch_all(&*state.db)
    .await?;

    Ok(Json(requests))
}
