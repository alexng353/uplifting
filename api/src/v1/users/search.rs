use axum::extract::Query;
use serde::Deserialize;
use sqlx::query_as;

use crate::extractors::users::UserId;
use crate::structs::users::UserSearchResult;
use crate::*;

#[derive(Debug, Deserialize, ToSchema)]
pub struct SearchQuery {
    pub q: String,
}

/// Search users by username
#[utoipa::path(
    get,
    path = "/search",
    params(
        ("q" = String, Query, description = "Search query")
    ),
    responses(
        (status = OK, body = Vec<UserSearchResult>),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::USERS_TAG
)]
pub async fn search_users(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Query(query): Query<SearchQuery>,
) -> Result<Json<Vec<UserSearchResult>>, AppError> {
    let search_pattern = format!("%{}%", query.q.to_lowercase());

    let users = query_as!(
        UserSearchResult,
        r#"
        SELECT id, username, real_name, avatar_url
        FROM users
        WHERE id != $1 AND LOWER(username) LIKE $2
        LIMIT 20
        "#,
        user_id,
        search_pattern
    )
    .fetch_all(&*state.db)
    .await?;

    Ok(Json(users))
}
