-- Expand club_settings with all homepage content fields
-- Simple text fields
INSERT INTO club_settings (key, value) VALUES
  ('motto', 'Fly the pitch'),
  ('practice_days', 'Tuesdays & Thursdays'),
  ('practice_time', '6:00 – 8:00 PM'),
  ('practice_note', 'Open training — first-timers welcome'),
  ('pitch_address', '555 E Nine Mile Rd'),
  ('pitch_city', 'Pensacola, FL'),
  ('pitch_maps_url', 'https://www.google.com/maps/search/?api=1&query=555+E+Nine+Mile+Rd+Pensacola+FL'),
  ('instagram_url', 'https://www.instagram.com/pensacola_rugby/'),
  ('facebook_url', 'https://www.facebook.com/pensacolarugby/'),
  ('about_body', 'Pensacola Aviators Rugby is the home of club rugby in Northwest Florida — men''s Aviators and women''s Aviatrix training side by side, competing in fifteens seasons and sevens weekends across the Southeast.'),
  ('practice_body', 'Open practices twice a week at our pitch on Nine Mile Road. Bring athletic gear, water, and a willingness to learn.'),
  ('join_body', 'The fastest way in is simple: show up. Drop your details so we know you''re coming, then join us Tuesday or Thursday at 6 PM.'),
  ('sponsor_blurb', 'Thanks to the businesses that keep the club flying.'),
  ('duration', '2 hours'),
  ('first_session', 'Free'),
  ('sponsor_name', 'Local partners')
ON CONFLICT (key) DO NOTHING;

-- JSON-structured fields
INSERT INTO club_settings (key, value) VALUES
  ('stats', '[{"value":"Est.","label":"Gulf Coast club"},{"value":"2×","label":"Weekly training"},{"value":"15s","label":"& Sevens"},{"value":"Open","label":"Always recruiting"}]'),
  ('values', '[{"title":"Pack","body":"We train together, compete together, and lift each other after the whistle."},{"title":"Grit","body":"Fitness, collisions, and second effort — that''s the Aviator way."},{"title":"Community","body":"From first-timers to veterans, everyone has a role in the club."}]'),
  ('teams', '[{"name":"Aviators","side":"Men''s","description":"Men''s club side competing in fifteens seasons and sevens weekends across the Southeast."},{"name":"Aviatrix","side":"Women''s","description":"Women''s club side — skill development, competition, and a strong club culture."}]'),
  ('join_steps', '[{"step":"01","title":"Show up to practice","body":"Tuesdays and Thursdays at 6 PM. No tryout — just introduce yourself."},{"step":"02","title":"Train with the squad","body":"Learn the game, build fitness, and earn your spot in the pack or backline."},{"step":"03","title":"Play for Pensacola","body":"Represent the Aviators or Aviatrix in season games and sevens weekends."}]')
ON CONFLICT (key) DO NOTHING;
