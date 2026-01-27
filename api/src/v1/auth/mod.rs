use crate::AppState;

pub(super) use super::*;

pub mod login;
pub mod password;
pub mod signup;
pub mod verify;

pub const AUTH_TAG: &str = "auth";

pub(super) fn router(state: AppState) -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(signup::signup))
        .routes(routes!(login::login))
        .routes(routes!(password::request_password_change))
        .routes(routes!(password::change_password))
        .routes(routes!(verify::send_verification))
        .routes(routes!(verify::verify_email))
        .with_state(state)
}
