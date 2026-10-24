-- External duty-estimation service shown to customers and admins.
-- title = service name, body = URL; editable under Admin → Site Content.
-- It is an independent third-party estimator, not an official Ghana Customs/GRA tool.
insert into public.content_blocks (key, title, body, data, published)
values (
  'duty_checker',
  'AutoDutyChecker',
  'https://autodutychecker.com/calculator/search-mode/',
  '{}'::jsonb,
  true
)
on conflict (key) do nothing;
