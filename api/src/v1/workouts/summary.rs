use axum::extract::Path;
use sqlx::query_scalar;
use uuid::Uuid;

use crate::extractors::users::UserId;
use crate::structs::workouts::WorkoutSummary;
use crate::*;

/// Get workout summary with computed stats
#[utoipa::path(
    get,
    path = "/{workout_id}/summary",
    params(
        ("workout_id" = Uuid, Path, description = "Workout ID")
    ),
    responses(
        (status = OK, body = WorkoutSummary),
        (status = NOT_FOUND, description = "Workout not found"),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::WORKOUTS_TAG
)]
pub async fn workout_summary(
    State(state): State<AppState>,
    UserId(user_id): UserId,
    Path(workout_id): Path<Uuid>,
) -> Result<Json<WorkoutSummary>, AppError> {
    // Check ownership
    let owner_id = query_scalar!("SELECT user_id FROM workouts WHERE id = $1", workout_id)
        .fetch_optional(&*state.db)
        .await?;

    match owner_id {
        None => return Err(AppError::Error(Errors::Unauthorized)),
        Some(id) if id != user_id => return Err(AppError::Error(Errors::Unauthorized)),
        _ => {}
    }

    let summary = sqlx::query!(
        r#"
        SELECT 
            w.id,
            w.name,
            w.start_time,
            w.end_time,
            COALESCE(EXTRACT(EPOCH FROM (COALESCE(w.end_time, NOW()) - w.start_time)) / 60, 0)::bigint as "duration_minutes!",
            COALESCE(SUM(s.weight * s.reps), 0) as "total_volume!",
            COUNT(s.id) as "total_sets!",
            COALESCE(SUM(s.reps), 0) as "total_reps!",
            COUNT(DISTINCT s.exercise_id) as "exercises_count!"
        FROM workouts w
        LEFT JOIN user_sets s ON s.workout_id = w.id
        WHERE w.id = $1
        GROUP BY w.id
        "#,
        workout_id
    )
    .fetch_one(&*state.db)
    .await?;

    Ok(Json(WorkoutSummary {
        id: summary.id,
        name: summary.name,
        start_time: summary.start_time,
        end_time: summary.end_time,
        duration_minutes: summary.duration_minutes,
        total_volume: summary.total_volume,
        total_sets: summary.total_sets,
        total_reps: summary.total_reps,
        exercises_count: summary.exercises_count,
    }))
}
