export type Experience = {
  id: number;
  experience_type: string;
  content: string;
  created_at: string;
};

export type CreateExperienceInput = {
  experience_type: string;
  content: string;
};

export type SessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export type AppSession = {
  user: SessionUser;
  expires: string;
};

export type ResumeLimitType = 'chars' | 'bytes' | 'none';

export type ResumeQuestion = {
  id: number;
  sort_order: number;
  question_text: string;
  limit_type: ResumeLimitType;
  limit_value: number | null;
  answer_content: string;
};

export type ResumeRecord = {
  id: number;
  company_name: string | null;
  application_start_date: string | null;
  application_end_date: string | null;
  job_field: string | null;
  created_at: string;
  updated_at: string;
  questions: ResumeQuestion[];
};

export type ResumePayloadQuestion = {
  id?: number;
  question_text: string;
  limit_type: ResumeLimitType;
  limit_value: number | null;
  answer_content: string;
};

export type ResumePayload = {
  company_name: string;
  application_start_date: string;
  application_end_date: string;
  job_field: string;
  questions: ResumePayloadQuestion[];
};
