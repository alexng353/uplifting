pub(super) use utoipa_axum::router::OpenApiRouter;
pub(super) use utoipa_axum::routes;

use crate::AppState;

pub mod auth;
pub mod exercises;
pub mod friends;
pub mod muscles;
pub mod sets;
pub mod sync;
pub mod users;
pub mod workouts;

pub fn router(state: AppState) -> OpenApiRouter {
    OpenApiRouter::new()
        .with_state(state.clone())
        .nest("/auth", auth::router(state.clone()))
        .nest("/exercises", exercises::router(state.clone()))
        .nest("/muscles", muscles::router(state.clone()))
        .nest("/workouts", workouts::router(state.clone()))
        .nest("/sets", sets::router(state.clone()))
        .nest("/friends", friends::router(state.clone()))
        .nest("/users", users::router(state.clone()))
        .nest("/sync", sync::router(state.clone()))
}
