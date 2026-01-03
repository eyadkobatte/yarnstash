-- Add user_id column to yarns table
ALTER TABLE yarns ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add user_id column to projects table
ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view yarns" ON yarns;
DROP POLICY IF EXISTS "Anyone can insert yarns" ON yarns;
DROP POLICY IF EXISTS "Anyone can update yarns" ON yarns;
DROP POLICY IF EXISTS "Anyone can delete yarns" ON yarns;

DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Anyone can insert projects" ON projects;
DROP POLICY IF EXISTS "Anyone can update projects" ON projects;
DROP POLICY IF EXISTS "Anyone can delete projects" ON projects;

DROP POLICY IF EXISTS "Anyone can view project_yarns" ON project_yarns;
DROP POLICY IF EXISTS "Anyone can insert project_yarns" ON project_yarns;
DROP POLICY IF EXISTS "Anyone can update project_yarns" ON project_yarns;
DROP POLICY IF EXISTS "Anyone can delete project_yarns" ON project_yarns;

-- Create RLS policies for yarns table
CREATE POLICY "Users can view their own yarns" ON yarns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own yarns" ON yarns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own yarns" ON yarns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own yarns" ON yarns
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for projects table
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for project_yarns table
-- Users can only access project_yarns if they own the associated project
CREATE POLICY "Users can view their own project_yarns" ON project_yarns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_yarns.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own project_yarns" ON project_yarns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_yarns.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own project_yarns" ON project_yarns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_yarns.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own project_yarns" ON project_yarns
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_yarns.project_id
      AND projects.user_id = auth.uid()
    )
  );
