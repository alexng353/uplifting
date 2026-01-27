use axum::extract::Query;
use serde::Deserialize;
use sqlx::query_as;

use crate::extractors::users::UserId;
use crate::structs::exercise_types::ExerciseType;
use crate::structs::exercises::{Exercise, ExerciseListResponse};
use crate::*;

#[derive(Debug, Deserialize, ToSchema)]
pub struct ListExercisesQuery {
    #[serde(default)]
    pub exercise_type: Option<String>,
    #[serde(default)]
    pub muscle: Option<String>,
    #[serde(default)]
    pub muscle_group: Option<String>,
    #[serde(default)]
    pub search: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: i64,
    #[serde(default)]
    pub offset: i64,
}

fn default_limit() -> i64 {
    50
}

/// List exercises with optional filters
#[utoipa::path(
    get,
    path = "",
    params(
        ("exercise_type" = Option<String>, Query, description = "Filter by exercise type"),
        ("muscle" = Option<String>, Query, description = "Filter by muscle name"),
        ("muscle_group" = Option<String>, Query, description = "Filter by muscle group"),
        ("search" = Option<String>, Query, description = "Search by name"),
        ("limit" = Option<i64>, Query, description = "Limit results (default: 50)"),
        ("offset" = Option<i64>, Query, description = "Offset for pagination")
    ),
    responses(
        (status = OK, body = ExerciseListResponse),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::EXERCISES_TAG
)]
pub async fn list_exercises(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Query(query): Query<ListExercisesQuery>,
) -> Result<Json<ExerciseListResponse>, AppError> {
    let search_pattern = query.search.map(|s| format!("%{}%", s.to_lowercase()));

    // Build dynamic query based on filters
    let exercises = query_as!(
        Exercise,
        r#"
        SELECT DISTINCT e.id, e.name, e.exercise_type as "exercise_type: ExerciseType", 
               e.official, e.author_id, e.description, e.created_at
        FROM exercises e
        LEFT JOIN exercise_muscle_relations emr ON emr.exercise_id = e.id
        LEFT JOIN muscles m ON m.id = emr.muscle_id
        WHERE 
            (e.official = true OR e.author_id = $1)
            AND ($2::text IS NULL OR e.exercise_type::text = $2)
            AND ($3::text IS NULL OR LOWER(m.name) = LOWER($3))
            AND ($4::text IS NULL OR LOWER(m.major_group) = LOWER($4) OR LOWER(m.minor_group) = LOWER($4))
            AND ($5::text IS NULL OR LOWER(e.name) LIKE $5)
        ORDER BY e.name ASC
        LIMIT $6 OFFSET $7
        "#,
        user_id,
        query.exercise_type,
        query.muscle,
        query.muscle_group,
        search_pattern,
        query.limit,
        query.offset
    )
    .fetch_all(&*state.db)
    .await?;

    let total = sqlx::query_scalar!(
        r#"
        SELECT COUNT(DISTINCT e.id)
        FROM exercises e
        LEFT JOIN exercise_muscle_relations emr ON emr.exercise_id = e.id
        LEFT JOIN muscles m ON m.id = emr.muscle_id
        WHERE 
            (e.official = true OR e.author_id = $1)
            AND ($2::text IS NULL OR e.exercise_type::text = $2)
            AND ($3::text IS NULL OR LOWER(m.name) = LOWER($3))
            AND ($4::text IS NULL OR LOWER(m.major_group) = LOWER($4) OR LOWER(m.minor_group) = LOWER($4))
            AND ($5::text IS NULL OR LOWER(e.name) LIKE $5)
        "#,
        user_id,
        query.exercise_type,
        query.muscle,
        query.muscle_group,
        search_pattern,
    )
    .fetch_one(&*state.db)
    .await?
    .unwrap_or(0);

    Ok(Json(ExerciseListResponse { exercises, total }))
}
