use sqlx::query_as;

use crate::extractors::users::UserId;
use crate::structs::users::UserProfile;
use crate::*;

/// Get current user profile
#[utoipa::path(
    get,
    path = "/me",
    responses(
        (status = OK, body = UserProfile),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::USERS_TAG
)]
pub async fn get_me(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<Json<UserProfile>, AppError> {
    let user = query_as::<_, UserProfile>(
        r#"
        SELECT id, username, real_name, email, avatar_url, email_verified, is_admin, created_at
        FROM users
        WHERE id = $1
        "#,
    )
    .bind(user_id)
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(user))
}
