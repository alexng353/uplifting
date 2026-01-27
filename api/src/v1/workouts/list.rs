use axum::extract::Query;
use serde::Deserialize;
use sqlx::query_as;

use crate::extractors::users::UserId;
use crate::structs::workouts::{Workout, WorkoutListResponse};
use crate::*;

#[derive(Debug, Deserialize, ToSchema)]
pub struct ListWorkoutsQuery {
    #[serde(default = "default_page")]
    pub page: i64,
    #[serde(default = "default_per_page")]
    pub per_page: i64,
}

fn default_page() -> i64 {
    1
}
fn default_per_page() -> i64 {
    20
}

/// List user's workouts with pagination
#[utoipa::path(
    get,
    path = "",
    params(
        ("page" = Option<i64>, Query, description = "Page number (default: 1)"),
        ("per_page" = Option<i64>, Query, description = "Items per page (default: 20)")
    ),
    responses(
        (status = OK, body = WorkoutListResponse),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::WORKOUTS_TAG
)]
pub async fn list_workouts(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Query(query): Query<ListWorkoutsQuery>,
) -> Result<Json<WorkoutListResponse>, AppError> {
    let offset = (query.page - 1) * query.per_page;

    let workouts = query_as!(
        Workout,
        r#"
        SELECT id, user_id, name, start_time, end_time, privacy, gym_location, kind
        FROM workouts
        WHERE user_id = $1
        ORDER BY start_time DESC
        LIMIT $2 OFFSET $3
        "#,
        user_id,
        query.per_page,
        offset
    )
    .fetch_all(&*state.db)
    .await?;

    let total = sqlx::query_scalar!("SELECT COUNT(*) FROM workouts WHERE user_id = $1", user_id)
        .fetch_one(&*state.db)
        .await?
        .unwrap_or(0);

    Ok(Json(WorkoutListResponse {
        workouts,
        total,
        page: query.page,
        per_page: query.per_page,
    }))
}
