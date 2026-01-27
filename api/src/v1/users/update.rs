use sqlx::query_as;

use crate::extractors::users::UserId;
use crate::structs::users::{UpdateProfileBody, UserProfile};
use crate::*;

/// Update current user profile
#[utoipa::path(
    put,
    path = "/me",
    request_body = UpdateProfileBody,
    responses(
        (status = OK, body = UserProfile),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::USERS_TAG
)]
pub async fn update_me(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Json(body): Json<UpdateProfileBody>,
) -> Result<Json<UserProfile>, AppError> {
    let user = query_as::<_, UserProfile>(
        r#"
        UPDATE users
        SET 
            username = COALESCE($2, username),
            real_name = COALESCE($3, real_name),
            avatar_url = COALESCE($4, avatar_url)
        WHERE id = $1
        RETURNING id, username, real_name, email, avatar_url, email_verified, is_admin, created_at
        "#,
    )
    .bind(user_id)
    .bind(body.username)
    .bind(body.real_name)
    .bind(body.avatar_url)
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(user))
}
