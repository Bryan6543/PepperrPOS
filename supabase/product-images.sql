-- Pepperr: assign product card images (run once in Supabase SQL Editor after schema.sql).
-- Uses placehold.co PNGs with Pepperr colours + a short label per dish (no binary uploads).
-- Safe to re-run: overwrites image_url for all active products.

update public.products as p
set image_url =
  'https://placehold.co/640x400/e85d2c/ffffff/png?text=' ||
  replace(
    replace(
      replace(
        replace(
          replace(
            replace(
              regexp_replace(
                left(
                  regexp_replace(c.name, '[^A-Za-z0-9]+', '', 'g'),
                  10
                )
                || '-'
                || regexp_replace(p.name, '[^A-Za-z0-9]+', '', 'g'),
                '%',
                'pct'
              ),
              '&',
              'and'
            ),
            '(',
            ''
          ),
          ')',
          ''
        ),
        ' ',
        ''
      ),
      E'\n',
      ''
    ),
    E'\r',
    ''
  )
from public.categories as c
where p.category_id = c.id
  and p.is_active = true;
