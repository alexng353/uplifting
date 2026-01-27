use crate::extractors::users::UserId;
use crate::*;

/// Delete current user account
#[utoipa::path(
    delete,
    path = "/me",
    responses(
        (status = OK, description = "Account deleted"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::USERS_TAG
)]
pub async fn delete_me(
    State(state): State<AppState>,
    UserId(user_id): UserId,
) -> Result<&'static str, AppError> {
    // Delete user - cascades will handle related data
    sqlx::query!("DELETE FROM users WHERE id = $1", user_id)
        .execute(&*state.db)
        .await?;

    Ok("deleted")
}
