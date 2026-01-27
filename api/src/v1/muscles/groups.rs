use sqlx::query_scalar;

use crate::*;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct MuscleGroups {
    major_groups: Vec<String>,
    minor_groups: Vec<String>,
}

#[utoipa::path(
    get,
    path = "/groups",
    responses((status = OK, body = MuscleGroups)),
    tag = super::MUSCLES_TAG
)]
pub async fn get_groups(State(state): State<AppState>) -> Result<Json<MuscleGroups>, AppError> {
    let major_groups = query_scalar::<_, String>(
        r#"
        SELECT DISTINCT major_group
        FROM muscles
        WHERE major_group IS NOT NULL
        ORDER BY major_group ASC
        "#,
    )
    .fetch_all(&*state.db)
    .await?;

    let minor_groups = query_scalar::<_, String>(
        r#"
        SELECT DISTINCT minor_group
        FROM muscles
        WHERE minor_group IS NOT NULL
        ORDER BY minor_group ASC
        "#,
    )
    .fetch_all(&*state.db)
    .await?;

    Ok(Json(MuscleGroups {
        major_groups,
        minor_groups,
    }))
}
