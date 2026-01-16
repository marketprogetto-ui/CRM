export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    updated_at: string | null
                }
            }
            pipelines: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    created_at: string
                }
            }
            stages: {
                Row: {
                    id: string
                    pipeline_id: string
                    name: string
                    slug: string
                    position: number
                    probability: number
                    created_at: string
                }
            }
            opportunities: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    amount_estimated: number | null
                    amount_offered: number | null
                    amount_final: number | null
                    stage_id: string
                    pipeline_id: string
                    owner_id: string
                    account_id: string | null
                    contact_id: string | null
                    origin_opportunity_id: string | null
                    briefing: Json | null
                    measurement_data: Json | null
                    priority: 'low' | 'medium' | 'high'
                    source: string | null
                    created_at: string
                    updated_at: string
                    closed_at: string | null
                }
            }
            activities: {
                Row: {
                    id: string
                    opportunity_id: string
                    title: string
                    description: string | null
                    type: string
                    due_at: string
                    done_at: string | null
                    created_by: string
                    created_at: string
                }
            }
            proposals: {
                Row: {
                    id: string
                    opportunity_id: string
                    version: number
                    total_amount: number
                    status: string
                    created_at: string
                }
            }
            proposal_items: {
                Row: {
                    id: string
                    proposal_id: string
                    product_id: string
                    quantity: number
                    unit_price: number
                    total_price: number
                }
            }
            products: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    base_price: number
                }
            }
            opportunity_stage_history: {
                Row: {
                    id: string
                    opportunity_id: string
                    stage_id: string
                    entered_at: string
                    exited_at: string | null
                }
            }
        }
    }
}

export type BriefingData = {
    project_type: string
    rooms_count: number
    openings_count: number
    style_notes: string
    priority_factors: string[]
    automation: {
        required: boolean
        type: string | null
        brand_preference: string | null
        power_point_available: boolean
    }
    budget_range: {
        min: number
        max: number
    }
    products: string[]
    constraints: {
        blackout_needed: boolean
        solar_screen_needed: boolean
        child_safe: boolean
    }
    notes: string
}

export type MeasurementData = {
    visit: {
        measurer_name: string
        visited_at: string
    }
    technical: {
        mount_type_default: string
        ceiling_type: string
        has_obstacles: boolean
        obstacles_notes: string
        power_point_available: boolean
    }
    openings: {
        room: string
        opening_label: string
        width_mm: number
        height_mm: number
        mount_type: string
        product_suggestion: string
        blackout: boolean
        notes: string
        photo_refs: string[]
    }[]
    summary: {
        openings_count_measured: number
        automation_recommended: boolean
    }
}
