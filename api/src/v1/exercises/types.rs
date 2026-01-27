use crate::structs::exercise_types::ExerciseType;
use crate::*;

#[utoipa::path(
    get,
    path = "/types",
    responses((status = OK, body = Vec<ExerciseType>)),
    tag = super::EXERCISES_TAG
)]
pub async fn list_types() -> Result<Json<Vec<ExerciseType>>, AppError> {
    Ok(Json(ExerciseType::all()))
}
