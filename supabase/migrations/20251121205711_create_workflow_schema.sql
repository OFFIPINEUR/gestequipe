/*
  # Création du schéma WorkFlow

  1. Nouvelles Tables
    - `users`
      - `id` (uuid, primary key) - ID utilisateur (lié à auth.users)
      - `name` (text) - Nom complet de l'utilisateur
      - `email` (text, unique) - Email professionnel
      - `role` (text) - Rôle: Super_Admin, Admin, ou Employe
      - `department` (text, nullable) - Département: Marketing, Finance, ou Technique
      - `active` (boolean) - Statut actif/inactif
      - `created_at` (timestamptz) - Date de création
      
    - `tasks`
      - `id` (uuid, primary key) - ID de la tâche
      - `title` (text) - Titre de la tâche
      - `description` (text) - Description détaillée
      - `status` (text) - Statut: A_faire, En_cours, ou Termine
      - `priority` (text) - Priorité: Normale, Haute, ou Critique
      - `assigned_to_id` (uuid) - ID de l'utilisateur assigné
      - `creator_id` (uuid) - ID du créateur
      - `department` (text) - Département concerné
      - `deadline` (date) - Date limite
      - `report` (text, nullable) - Rapport de complétion
      - `attachment` (text, nullable) - Nom du fichier joint
      - `comments` (jsonb) - Liste des commentaires
      - `subtasks` (jsonb) - Liste des sous-tâches
      - `created_at` (timestamptz) - Date de création
      
    - `requests`
      - `id` (uuid, primary key) - ID de la demande
      - `title` (text) - Titre de la demande
      - `type` (text) - Type: Support, Conges, ou Materiel
      - `details` (text) - Détails de la demande
      - `status` (text) - Statut: En_attente, Approuve, ou Rejete
      - `submitter_id` (uuid) - ID du demandeur
      - `department` (text) - Département
      - `observations` (text, nullable) - Observations de l'admin
      - `assigned_to_id` (uuid, nullable) - ID de réassignation
      - `created_at` (timestamptz) - Date de création
      
  2. Sécurité
    - Activer RLS sur toutes les tables
    - Politiques pour chaque rôle (Super_Admin, Admin, Employe)
    - Les admins ne voient que leur département
    - Les employés ne voient que leurs propres tâches et demandes
*/

-- Table users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('Super_Admin', 'Admin', 'Employe')),
  department text CHECK (department IN ('Marketing', 'Finance', 'Technique') OR department IS NULL),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super_Admin'
      AND users.active = true
    )
  );

CREATE POLICY "Admins can read users in their department"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin
      WHERE admin.id = auth.uid()
      AND admin.role = 'Admin'
      AND admin.active = true
      AND admin.department = users.department
    )
  );

CREATE POLICY "Super admins can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super_Admin'
      AND users.active = true
    )
  );

CREATE POLICY "Super admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super_Admin'
      AND users.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super_Admin'
      AND users.active = true
    )
  );

-- Table tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'A_faire' CHECK (status IN ('A_faire', 'En_cours', 'Termine')),
  priority text NOT NULL DEFAULT 'Normale' CHECK (priority IN ('Normale', 'Haute', 'Critique')),
  assigned_to_id uuid REFERENCES users(id) ON DELETE SET NULL,
  creator_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department text NOT NULL CHECK (department IN ('Marketing', 'Finance', 'Technique')),
  deadline date NOT NULL,
  report text,
  attachment text,
  comments jsonb DEFAULT '[]'::jsonb,
  subtasks jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read tasks assigned to them"
  ON tasks FOR SELECT
  TO authenticated
  USING (assigned_to_id = auth.uid());

CREATE POLICY "Admins can read tasks in their department"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Admin', 'Super_Admin')
      AND users.active = true
      AND (users.department = tasks.department OR users.role = 'Super_Admin')
    )
  );

CREATE POLICY "Admins can insert tasks in their department"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Admin'
      AND users.active = true
      AND users.department = department
    )
  );

CREATE POLICY "Admins can update tasks in their department"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Admin'
      AND users.active = true
      AND users.department = tasks.department
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Admin'
      AND users.active = true
      AND users.department = tasks.department
    )
  );

CREATE POLICY "Assigned users can update their tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (assigned_to_id = auth.uid())
  WITH CHECK (assigned_to_id = auth.uid());

CREATE POLICY "Admins can delete tasks in their department"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Admin'
      AND users.active = true
      AND users.department = tasks.department
    )
  );

-- Table requests
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('Support', 'Conges', 'Materiel')),
  details text DEFAULT '',
  status text NOT NULL DEFAULT 'En_attente' CHECK (status IN ('En_attente', 'Approuve', 'Rejete')),
  submitter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department text NOT NULL CHECK (department IN ('Marketing', 'Finance', 'Technique')),
  observations text,
  assigned_to_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own requests"
  ON requests FOR SELECT
  TO authenticated
  USING (submitter_id = auth.uid());

CREATE POLICY "Admins can read requests in their department"
  ON requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Admin', 'Super_Admin')
      AND users.active = true
      AND (users.department = requests.department OR users.role = 'Super_Admin')
    )
  );

CREATE POLICY "Users can insert their own requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (submitter_id = auth.uid());

CREATE POLICY "Admins can update requests in their department"
  ON requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Admin'
      AND users.active = true
      AND users.department = requests.department
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Admin'
      AND users.active = true
      AND users.department = requests.department
    )
  );

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON tasks(department);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_requests_submitter ON requests(submitter_id);
CREATE INDEX IF NOT EXISTS idx_requests_department ON requests(department);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);