-- Leadership + area leaders on the roster. Re-runnable: clears staff rows first.
-- Does NOT touch volunteer rows (staff_role IS NULL). All leaders opted in to SMS.
-- NOTE: re-running mints fresh ids, so any leader portal/activation tokens are
-- dropped. Once leaders have self-activated, prefer targeted INSERTs over a reseed.
DELETE FROM volunteers WHERE staff_role IN ('Event Lead', 'Area Leader', 'Volunteer Coordinator');

-- Volunteer Coordinator — runs volunteer placement (assigner in owners.js too).
INSERT INTO volunteers (first_name, last_name, email, sms_consent, area_id, staff_role, assigned_by, assigned_at, created_at) VALUES
 ('Vickie', 'Wright', 'Vickie.Wright@cc-ea.org', 1, NULL, 'Volunteer Coordinator', 'staff setup', datetime('now'), datetime('now'));

-- Event Leads (the oversight team). Christian & Ben have phones on file; Jim &
-- Ryan don't yet (add later to text them). Pastor Jim also leads Janitorial.
INSERT INTO volunteers (first_name, last_name, email, phone, sms_consent, area_id, staff_role, assigned_by, assigned_at, created_at) VALUES
 ('Christian',  'Kopeny',   'christian.kopeny@cc-ea.org', '+17143053130', 1, NULL,         'Event Lead', 'staff setup', datetime('now'), datetime('now')),
 ('Ben',        'Goodner',  'ben.goodner@cc-ea.org',      '+17148781494', 1, NULL,         'Event Lead', 'staff setup', datetime('now'), datetime('now')),
 ('Ryan',       'Young',    'ryan.young@cc-ea.org',       NULL,           1, NULL,                 'Event Lead', 'staff setup', datetime('now'), datetime('now')),
 ('Pastor Jim', 'Richards', 'Jim.Richards@cc-ea.org',     NULL,           1, 'janitorial',         'Event Lead', 'staff setup', datetime('now'), datetime('now')),
 ('Scott',      'Wiedensohler', 'Scott.Wiedensohler@cc-ea.org', NULL,     1, 'emergency-response', 'Event Lead', 'staff setup', datetime('now'), datetime('now'));

-- Area Leaders (every area except Janitorial, led by Pastor Jim above). Opted in.
INSERT INTO volunteers (first_name, email, sms_consent, area_id, staff_role, assigned_by, assigned_at, created_at) VALUES
 ('Tanya Cox',            'mrstycox@gmail.com',          1, 'hair',               'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Sandra Angulo',        'mrssandraangulo@gmail.com',   1, 'nails',              'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Kyle Poffenberger',    'kyle.poffenberger@cc-ea.org', 1, 'clothing',           'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Becky Kopeny',         'becky.kopeny@cc-ea.org',      1, 'boutique',           'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Susan Bauerle',        'susan.bauerle@cc-ea.org',     1, 'craft',              'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Zack Moore',           'zack.moore@cc-ea.org',        1, 'food-prep',          'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('David & Sunny Barrs',  'sunnyday@silverlion.net',     1, 'food-service',       'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('KC Mercer',            'kingc67@yahoo.com',           1, 'dining-room',        'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Pastor Ozzie',         'ozzie.castillo@cc-ea.org',    1, 'prayer-evangelism',  'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Joe McGuire',          'mcguire7576@gmail.com',       1, 'prayer-evangelism',  'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Josh Teasley',         'josh.teasley@cc-ea.org',      1, 'welcome-greeter',    'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Rachael Kinoshita',    'Rachael.Kinoshita@cc-ea.org', 1, 'guest-check-in',     'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Christena Mancino',    'christena.mancino@cc-ea.org', 1, 'childrens-ministry', 'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Roz Galvez',           'roz.galvez@cc-ea.org',        1, 'childrens-ministry', 'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Kent Toca',            'drkentjt@yahoo.com',          1, 'dental',             'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Katie Kinoshita',      'katie.kinoshita@gmail.com',   1, 'optometry',          'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Mark Schneider',       'goclimbit@gmail.com',         1, 'legal-services',     'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Tony Gonzales',        'Tony.Gonzalesty@gmail.com',   1, 'first-response',     'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Vinson Lui',           'Vinson.Lui@cc-ea.org',        1, 'setup-team',         'Area Leader', 'staff setup', datetime('now'), datetime('now')),
 ('Vinson Lui',           'Vinson.Lui@cc-ea.org',        1, 'tear-down-team',     'Area Leader', 'staff setup', datetime('now'), datetime('now'));
