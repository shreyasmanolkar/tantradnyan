-- Loaded into a unique per-run schema by the test harness.
CREATE TABLE records (
  id text PRIMARY KEY,
  value bigint NOT NULL CHECK (value >= 0),
  version bigint NOT NULL CHECK (version >= 0)
);
INSERT INTO records VALUES ('counter', 0, 0);
CREATE TABLE doctors (id integer PRIMARY KEY, on_call boolean NOT NULL);
INSERT INTO doctors VALUES (1, true), (2, true);
CREATE TABLE operation_results (
  op_id text PRIMARY KEY CHECK (length(op_id) BETWEEN 1 AND 128),
  expected_version bigint NOT NULL CHECK (expected_version >= 0),
  delta bigint NOT NULL,
  outcome jsonb
);
CREATE TABLE changes (
  record_id text NOT NULL REFERENCES records(id),
  version bigint NOT NULL,
  value bigint NOT NULL,
  op_id text NOT NULL UNIQUE REFERENCES operation_results(op_id),
  PRIMARY KEY (record_id, version)
);

-- One fixed record/object scope. Caller must use READ COMMITTED (lab) or
-- handle whole-transaction retries under stronger isolation.
CREATE FUNCTION submit_increment(p_op_id text, p_expected bigint, p_delta bigint)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  claimed text;
  old_result operation_results%ROWTYPE;
  next_value bigint;
  next_version bigint;
  result jsonb;
BEGIN
  IF p_op_id IS NULL OR p_expected IS NULL OR p_delta IS NULL THEN
    RAISE EXCEPTION 'non-null request required' USING ERRCODE = '23514';
  END IF;
  INSERT INTO operation_results(op_id, expected_version, delta)
  VALUES (p_op_id, p_expected, p_delta)
  ON CONFLICT DO NOTHING RETURNING op_id INTO claimed;
  IF claimed IS NULL THEN
    SELECT * INTO STRICT old_result FROM operation_results WHERE op_id = p_op_id;
    IF old_result.expected_version <> p_expected OR old_result.delta <> p_delta THEN
      RAISE EXCEPTION 'operation identity reused with different request' USING ERRCODE = '23514';
    END IF;
    IF old_result.outcome IS NULL THEN RAISE EXCEPTION 'incomplete replay record'; END IF;
    RETURN old_result.outcome;
  END IF;
  UPDATE records SET value = value + p_delta, version = version + 1
  WHERE id = 'counter' AND version = p_expected AND value + p_delta >= 0
  RETURNING value, version INTO next_value, next_version;
  IF FOUND THEN
    -- Strings preserve bigint precision in JavaScript consumers.
    result := jsonb_build_object('accepted', true, 'value', next_value::text, 'version', next_version::text);
    INSERT INTO changes VALUES ('counter', next_version, next_value, p_op_id);
  ELSE
    result := jsonb_build_object('accepted', false, 'reason', 'stale_or_invariant');
  END IF;
  UPDATE operation_results SET outcome = result WHERE op_id = p_op_id;
  RETURN result;
END;
$$;
