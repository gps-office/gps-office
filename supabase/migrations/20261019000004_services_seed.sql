-- GPS Office – service types and starting document checklists.
-- Prices are left blank for the admin to fill in under Settings → Services.
-- Checklists are a starting point and can be edited in Settings.

insert into public.services (code, name, category, sort_order) values
  ('british_passport',     'British passport',                         'United Kingdom', 10),
  ('british_citizenship',  'British citizenship',                      'United Kingdom', 20),
  ('uk_visa',              'UK visa and immigration',                  'United Kingdom', 30),
  ('euss',                 'EU Settlement Scheme (EUSS)',              'United Kingdom', 40),
  ('evisa',                'eVisa',                                    'United Kingdom', 50),
  ('ni_number',            'National Insurance number',                'United Kingdom', 60),
  ('right_to_work',        'Right to work / Home Office compliance',   'United Kingdom', 70),
  ('us_passport',          'American passport',                        'United States', 80),
  ('us_citizenship_crba',  'US citizenship / CRBA',                    'United States', 90),
  ('israeli_passport',     'Israeli passport',                         'Israel', 100),
  ('israeli_citizenship',  'Israeli citizenship / consular',           'Israel', 110),
  ('israeli_military',     'Israeli military status',                  'Israel', 120),
  ('apostille',            'Apostille, notarisation and legalisation', 'Legalisation', 130),
  ('other',                'Other specialist case',                    'Other', 140);

insert into public.service_checklist_items (service_id, label, required, sort_order)
select s.id, i.label, i.required, i.sort_order
from (values
  ('british_passport', 'Completed HMPO application', true, 10),
  ('british_passport', 'Current or previous British passport', true, 20),
  ('british_passport', 'Passport photos / digital photo code', true, 30),
  ('british_passport', 'Full birth certificate', false, 40),
  ('british_passport', 'Parents'' birth / marriage certificates and passports (first application)', false, 50),
  ('british_passport', 'Countersignatory details', false, 60),
  ('british_passport', 'Evidence of change of name', false, 70),
  ('british_passport', 'Signed letter of authority', true, 80),

  ('british_citizenship', 'Current passport', true, 10),
  ('british_citizenship', 'eVisa / BRP or settlement evidence', true, 20),
  ('british_citizenship', 'Life in the UK test pass', true, 30),
  ('british_citizenship', 'English language evidence (B1 or degree)', true, 40),
  ('british_citizenship', 'Residence and absences evidence', true, 50),
  ('british_citizenship', 'Two referees'' details and declarations', true, 60),
  ('british_citizenship', 'Marriage / birth certificates (where relevant)', false, 70),
  ('british_citizenship', 'Biometrics appointment confirmation', true, 80),
  ('british_citizenship', 'Signed letter of authority', true, 90),

  ('uk_visa', 'Current passport', true, 10),
  ('uk_visa', 'Previous passports and visas', false, 20),
  ('uk_visa', 'Financial evidence', true, 30),
  ('uk_visa', 'Accommodation evidence', false, 40),
  ('uk_visa', 'Sponsor / relationship evidence', false, 50),
  ('uk_visa', 'English language evidence', false, 60),
  ('uk_visa', 'TB test certificate (where required)', false, 70),
  ('uk_visa', 'Biometrics appointment confirmation', true, 80),
  ('uk_visa', 'Signed letter of authority', true, 90),

  ('euss', 'Passport or national identity card', true, 10),
  ('euss', 'Evidence of UK residence', true, 20),
  ('euss', 'Previous EUSS decision (pre-settled status)', false, 30),
  ('euss', 'Family relationship evidence (family members)', false, 40),
  ('euss', 'Signed letter of authority', true, 50),

  ('evisa', 'Passport', true, 10),
  ('evisa', 'BRP / BRC or previous immigration document', true, 20),
  ('evisa', 'UKVI account access details', true, 30),
  ('evisa', 'Signed letter of authority', true, 40),

  ('ni_number', 'Passport', true, 10),
  ('ni_number', 'eVisa / right to work evidence', true, 20),
  ('ni_number', 'Proof of UK address', true, 30),

  ('right_to_work', 'Passport', true, 10),
  ('right_to_work', 'eVisa share code', false, 20),
  ('right_to_work', 'Employer details', true, 30),
  ('right_to_work', 'Home Office correspondence', false, 40),

  ('us_passport', 'Completed DS-11 / DS-82', true, 10),
  ('us_passport', 'Current or previous US passport', true, 20),
  ('us_passport', 'Evidence of US citizenship (birth / naturalisation certificate)', false, 30),
  ('us_passport', 'Passport photo (US specification)', true, 40),
  ('us_passport', 'Photo ID', true, 50),
  ('us_passport', 'Parental consent DS-3053 (minors)', false, 60),

  ('us_citizenship_crba', 'Completed DS-2029', true, 10),
  ('us_citizenship_crba', 'Child''s full birth certificate', true, 20),
  ('us_citizenship_crba', 'Parents'' marriage certificate', false, 30),
  ('us_citizenship_crba', 'US parent''s passport / citizenship evidence', true, 40),
  ('us_citizenship_crba', 'Evidence of US physical presence', true, 50),
  ('us_citizenship_crba', 'Both parents'' ID', true, 60),
  ('us_citizenship_crba', 'US Embassy London appointment confirmation', true, 70),

  ('israeli_passport', 'Israeli passport (current / previous)', true, 10),
  ('israeli_passport', 'Teudat Zehut (Israeli ID)', false, 20),
  ('israeli_passport', 'Passport photos', true, 30),
  ('israeli_passport', 'Consulate application form', true, 40),
  ('israeli_passport', 'Consulate appointment confirmation', true, 50),

  ('israeli_citizenship', 'Full birth certificate (apostilled)', true, 10),
  ('israeli_citizenship', 'Parents'' Israeli ID / passports', true, 20),
  ('israeli_citizenship', 'Parents'' marriage certificate (apostilled)', false, 30),
  ('israeli_citizenship', 'Consular registration forms', true, 40),
  ('israeli_citizenship', 'Passport photos', false, 50),

  ('israeli_military', 'Israeli ID / passport', true, 10),
  ('israeli_military', 'Proof of residence abroad', true, 20),
  ('israeli_military', 'Study / employment evidence', false, 30),
  ('israeli_military', 'IDF / consulate forms', true, 40),

  ('apostille', 'Original document(s)', true, 10),
  ('apostille', 'Copy of document(s)', false, 20),
  ('apostille', 'Client ID (notarisation)', false, 30),
  ('apostille', 'Return delivery details', true, 40)
) as i (code, label, required, sort_order)
join public.services s on s.code = i.code;
