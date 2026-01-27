use crate::AppState;

pub(super) use super::*;

pub mod workout;

pub const SYNC_TAG: &str = "sync";

pub(super) fn router(state: AppState) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(workout::sync_workout))
        .with_state(state)
}
