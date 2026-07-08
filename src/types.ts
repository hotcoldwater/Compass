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
