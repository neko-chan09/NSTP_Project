// resources/js/types/api.ts

// ============ CLASS TYPES ============
export interface ClassGroup {
  id: number;
  teacher_id: number;
  teacher?: User;
  name: string;
  description?: string;
  component_type: 'cwts' | 'rotc' | 'lts' | 'all';
  class_code?: string | null;
  school_year?: string | null;
  academic_year_id?: number | null;
  academic_year?: {
    id: number;
    academic_year: string;
    semester: string;
  } | null;
  status: 'active' | 'archived';
  students_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateClassRequest {
  name: string;
  description?: string;
  component_type: 'cwts' | 'rotc' | 'lts' | 'all';
  teacher_id?: number;
  class_code?: string;
  school_year?: string;
}

export interface UpdateClassRequest {
  name?: string;
  description?: string;
  component_type?: 'cwts' | 'rotc' | 'lts' | 'all';
  status?: 'active' | 'archived';
  teacher_id?: number;
  class_code?: string;
  school_year?: string;
}

export interface ClassStudent {
  id: number;
  class_id: number;
  student_id: number;
  student?: Student;
  joined_at: string;
  status: 'active' | 'removed';
}

// ============ AUTH TYPES ============
export interface User {
  id: number;
  name?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email: string;
  student_id?: string;
  role: 'super_admin' | 'admin' | 'faculty' | 'student';
  nstp_component?: 'cwts' | 'rotc' | 'lts';
  course?: string;
  year_level?: number;
  section?: string;
  contact_number?: string;
  profile_photo?: string;
  profile_photo_url?: string;
  initials?: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface LoginResponse {
  access_token?: string;
  token?: string;
  token_type?: string;
  user: User;
}

export interface OtpResponse {
  message: string;
}

export interface PasswordResetResponse {
  message: string;
}

// ============ DASHBOARD TYPES ============
export interface DashboardStats {
  total_students: number;
  eligible: number;
  not_eligible: number;
  pending_students: number;
  in_progress_students: number;
  completed_students: number;
  deficient_students: number;
  cwts: number;
  rotc: number;
  lts: number;
  unassigned: number;
  male_students: number;
  female_students: number;
  total_hours: number;
  total_required_hours: number;
  completion_rate: number;
  total_documents: number;
  pending_documents: number;
  approved_documents: number;
  rejected_documents: number;
  today_attendance: Array<{
    student: string;
    student_id: string;
    time: string;
    hours: number;
    status: 'present' | 'late' | 'absent';
  }>;
  today_checkins: number;
  active_sessions: number;
  total_sessions: number;
  recent_activities: Array<{
    student: string;
    activity: string;
    status: string;
    time: string;
  }>;
}

export interface DocumentResponse {
  data: Document[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

export interface OfficeDocument {
  id: number;
  title: string;
  description?: string;
  category?: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  is_public: boolean;
  target_audience: 'all' | 'faculty' | 'admin' | 'students';
  uploaded_by: number;
  uploader?: User;
  download_count?: number;
  extracted_text?: string;
  ocr_processed?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAttendanceSessionRequest {
  component?: 'cwts' | 'rotc' | 'lts';
  course?: string;
  section?: string;
  end_time?: string;
  description?: string;
}

export interface GenerateCertificateRequest {
  student_id: number;
  certificate_type: 'completion' | 'participation' | 'training';
  description?: string;
}

export interface BatchGenerateCertificateRequest {
  student_ids: number[];
  certificate_type: 'completion' | 'participation' | 'training';
}

// ============ BULLETIN TYPES ============
export interface BulletinPost {
  liked?: boolean; following?: boolean; likes_count?: number; comments_count?: number;
  id: number;
  title: string;
  content: string;
  category: string;
  target_audience: 'all' | 'students' | 'faculty' | 'cwts' | 'rotc' | 'lts';
  display_from: string;
  display_until: string | null;
  is_featured: boolean;
  views: number;
  created_by: number;
  author?: User;
  created_at: string;
  updated_at: string;
}

export interface CreateBulletinRequest {
  title: string;
  content: string;
  category?: string;
  target_audience?: 'all' | 'students' | 'faculty' | 'cwts' | 'rotc' | 'lts';
  display_from: string;
  display_until?: string;
  is_featured?: boolean;
}

export interface BulletinComment {
  id: number;
  post_id: number;
  user_id: number;
  user: User;
  content: string;
  created_at: string;
}

// ============ REPORT TYPES ============
export interface EnrollmentReport {
  total: number;
  total_male: number;
  total_female: number;
  total_unspecified: number;
  cwts: number;
  cwts_male: number;
  cwts_female: number;
  rotc: number;
  rotc_male: number;
  rotc_female: number;
  lts: number;
  lts_male: number;
  lts_female: number;
}

export interface DeficiencyReport {
  total_deficient: number;
  students: {
    id: number;
    student_id: string;
    name: string;
    course: string;
    year_level: number;
    component: string;
    missing_hours: number;
    missing_documents: string[];
  }[];
}

export interface AttendanceReport {
  total_sessions: number;
  total_checkins: number;
  present: number;
  late: number;
  details: {
    date: string;
    total: number;
    present: number;
    late: number;
    absent: number;
    rate: number;
  }[];
}

// ============ SETTINGS TYPES ============
export interface SystemSettings {
  academic_year?: string;
  school_year?: string;
  current_semester?: '1st' | '2nd' | 'summer';
  required_hours?: number;
  latitude?: number;
  longitude?: number;
  geofence_radius?: number;
  face_threshold?: number;
  [key: string]: any;
}

// ============ API RESPONSE WRAPPER ============
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

// ============ COMPONENT CHANGE REQUEST ============
export interface ComponentChangeRequest {
  id: number;
  student_id: number;
  student?: Student;
  from_component: 'cwts' | 'rotc' | 'lts';
  to_component: 'cwts' | 'rotc' | 'lts';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  admin_remarks?: string;
  approved_by?: number;
  approver?: User;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityRegistration {
  id: number;
  activity_id: number;
  student_id: number;
  registration_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'waitlisted';
  cancellation_reason?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

// ============ ACADEMIC YEAR ============
export interface AcademicYear {
  id: number;
  academic_year: string;
  semester: '1st' | '2nd' | 'summer';
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningMaterial {
  id: number;
  class_id: number;
  title: string;
  description?: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  topic?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// ============ NOTIFICATION TYPES ============
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  data?: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

// ============ OCR TYPES ============
export interface OCRText {
  id: number;
  document_id: number;
  extracted_text: string;
  confidence: number;
  file_name: string;
  file_path: string;
  document_type: 'student' | 'office';
  processed_at: string;
  created_at: string;
  updated_at: string;
}

// ============ TRAINING HOURS TYPES ============
export interface TrainingHoursLog {
  id: number;
  student_id: number;
  student?: Student;
  activity_id?: number;
  activity?: Activity;
  hours_earned: number;
  date_logged: string;
  description?: string;
  type: 'activity' | 'training' | 'community_service';
  verified_by?: number;
  verifier?: User;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

// ============ ELIGIBILITY TYPES ============
export interface EligibilityMonitoring {
  id: number;
  student_id: number;
  student?: Student;
  hours_requirement_met: boolean;
  documents_requirement_met: boolean;
  activities_requirement_met: boolean;
  overall_eligible: boolean;
  eligibility_date?: string;
  notes?: string;
  checked_by?: number;
  checked_at?: string;
  created_at: string;
  updated_at: string;
}

// ============ GRADUATION BATCH TYPES ============
export interface GraduationBatch {
  id: number;
  batch_name: string;
  academic_year: string;
  semester: '1st' | '2nd' | 'summer';
  graduation_date: string;
  venue?: string;
  total_students: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  created_at: string;
  updated_at: string;
}

// ============ REPORT TYPES ============
export interface Report {
  id: number;
  report_name: string;
  report_type: 'compliance' | 'deficiency' | 'certificate' | 'attendance' | 'summary';
  filters?: any;
  file_path?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  generated_by: number;
  generated_at?: string;
  created_at: string;
  updated_at: string;
}

// ============ STUDENT TYPES ============
export interface Student {
  id: number;
  user_id: number;
  user: User;
  student_id: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  course?: string;
  year_level?: number;
  section?: string;
  nstp_component_selected?: 'cwts' | 'rotc' | 'lts' | null;
  total_training_hours: number;
  completed_training_hours: number;
  is_eligible_for_completion: boolean;
  completion_status: 'pending' | 'in_progress' | 'completed' | 'deficient';
  completed_at?: string;
  created_at: string;
  updated_at: string;
  face_embedding?: string;
  documents?: Document[];
  certificates?: Certificate[];
  activityParticipations?: ActivityParticipation[];
  attendance_logs?: AttendanceLog[];
  documents_count?: number;
  certificates_count?: number;
  activities_attended?: number;
  completion_percentage?: number;
}

export interface StudentResponse {
  data: Student[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
}

// ============ DOCUMENT TYPES ============
export interface Document {
  id: number;
  student_id: number;
  student?: Student;
  document_type: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  extracted_text?: string;
  ocr_processed: boolean;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  verified_by?: number;
  verifier?: User;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

// ============ CERTIFICATE TYPES ============
export interface Certificate {
  id: number;
  student_id: number;
  student?: Student;
  certificate_number: string;
  certificate_type: 'completion' | 'participation' | 'training';
  activity_id?: number;
  file_path: string;
  qr_code_path?: string;
  description?: string;
  status: 'draft' | 'issued' | 'revoked';
  issued_by: number;
  issuer?: User;
  issued_at?: string;
  created_at: string;
  updated_at: string;
}

// ============ ATTENDANCE LOG TYPES ============
export interface AttendanceLog {
  id: number;
  session_id: number;
  session?: AttendanceSession;
  student_id: number;
  student?: Student;
  check_in_at: string;
  status: 'present' | 'late' | 'absent';
  location?: {
    latitude: number;
    longitude: number;
  };
  remarks?: string;
  created_at: string;
  updated_at: string;
}

// ============ ACTIVITY PARTICIPATION TYPES ============
export interface ActivityParticipation {
  id: number;
  activity_id: number;
  activity?: Activity;
  student_id: number;
  student?: Student;
  attendance_status: 'registered' | 'present' | 'absent' | 'excused';
  hours_earned?: number;
  attended_at?: string;
  check_in_at?: string;
  face_image_path?: string;
  latitude?: number;
  longitude?: number;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSession {
  id: number;
  faculty_id: number;
  faculty?: User;
  class_id?: number;
  class?: ClassGroup;
  component?: 'cwts' | 'rotc' | 'lts';
  course?: string;
  section?: string;
  start_time: string;
  end_time?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  grace_period_minutes?: number;
  is_scheduled?: boolean;
  status: 'active' | 'closed';
  description?: string;
  require_location?: boolean;
  latitude?: number;
  longitude?: number;
  geofence_radius?: number;
  created_at: string;
  updated_at: string;
  logs_count?: number;
  logs?: AttendanceLog[];
}

// ============ ACTIVITY TYPES ============
export interface Activity {
  id: number;
  title: string;
  description: string;
  component_type: 'cwts' | 'rotc' | 'lts' | 'all';
  start_datetime: string;
  end_datetime: string;
  venue?: string;
  latitude?: number | null;
  longitude?: number | null;
  geofence_radius?: number;
  training_hours: number;
  max_participants?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_by: number;
  creator?: User;
  created_at: string;
  updated_at: string;
  participants_count?: number;
  is_registered?: boolean;
}

// ============ BACKUP SCHEDULE TYPES ============
export interface BackupSchedule {
  id: number;
  name: string;
  notes?: string | null;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  frequency_label?: string;
  time: string;
  day_of_week?: number | null;
  day_of_month?: number | null;
  cron_expression?: string | null;
  retention_days?: number | null;
  is_active: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_by?: number | null;
  creator_name?: string;
  backups_count?: number;
  created_at: string;
  updated_at: string;
}