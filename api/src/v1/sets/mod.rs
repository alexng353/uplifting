use crate::AppState;

pub(super) use super::*;

pub mod create;
pub mod delete;
pub mod update;

pub const SETS_TAG: &str = "sets";

pub(super) fn router(state: AppState) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(create::create_set))
        .routes(routes!(update::update_set))
        .routes(routes!(delete::delete_set))
        .with_state(state)
}
