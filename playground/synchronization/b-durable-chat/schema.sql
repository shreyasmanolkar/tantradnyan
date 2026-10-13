CREATE SCHEMA IF NOT EXISTS __SCHEMA__;
SET LOCAL search_path TO __SCHEMA__, pg_catalog;
CREATE TABLE IF NOT EXISTS channels (
  channel_id text PRIMARY KEY,
  epoch uuid NOT NULL DEFAULT gen_random_uuid(),
  next_seq bigint NOT NULL DEFAULT 1 CHECK(next_seq>=1),
  floor bigint NOT NULL DEFAULT 0 CHECK(floor>=0 AND floor<next_seq)
);
CREATE TABLE IF NOT EXISTS memberships (
  channel_id text NOT NULL REFERENCES channels(channel_id),
  user_id text NOT NULL,
  PRIMARY KEY(channel_id,user_id)
);
CREATE TABLE IF NOT EXISTS messages (
  message_id uuid PRIMARY KEY,
  channel_id text NOT NULL REFERENCES channels(channel_id),
  seq bigint NOT NULL CHECK(seq>=1),
  author_id text NOT NULL,
  body text NOT NULL CHECK(octet_length(body) BETWEEN 1 AND 4096),
  UNIQUE(channel_id,seq)
);
CREATE TABLE IF NOT EXISTS operation_results (
  user_id text NOT NULL,
  op_id text NOT NULL,
  channel_id text NOT NULL,
  body text NOT NULL,
  outcome jsonb,
  PRIMARY KEY(user_id,op_id)
);
CREATE TABLE IF NOT EXISTS outbox (
  channel_id text NOT NULL,
  seq bigint NOT NULL,
  published boolean NOT NULL DEFAULT false,
  PRIMARY KEY(channel_id,seq),
  FOREIGN KEY(channel_id,seq) REFERENCES messages(channel_id,seq)
);
INSERT INTO channels(channel_id) VALUES('general'),('private') ON CONFLICT DO NOTHING;
INSERT INTO memberships VALUES('general','M'),('general','D'),('private','M') ON CONFLICT DO NOTHING;
