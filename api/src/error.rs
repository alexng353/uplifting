use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};
use std::str::Utf8Error;
use tracing::error;

#[allow(dead_code)]
pub enum Errors {
    TooBig(usize),
    SqlxError(sqlx::Error),
    Ise(anyhow::Error),
    Unimplemented,
    Unauthorized,
    Forbidden(String),
    JWTExpired,
}

pub enum AppError {
    AnyhowError(AnyhowError),
    Error(Errors),
}

impl AppError {
    pub fn forbidden(message: impl Into<String>) -> Self {
        AppError::Error(Errors::Forbidden(message.into()))
    }
}

impl From<anyhow::Error> for AppError {
    fn from(e: anyhow::Error) -> Self {
        AppError::AnyhowError(AnyhowError(e))
    }
}

impl From<sqlx::types::uuid::Error> for AppError {
    fn from(e: sqlx::types::uuid::Error) -> Self {
        AppError::Error(Errors::SqlxError(sqlx::Error::Decode(e.into())))
    }
}

impl From<Errors> for AppError {
    fn from(e: Errors) -> Self {
        AppError::Error(e)
    }
}

impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        AppError::Error(Errors::SqlxError(e))
    }
}

impl From<Utf8Error> for AppError {
    fn from(e: Utf8Error) -> Self {
        AppError::Error(Errors::Ise(anyhow::Error::from(e)))
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        match self {
            AppError::AnyhowError(e) => e.into_response(),

            AppError::Error(e) => match e {
                Errors::TooBig(size_limit) => (
                    StatusCode::BAD_REQUEST,
                    format!("Value cannot be greater than {size_limit} bytes"),
                )
                    .into_response(),

                Errors::SqlxError(e) => {
                    error!(error = %e, error_debug = ?e, "Database error");
                    (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response()
                }

                Errors::Ise(e) => {
                    log_anyhow_error(&e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response()
                }

                Errors::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized").into_response(),

                Errors::Forbidden(msg) => (StatusCode::FORBIDDEN, msg).into_response(),

                Errors::Unimplemented => {
                    (StatusCode::NOT_IMPLEMENTED, "Not implemented").into_response()
                }

                Errors::JWTExpired => (
                    StatusCode::UNAUTHORIZED,
                    "JWT has expired. Please log in again.",
                )
                    .into_response(),
            },
        }
    }
}

// Make our own error that wraps `anyhow::Error`.
pub struct AnyhowError(anyhow::Error);

fn log_anyhow_error(e: &anyhow::Error) {
    error!(
        error = %e,
        error_debug = ?e,
        "Internal server error"
    );

    // Log the full error chain
    for (i, cause) in e.chain().enumerate() {
        error!(cause_index = i, cause = %cause, "Error chain");
    }
}

// Tell axum how to convert `AppError` into a response.
impl IntoResponse for AnyhowError {
    fn into_response(self) -> Response {
        log_anyhow_error(&self.0);
        (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response()
    }
}

// This enables using `?` on functions that return `Result<_, anyhow::Error>` to turn them into
// `Result<_, AppError>`. That way you don't need to do that manually.
impl<E> From<E> for AnyhowError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        Self(err.into())
    }
}
