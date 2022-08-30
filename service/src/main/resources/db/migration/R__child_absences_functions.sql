-- Defined in the past
DROP FUNCTION IF EXISTS absences_in_range(uuid[], daterange);

CREATE OR REPLACE FUNCTION irregular_absence_filter(dst daily_service_time, theDate date) RETURNS boolean
    LANGUAGE SQL
    STABLE
AS
$$
SELECT dst.type = 'IRREGULAR'
           AND (dst.sunday_times IS NOT NULL OR dst.monday_times IS NOT NULL OR dst.tuesday_times IS NOT NULL OR
                dst.wednesday_times IS NOT NULL OR dst.thursday_times IS NOT NULL OR dst.friday_times IS NOT NULL OR
                dst.saturday_times IS NOT NULL)
           AND CASE extract(dow FROM theDate)
                   WHEN 0 THEN dst.sunday_times IS NULL
                   WHEN 1 THEN dst.monday_times IS NULL
                   WHEN 2 THEN dst.tuesday_times IS NULL
                   WHEN 3 THEN dst.wednesday_times IS NULL
                   WHEN 4 THEN dst.thursday_times IS NULL
                   WHEN 5 THEN dst.friday_times IS NULL
                   WHEN 6 THEN dst.saturday_times IS NULL
           END
$$;
COMMENT ON FUNCTION irregular_absence_filter IS
    'For internal use only';


CREATE OR REPLACE FUNCTION all_absences_in_range(period daterange)
    RETURNS TABLE
            (
                id               uuid,
                child_id         uuid,
                date             date,
                absence_type     absence_type,
                modified_at      timestamp with time zone,
                modified_by      uuid,
                category         absence_category,
                questionnaire_id uuid
            )
    LANGUAGE SQL
    STABLE
AS
$$
SELECT *
FROM absence a
WHERE between_start_and_end(period, a.date)
UNION
SELECT dst.id                             as id,
       dst.child_id                       as child_id,
       d::date                            as date,
       'OTHER_ABSENCE'::absence_type      as absence_type,
       dst.updated                        as modified_at,
       null::uuid                         as modified_by,
       unnest(absence_categories(p.type)) as category,
       null::uuid                         as questionnaire_id
FROM daily_service_time as dst
         JOIN generate_series(lower(period), upper(period) - 1, '1 day') as d ON dst.validity_period @> d::date
         JOIN placement as p ON p.child_id = dst.child_id AND d BETWEEN p.start_date AND p.end_date
WHERE irregular_absence_filter(dst, d::date)
  -- Do not move the following into the filter function, as that will cause the function to not be inlined
  AND NOT EXISTS(SELECT ca.date FROM child_attendance ca WHERE ca.child_id = dst.child_id AND ca.date = d::date)
  AND NOT EXISTS(SELECT ar.date FROM attendance_reservation ar WHERE ar.child_id = dst.child_id AND ar.date = d::date)
$$;
COMMENT ON FUNCTION all_absences_in_range(period daterange) IS
    'period must have non-null start and end dates';


CREATE OR REPLACE FUNCTION child_absences_in_range(childId uuid, period daterange)
    RETURNS TABLE
            (
                id               uuid,
                child_id         uuid,
                date             date,
                absence_type     absence_type,
                modified_at      timestamp with time zone,
                modified_by      uuid,
                category         absence_category,
                questionnaire_id uuid
            )
    LANGUAGE SQL
    STABLE
AS
$$
SELECT *
FROM absence a
WHERE between_start_and_end(period, a.date)
  AND a.child_id = childId
UNION
SELECT dst.id                             as id,
       childId                            as child_id,
       d::date                            as date,
       'OTHER_ABSENCE'::absence_type      as absence_type,
       dst.updated                        as modified_at,
       null::uuid                         as modified_by,
       unnest(absence_categories(p.type)) as category,
       null::uuid                         as questionnaire_id
FROM daily_service_time as dst
         JOIN generate_series(lower(period), upper(period) - 1, '1 day') as d
              ON dst.validity_period @> d::date
         JOIN placement as p ON p.child_id = dst.child_id AND d BETWEEN p.start_date AND p.end_date
WHERE dst.child_id = childId
  AND irregular_absence_filter(dst, d::date)
  -- Do not move the following into the filter function, as that will cause the function to not be inlined
  AND NOT EXISTS(SELECT ca.date FROM child_attendance ca WHERE ca.child_id = dst.child_id AND ca.date = d::date)
  AND NOT EXISTS(SELECT ar.date FROM attendance_reservation ar WHERE ar.child_id = dst.child_id AND ar.date = d::date)
$$;
COMMENT ON FUNCTION child_absences_in_range(childId uuid, period daterange) IS
    'period must have non-null start and end dates';


CREATE OR REPLACE FUNCTION child_absences_on_date(childId uuid, theDate date)
    RETURNS TABLE
            (
                id               uuid,
                child_id         uuid,
                date             date,
                absence_type     absence_type,
                modified_at      timestamp with time zone,
                modified_by      uuid,
                category         absence_category,
                questionnaire_id uuid
            )
    LANGUAGE SQL
    STABLE
AS
$$
SELECT *
FROM absence a
WHERE a.date = theDate
  AND a.child_id = childId
UNION
SELECT dst.id                             as id,
       dst.child_id                       as child_id,
       theDate                            as date,
       'OTHER_ABSENCE'::absence_type      as absence_type,
       dst.updated                        as modified_at,
       null::uuid                         as modified_by,
       unnest(absence_categories(p.type)) as category,
       null::uuid                         as questionnaire_id
FROM daily_service_time as dst
         JOIN placement as p ON theDate BETWEEN p.start_date AND p.end_date AND p.child_id = childId
WHERE dst.child_id = childId
  AND irregular_absence_filter(dst, theDate)
  -- Do not move the following into the filter function, as that will cause the function to not be inlined
  AND NOT EXISTS(SELECT ca.date FROM child_attendance ca WHERE ca.child_id = dst.child_id AND ca.date = theDate)
  AND NOT EXISTS(SELECT ar.date FROM attendance_reservation ar WHERE ar.child_id = dst.child_id AND ar.date = theDate)
$$;