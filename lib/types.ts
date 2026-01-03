export interface YarnImage {
  id: string
  yarn_id: string
  storage_path: string
  created_at: string
}

export interface Yarn {
  id: string
  name: string
  colorway: string
  count: number
  lot_number?: string | null
  notes?: string | null
  is_active: boolean
  ravelry_id?: number | null
  created_at: string
  updated_at: string
  images?: YarnImage[]
}

export interface ProjectImage {
  id: string
  project_id: string
  storage_path: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
  images?: ProjectImage[]
}

export interface ProjectYarn {
  id: string
  project_id: string
  yarn_id: string
  quantity_needed: number
  created_at: string
}

export interface ProjectWithYarns extends Project {
  project_yarns: (ProjectYarn & {
    yarns: Yarn
  })[]
}
