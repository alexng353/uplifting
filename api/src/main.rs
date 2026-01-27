use hmac::{Hmac, Mac};
use std::{net::Ipv4Addr, sync::Arc, time::Duration};
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use utoipa::OpenApi;
use utoipa_axum::{router::OpenApiRouter, routes};
use utoipa_swagger_ui::SwaggerUi;

// tags
use v1::{
    auth::AUTH_TAG, exercises::EXERCISES_TAG, friends::FRIENDS_TAG, muscles::MUSCLES_TAG,
    sets::SETS_TAG, sync::SYNC_TAG, users::USERS_TAG, workouts::WORKOUTS_TAG,
};

mod db;
mod error;
mod extractors;
mod state;
mod structs;
mod util;
mod v1;

pub(crate) use anyhow::Context;
pub(crate) use axum::extract::{Json, State};
pub(crate) use error::{AppError, Errors};
pub(crate) use serde::{Deserialize, Serialize};
pub(crate) use state::AppState;
pub(crate) use utoipa::ToSchema;

use state::MailgunConfig;

/// Validates that all required environment variables are set and returns their values
fn validate_env() -> anyhow::Result<EnvConfig> {
    let mut missing = Vec::new();

    let mailgun_api_key = std::env::var("MAILGUN_API_KEY").ok();
    let mailgun_domain = std::env::var("MAILGUN_DOMAIN").ok();
    let mailgun_base_url = std::env::var("MAILGUN_BASE_URL").ok();
    let mailgun_from_email = std::env::var("MAILGUN_FROM_EMAIL").ok();

    if mailgun_api_key.is_none() {
        missing.push("MAILGUN_API_KEY");
    }
    if mailgun_domain.is_none() {
        missing.push("MAILGUN_DOMAIN");
    }
    if mailgun_base_url.is_none() {
        missing.push("MAILGUN_BASE_URL");
    }
    if mailgun_from_email.is_none() {
        missing.push("MAILGUN_FROM_EMAIL");
    }

    if !missing.is_empty() {
        anyhow::bail!(
            "Missing required environment variables: {}",
            missing.join(", ")
        );
    }

    Ok(EnvConfig {
        mailgun: MailgunConfig {
            api_key: mailgun_api_key.unwrap(),
            domain: mailgun_domain.unwrap(),
            base_url: mailgun_base_url.unwrap(),
            from_email: mailgun_from_email.unwrap(),
        },
    })
}

struct EnvConfig {
    mailgun: MailgunConfig,
}

#[derive(OpenApi)]
#[openapi(
    tags(
        (name = AUTH_TAG, description = "Authentication API endpoints"),
        (name = EXERCISES_TAG, description = "Exercise API endpoints"),
        (name = FRIENDS_TAG, description = "Friends API endpoints"),
        (name = MUSCLES_TAG, description = "Muscle API endpoints"),
        (name = SETS_TAG, description = "Set API endpoints"),
        (name = SYNC_TAG, description = "Sync API endpoints"),
        (name = USERS_TAG, description = "Users API endpoints"),
        (name = WORKOUTS_TAG, description = "Workout API endpoints"),
    ),
)]
struct ApiDoc;

/// Get health of the API.
#[utoipa::path(
    get,
    path = "/.well-known/health-check",
    responses(
        (status = OK, description = "Success", body = str, content_type = "text/plain")
    )
)]
async fn health_check() -> &'static str {
    "ok"
}

#[utoipa::path(
    get,
    path = "/",
    responses(
        (status = OK, description = "Success", body = str, content_type = "text/plain")
    )
)]
async fn index() -> &'static str {
    "ok 200"
}

/// Create a dummy state for spec generation (won't be used at runtime)
fn dummy_state() -> AppState {
    state::AppState {
        db: Arc::new(
            sqlx::pool::PoolOptions::new()
                .max_connections(1)
                .connect_lazy("postgres://localhost/dummy")
                .expect("Failed to create dummy pool"),
        ),
        jwt_key: Hmac::new_from_slice(b"dummy").expect("Failed to create dummy HMAC"),
        mailgun: MailgunConfig {
            api_key: String::new(),
            domain: String::new(),
            base_url: String::new(),
            from_email: String::new(),
        },
    }
}

/// Build the API router with OpenAPI spec
fn build_router(state: AppState) -> (axum::Router, utoipa::openapi::OpenApi) {
    OpenApiRouter::with_openapi(ApiDoc::openapi())
        .routes(routes!(health_check))
        .routes(routes!(index))
        .with_state(state.clone())
        .nest("/api/v1", v1::router(state))
        .split_for_parts()
}

/// Generate OpenAPI spec without starting the server or connecting to database
fn generate_spec_only() -> anyhow::Result<()> {
    let (_, api) = build_router(dummy_state());
    std::fs::write("openapi.json", api.to_pretty_json()?)?;
    println!("Generated openapi.json");
    Ok(())
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Check for --generate-spec flag
    let args: Vec<String> = std::env::args().collect();
    if args.iter().any(|arg| arg == "--generate-spec") {
        return generate_spec_only();
    }

    dotenv::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "api=debug,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Validate required environment variables
    let env_config = validate_env()?;

    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()?;
    let jwt_secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let mobile_frontend_url = std::env::var("MOBILE_FRONTEND_URL")
        .unwrap_or_else(|_| "http://localhost:5173".to_string());

    let db = db::db().await?;
    let state = state::AppState {
        db: Arc::new(db),
        jwt_key: Hmac::new_from_slice(jwt_secret.as_bytes()).context("Failed to create HMAC")?,
        mailgun: env_config.mailgun,
    };

    let cors = CorsLayer::new()
        .allow_methods(Any)
        .allow_origin([mobile_frontend_url
            .parse()
            .context("Invalid MOBILE_FRONTEND_URL")?])
        .allow_headers(Any);

    let trace = TraceLayer::new_for_http()
        .make_span_with(|request: &axum::http::Request<_>| {
            tracing::info_span!(
                "http_request",
                method = %request.method(),
                uri = %request.uri(),
            )
        })
        .on_response(
            |response: &axum::http::Response<_>, latency: Duration, _span: &tracing::Span| {
                tracing::info!(
                    status = %response.status(),
                    latency = ?latency,
                    "response"
                );
            },
        );

    let (router, api) = build_router(state);
    let router = router.layer(cors).layer(trace);

    tokio::fs::write("openapi.json", api.to_pretty_json()?).await?;

    let router = router.merge(SwaggerUi::new("/docs").url("/docs/openapi.json", api));

    tracing::info!("Listening on http://0.0.0.0:{port}");
    let listener = TcpListener::bind((Ipv4Addr::UNSPECIFIED, port)).await?;
    axum::serve(listener, router).await?;

    Ok(())
}
