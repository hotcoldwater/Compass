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
