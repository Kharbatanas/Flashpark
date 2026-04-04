-- Flashpark seed data for local development
-- Run in Supabase SQL Editor

-- 1. Create fake users
INSERT INTO users (id, supabase_id, email, full_name, role, is_verified, phone_number)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'host@flashpark.fr', 'Marie Laurent', 'host', true, '+33 6 12 34 56 78'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'pierre@flashpark.fr', 'Pierre Durand', 'both', true, '+33 6 98 76 54 32'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'sophie@flashpark.fr', 'Sophie Martin', 'host', true, '+33 6 11 22 33 44')
ON CONFLICT (id) DO NOTHING;

-- 2. Create 12 sample spots in Nice with real descriptions and placeholder photos
INSERT INTO spots (host_id, title, description, address, city, latitude, longitude, price_per_hour, price_per_day, type, status, has_smart_gate, amenities, instant_book, photos, rating, review_count)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Garage sécurisé — Rue de France',
    'Garage privé fermé à clé, situé au cœur de Nice à 200m de la Promenade des Anglais. Accès 24h/24 via badge, caméra de surveillance et éclairage permanent. Idéal pour les séjours longue durée ou les sorties en soirée sans stress.',
    '28 Rue de France, 06000 Nice',
    'Nice',
    43.6947, 7.2583,
    3.50, 25.00,
    'garage', 'active', true,
    '["lighting", "security_camera", "24h_access"]',
    true,
    '["https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400&h=300&fit=crop"]',
    4.97, 124
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Box couvert — Vieux-Nice',
    'Place couverte dans le Vieux-Nice, à deux pas du Cours Saleya et du marché aux fleurs. Protégée des intempéries, cette place est parfaite pour explorer le centre historique à pied. Hauteur limitée à 1m90.',
    '5 Rue de la Préfecture, 06300 Nice',
    'Nice',
    43.6960, 7.2726,
    2.80, 20.00,
    'covered', 'active', false,
    '["lighting", "covered", "security_camera"]',
    true,
    '["https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop"]',
    4.85, 89
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Place extérieure — Promenade',
    'Place en plein air face à la Baie des Anges, à 30 secondes de la plage. Emplacement pratique pour profiter de la Promenade des Anglais, des restaurants et de la vie niçoise. Pas de hauteur limitée.',
    '95 Promenade des Anglais, 06000 Nice',
    'Nice',
    43.6921, 7.2495,
    1.90, 14.00,
    'outdoor', 'active', false,
    '["lighting"]',
    true,
    '["https://images.unsplash.com/photo-1494515843206-f3117d3f51b7?w=400&h=300&fit=crop"]',
    4.72, 56
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Parking souterrain — Gare Thiers',
    'Box en sous-sol dans résidence sécurisée, à 3 minutes à pied de la gare Nice-Ville. Accès par badge, éclairage automatique, caméra de surveillance. Parfait pour les voyageurs et pendulaires. Accès PMR disponible.',
    '8 Avenue Thiers, 06000 Nice',
    'Nice',
    43.7045, 7.2620,
    2.50, 18.00,
    'underground', 'active', true,
    '["lighting", "security_camera", "disabled_access", "24h_access"]',
    true,
    '["https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=400&h=300&fit=crop"]',
    4.90, 203
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Box privé — Cimiez',
    'Box individuel dans le quartier résidentiel de Cimiez, proche du musée Matisse et du monastère. Environnement calme et verdoyant. Convient aux grands véhicules (SUV, monospace). Accès libre 7j/7.',
    '22 Avenue de Cimiez, 06000 Nice',
    'Nice',
    43.7183, 7.2725,
    4.00, 28.00,
    'garage', 'active', false,
    '["lighting", "24h_access"]',
    false,
    '["https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=400&h=300&fit=crop"]',
    5.0, 31
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Parking couvert — Libération',
    'Place abritée dans le quartier de la Libération, à côté du tramway T1. Accès direct depuis la rue, pas besoin de clé ni de badge. Idéal pour les courses au marché de la Libération ou une visite chez le médecin.',
    '15 Place du Général de Gaulle, 06000 Nice',
    'Nice',
    43.7108, 7.2747,
    2.20, 16.00,
    'covered', 'active', false,
    '["lighting", "covered"]',
    true,
    '["https://images.unsplash.com/photo-1545179605-3b35c3cba2e7?w=400&h=300&fit=crop"]',
    4.80, 77
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Garage Smart Gate — Port de Nice',
    'Garage équipé Smart Gate : la barrière s''ouvre automatiquement à votre arrivée via l''app Flashpark. Situé face au port de Nice, à proximité du Château et de la vieille ville. Borne de recharge électrique disponible.',
    '3 Quai des Docks, 06300 Nice',
    'Nice',
    43.6955, 7.2840,
    4.50, 32.00,
    'garage', 'active', true,
    '["ev_charging", "security_camera", "lighting", "24h_access"]',
    true,
    '["https://images.unsplash.com/photo-1621929747188-0b4dc28498d6?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop"]',
    4.95, 167
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Place extérieure — Arénas',
    'Emplacement extérieur dans le quartier Arénas, à 10 min de l''aéroport Nice Côte d''Azur. Pratique pour les déplacements professionnels ou pour déposer quelqu''un à l''aéroport. Tarif avantageux.',
    '40 Boulevard René Cassin, 06200 Nice',
    'Nice',
    43.6654, 7.2155,
    1.50, 10.00,
    'outdoor', 'active', false,
    '["lighting"]',
    true,
    '["https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=400&h=300&fit=crop"]',
    4.60, 42
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Box sécurisé — Carré d''Or',
    'Box fermé dans le Carré d''Or, le quartier le plus prisé de Nice. Résidence grand standing avec gardien, vidéosurveillance et accès par digicode. À deux pas de la Place Masséna et des Galeries Lafayette.',
    '10 Rue Paradis, 06000 Nice',
    'Nice',
    43.6978, 7.2681,
    5.00, 35.00,
    'indoor', 'active', true,
    '["lighting", "security_camera", "covered", "24h_access", "disabled_access"]',
    true,
    '["https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&h=300&fit=crop"]',
    4.92, 98
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Parking résidentiel — Saint-Roch',
    'Place dans parking résidentiel calme du quartier Saint-Roch. Proche du centre-ville et des transports en commun (bus, tram). Convient aux véhicules de taille standard.',
    '7 Rue Pastorelli, 06000 Nice',
    'Nice',
    43.7023, 7.2688,
    2.00, 14.00,
    'indoor', 'active', false,
    '["lighting", "security_camera"]',
    true,
    '["https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=300&fit=crop"]',
    4.65, 53
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Place couverte — Nice Nord',
    'Place abritée dans quartier résidentiel Nice Nord, idéale pour les habitants du quartier ou visiteurs du parc Phoenix. Accès facile depuis l''autoroute A8.',
    '120 Route de Grenoble, 06200 Nice',
    'Nice',
    43.7235, 7.2550,
    1.80, 12.00,
    'covered', 'active', false,
    '["lighting", "covered"]',
    false,
    '["https://images.unsplash.com/photo-1545179605-3b35c3cba2e7?w=400&h=300&fit=crop"]',
    4.50, 28
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Garage double — Mont Boron',
    'Grand garage pouvant accueillir un grand véhicule ou deux petits. Vue sur le port depuis la résidence. Quartier calme et sécurisé de Mont Boron, à 5 min du centre en voiture.',
    '15 Boulevard Franck Pilatte, 06300 Nice',
    'Nice',
    43.6923, 7.2946,
    6.00, 40.00,
    'garage', 'active', true,
    '["lighting", "security_camera", "ev_charging", "24h_access"]',
    true,
    '["https://images.unsplash.com/photo-1621929747188-0b4dc28498d6?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=400&h=300&fit=crop"]',
    4.88, 71
  );
