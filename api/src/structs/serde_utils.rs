use std::ops::Deref;

use chrono::{DateTime, NaiveDateTime, Utc};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use utoipa::ToSchema;

/// A DateTime<Utc> wrapper that round-trips JavaScript ISO 8601 strings.
///
/// Deserialize: accepts "2026-01-16T07:57:30.097Z" or "2026-01-16T07:57:30.097"
/// Serialize: always produces ISO 8601 with 'Z' suffix.
#[derive(Debug, Clone, Copy, ToSchema)]
pub struct JSDate(pub DateTime<Utc>);

impl Serialize for JSDate {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.0.to_rfc3339_opts(chrono::SecondsFormat::Millis, true))
    }
}

impl<'de> Deserialize<'de> for JSDate {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        // Try parsing as RFC 3339 first (has timezone info like 'Z' or '+00:00')
        if let Ok(dt) = DateTime::parse_from_rfc3339(&s) {
            return Ok(JSDate(dt.with_timezone(&Utc)));
        }
        // Fall back to naive parsing (assume UTC)
        let s_stripped = s.strip_suffix('Z').unwrap_or(&s);
        NaiveDateTime::parse_from_str(s_stripped, "%Y-%m-%dT%H:%M:%S%.f")
            .or_else(|_| NaiveDateTime::parse_from_str(s_stripped, "%Y-%m-%dT%H:%M:%S"))
            .map(|naive| JSDate(naive.and_utc()))
            .map_err(serde::de::Error::custom)
    }
}

impl Deref for JSDate {
    type Target = DateTime<Utc>;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<JSDate> for DateTime<Utc> {
    fn from(val: JSDate) -> Self {
        val.0
    }
}
