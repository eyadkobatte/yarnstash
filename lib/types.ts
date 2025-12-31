export interface Yarn {
  id: string
  name: string
  color: string
  count: number
  color_number?: string | null
  lot_number?: string | null
  notes?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description?: string | null
  created_at: string
  updated_at: string
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
