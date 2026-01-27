use axum::extract::Path;
use sqlx::query_as;
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::structs::exercise_types::ExerciseType;
use crate::structs::exercises::{Exercise, ExerciseWithDetails, PersonalRecord};
use crate::*;

/// Get exercise details with user's personal record
#[utoipa::path(
    get,
    path = "/{exercise_id}",
    params(
        ("exercise_id" = Uuid, Path, description = "Exercise ID")
    ),
    responses(
        (status = OK, body = ExerciseWithDetails),
        (status = NOT_FOUND, description = "Exercise not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::EXERCISES_TAG
)]
pub async fn get_exercise(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(exercise_id): Path<Uuid>,
) -> Result<Json<ExerciseWithDetails>, AppError> {
    let exercise = query_as!(
        Exercise,
        r#"
        SELECT id, name, exercise_type as "exercise_type: ExerciseType", 
               official, author_id, description, created_at
        FROM exercises
        WHERE id = $1
        "#,
        exercise_id
    )
    .fetch_optional(&*state.db)
    .await?
    .ok_or(AppError::Error(Errors::Unauthorized))?;

    // Get primary muscles
    let primary_muscles: Vec<String> = sqlx::query_scalar!(
        r#"
        SELECT m.name
        FROM muscles m
        JOIN exercise_muscle_relations emr ON emr.muscle_id = m.id
        WHERE emr.exercise_id = $1 AND emr.is_primary = true
        "#,
        exercise_id
    )
    .fetch_all(&*state.db)
    .await?;

    // Get secondary muscles
    let secondary_muscles: Vec<String> = sqlx::query_scalar!(
        r#"
        SELECT m.name
        FROM muscles m
        JOIN exercise_muscle_relations emr ON emr.muscle_id = m.id
        WHERE emr.exercise_id = $1 AND emr.is_primary = false
        "#,
        exercise_id
    )
    .fetch_all(&*state.db)
    .await?;

    // Check if favourite
    let is_favourite = sqlx::query_scalar!(
        "SELECT id FROM favourite_exercises WHERE user_id = $1 AND exercise_id = $2",
        user_id,
        exercise_id
    )
    .fetch_optional(&*state.db)
    .await?
    .is_some();

    // Get personal record (highest weight for 1+ reps)
    let pr = sqlx::query!(
        r#"
        SELECT s.weight, s.weight_unit, s.reps, s.created_at
        FROM user_sets s
        WHERE s.user_id = $1 AND s.exercise_id = $2
        ORDER BY s.weight DESC, s.reps DESC
        LIMIT 1
        "#,
        user_id,
        exercise_id
    )
    .fetch_optional(&*state.db)
    .await?;

    let personal_record = pr.map(|p| PersonalRecord {
        weight: p.weight,
        weight_unit: p.weight_unit,
        reps: p.reps,
        date: p.created_at,
    });

    Ok(Json(ExerciseWithDetails {
        exercise,
        primary_muscles,
        secondary_muscles,
        is_favourite,
        personal_record,
    }))
}
