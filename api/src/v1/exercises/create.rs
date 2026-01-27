use chrono::NaiveDateTime;
use extractors::users::UserId;
use sqlx::query;
use structs::exercise_types::ExerciseType;
use uuid::Uuid;

use crate::*;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct CreateExerciseBody {
    name: String,
    // todo: make this an enum
    exercise_type: ExerciseType,
    description: String,
    body_parts: Vec<String>,
    primary_muscles: Vec<String>,
    secondary_muscles: Vec<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone, sqlx::Type, PartialEq, sqlx::FromRow)]
pub struct Exercise {
    pub id: Uuid,
    pub name: String,
    pub exercise_type: ExerciseType,
    pub description: String,
    pub author_id: Uuid,
    pub official: bool,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct Muscle {
    pub id: Uuid,
    pub is_primary: bool,
}

#[utoipa::path(
    post,
    path = "/create",
    responses(
        (status = OK, body = String),
        (status = UNAUTHORIZED, description = "Not authenticated")
    ),
    tag = super::EXERCISES_TAG
)]
pub async fn create(
    State(state): State<AppState>,
    UserId(user): UserId,
    Json(body): Json<CreateExerciseBody>,
) -> Result<String, AppError> {
    let is_admin = query!("SELECT is_admin FROM users WHERE id = $1", user)
        .fetch_one(&*state.db)
        .await?
        .is_admin;

    if !is_admin {
        return Err(AppError::Error(Errors::Unauthorized));
    }

    let muscles: Vec<Muscle> = body
        .primary_muscles
        .iter()
        .map(|id| -> anyhow::Result<Muscle> {
            let uuid = Uuid::parse_str(id)?;
            Ok(Muscle {
                id: uuid,
                is_primary: true,
            })
        })
        .chain(
            body.secondary_muscles
                .iter()
                .map(|id| -> anyhow::Result<Muscle> {
                    let uuid = Uuid::parse_str(id)?;
                    Ok(Muscle {
                        id: uuid,
                        is_primary: false,
                    })
                }),
        )
        .collect::<Result<Vec<Muscle>, _>>()
        .context("Failed to parse muscle ids")?;

    let mut tx = state.db.begin().await?;

    let exercise = query!(
        r#"
        INSERT INTO exercises (name, exercise_type, official, author_id, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        "#,
        body.name,
        body.exercise_type as ExerciseType,
        is_admin,
        user,
        body.description
    )
    .fetch_one(&mut *tx)
    // .fetch_one(&*state.db)
    .await?;

    query!(
        r#"
        INSERT INTO exercise_muscle_relations (exercise_id, muscle_id, is_primary)
        SELECT * FROM UNNEST($1::uuid[], $2::uuid[], $3::boolean[])
        "#,
        &vec![exercise.id; muscles.len()],
        &muscles.iter().map(|m| m.id).collect::<Vec<Uuid>>(),
        &muscles.iter().map(|m| m.is_primary).collect::<Vec<bool>>()
    )
    .execute(&mut *tx)
    // .execute(&*state.db)
    .await?;

    tx.commit().await?;

    Ok(exercise.id.to_string())
}
