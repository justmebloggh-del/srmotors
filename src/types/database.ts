// Hand-written to match supabase/migrations/*.sql while the local stack
// finishes provisioning. Once `supabase start` is healthy, regenerate the
// authoritative version with:
//   npm run db:types
// and diff against this file before committing.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AdminRole = "superadmin" | "admin" | "editor";
export type MediaType = "image" | "video";
export type VehicleStatus = "draft" | "available" | "reserved" | "sold" | "archived";
export type VehicleCondition = "new" | "used" | "certified_pre_owned";
export type DrivetrainType = "fwd" | "rwd" | "awd" | "four_wd";
export type SteeringSide = "lhd" | "rhd";
export type MileageUnitDb = "km" | "miles";
export type ShippingMethod = "ro_ro" | "container_shared" | "container_exclusive" | "air";
export type EstimateStatus = "unavailable" | "preliminary" | "reviewed" | "expired";
export type EnquiryStatus = "new" | "contacted" | "negotiating" | "converted" | "closed";
export type ContactMethod = "whatsapp" | "email" | "phone";
export type EnquirySource = "vehicle_page" | "contact_page" | "calculator" | "other";

interface Relationship {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
}

interface Table<Row, Rel extends readonly Relationship[] = []> {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: Rel;
}

export interface Database {
  public: {
    Tables: {
      admin_profiles: Table<{
        id: string;
        full_name: string | null;
        role: AdminRole;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      }>;
      brands: Table<
        {
          id: string;
          name: string;
          slug: string;
          logo_media_id: string | null;
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        },
        [
          {
            foreignKeyName: "brands_logo_media_fk";
            columns: ["logo_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ]
      >;
      vehicle_models: Table<
        {
          id: string;
          brand_id: string;
          name: string;
          slug: string;
          archived_at: string | null;
          created_at: string;
        },
        [
          {
            foreignKeyName: "vehicle_models_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
        ]
      >;
      body_types: Table<{ id: string; name: string; slug: string; archived_at: string | null }>;
      fuel_types: Table<{ id: string; name: string; slug: string; archived_at: string | null }>;
      transmission_types: Table<{
        id: string;
        name: string;
        slug: string;
        archived_at: string | null;
      }>;
      media: Table<{
        id: string;
        type: MediaType;
        storage_path: string;
        mime_type: string | null;
        filesize_bytes: number | null;
        width: number | null;
        height: number | null;
        alt_text: string | null;
        caption: string | null;
        original_filename: string | null;
        created_by: string | null;
        created_at: string;
        updated_at: string;
      }>;
      vehicles: Table<
        {
          id: string;
          slug: string;
          brand_id: string;
          model_id: string | null;
          model_name_override: string | null;
          trim: string | null;
          year: number;
          mileage_value: number | null;
          mileage_unit: MileageUnitDb;
          mileage_km: number | null;
          fuel_type_id: string | null;
          transmission_id: string | null;
          engine_capacity_cc: number | null;
          body_type_id: string | null;
          drivetrain: DrivetrainType | null;
          steering: SteeringSide | null;
          condition: VehicleCondition;
          source_country: string | null;
          location: string | null;
          cbm: number | null;
          fob_amount: number;
          fob_currency: string;
          price_notes: string | null;
          status: VehicleStatus;
          featured: boolean;
          description: string | null;
          condition_notes: string | null;
          main_media_id: string | null;
          seo_title: string | null;
          seo_description: string | null;
          published_at: string | null;
          archived_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        },
        [
          {
            foreignKeyName: "vehicles_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "vehicle_models";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_fuel_type_id_fkey";
            columns: ["fuel_type_id"];
            isOneToOne: false;
            referencedRelation: "fuel_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_transmission_id_fkey";
            columns: ["transmission_id"];
            isOneToOne: false;
            referencedRelation: "transmission_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_body_type_id_fkey";
            columns: ["body_type_id"];
            isOneToOne: false;
            referencedRelation: "body_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicles_main_media_id_fkey";
            columns: ["main_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ]
      >;
      vehicle_media: Table<
        {
          id: string;
          vehicle_id: string;
          media_id: string;
          position: number;
          created_at: string;
        },
        [
          {
            foreignKeyName: "vehicle_media_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vehicle_media_media_id_fkey";
            columns: ["media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ]
      >;
      shipping_rates: Table<
        {
          id: string;
          body_type_id: string | null;
          method: ShippingMethod;
          min_cbm: number | null;
          max_cbm: number | null;
          origin_port: string;
          destination_port: string;
          rate_amount: number;
          rate_currency: string;
          effective_from: string;
          effective_to: string | null;
          notes: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        },
        [
          {
            foreignKeyName: "shipping_rates_body_type_id_fkey";
            columns: ["body_type_id"];
            isOneToOne: false;
            referencedRelation: "body_types";
            referencedColumns: ["id"];
          },
        ]
      >;
      currency_rates: Table<{
        id: string;
        base_currency: string;
        quote_currency: string;
        rate: number;
        source: string;
        as_of: string;
        created_by: string | null;
        created_at: string;
      }>;
      vehicle_cost_estimates: Table<{
        id: string;
        vehicle_id: string;
        status: EstimateStatus;
        shipping_rate_id: string | null;
        shipping_amount: number | null;
        shipping_currency: string | null;
        customs_duty_amount: number | null;
        customs_currency: string | null;
        customs_method: string | null;
        port_charges_amount: number | null;
        clearing_fees_amount: number | null;
        local_transport_amount: number | null;
        other_charges_amount: number | null;
        other_charges_description: string | null;
        assumptions: string | null;
        notes: string | null;
        calculated_at: string;
        review_due_at: string | null;
        created_by: string | null;
        updated_by: string | null;
        created_at: string;
        updated_at: string;
      }>;
      enquiries: Table<
        {
          id: string;
          vehicle_id: string | null;
          name: string;
          email: string | null;
          phone: string | null;
          preferred_contact_method: ContactMethod;
          message: string;
          source: EnquirySource;
          estimate_reference: string | null;
          cost_estimate_snapshot: Json | null;
          status: EnquiryStatus;
          assigned_to: string | null;
          follow_up_date: string | null;
          honeypot: string | null;
          submitted_ip: string | null;
          alert_sent_at: string | null;
          alert_error: string | null;
          created_at: string;
          updated_at: string;
        },
        [
          {
            foreignKeyName: "enquiries_vehicle_id_fkey";
            columns: ["vehicle_id"];
            isOneToOne: false;
            referencedRelation: "vehicles";
            referencedColumns: ["id"];
          },
        ]
      >;
      enquiry_notes: Table<
        {
          id: string;
          enquiry_id: string;
          author_id: string | null;
          note: string;
          created_at: string;
        },
        [
          {
            foreignKeyName: "enquiry_notes_enquiry_id_fkey";
            columns: ["enquiry_id"];
            isOneToOne: false;
            referencedRelation: "enquiries";
            referencedColumns: ["id"];
          },
        ]
      >;
      content_blocks: Table<{
        key: string;
        title: string | null;
        body: string | null;
        data: Json;
        seo_title: string | null;
        seo_description: string | null;
        published: boolean;
        updated_by: string | null;
        updated_at: string;
      }>;
      faqs: Table<{
        id: string;
        question: string;
        answer: string;
        position: number;
        published: boolean;
        created_at: string;
        updated_at: string;
      }>;
      blog_posts: Table<
        {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          content: string;
          cover_media_id: string | null;
          author_name: string | null;
          seo_title: string | null;
          seo_description: string | null;
          published: boolean;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        },
        [
          {
            foreignKeyName: "blog_posts_cover_media_id_fkey";
            columns: ["cover_media_id"];
            isOneToOne: false;
            referencedRelation: "media";
            referencedColumns: ["id"];
          },
        ]
      >;
      audit_log: Table<{
        id: string;
        actor_id: string | null;
        actor_email: string | null;
        action: string;
        entity_type: string;
        entity_id: string | null;
        metadata: Json;
        created_at: string;
      }>;
    };
    Views: {
      vehicle_latest_estimate: {
        Row: {
          id: string;
          vehicle_id: string;
          status: EstimateStatus;
          shipping_rate_id: string | null;
          shipping_amount: number | null;
          shipping_currency: string | null;
          customs_duty_amount: number | null;
          customs_currency: string | null;
          customs_method: string | null;
          port_charges_amount: number | null;
          clearing_fees_amount: number | null;
          local_transport_amount: number | null;
          other_charges_amount: number | null;
          other_charges_description: string | null;
          assumptions: string | null;
          notes: string | null;
          calculated_at: string;
          review_due_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
}
