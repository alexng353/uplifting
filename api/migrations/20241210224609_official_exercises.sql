-- Add migration script here

ALTER TABLE exercises 
ADD COLUMN official BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN author_id UUID REFERENCES users(id),
ADD COLUMN description TEXT,
ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT NOW();
