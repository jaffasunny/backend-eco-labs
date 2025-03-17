export interface ISkill extends Document {
  skillType: string;
  skills: string[];
}

export interface ISkillSkill extends Document {
  skillsTitle: string[];
  skillsCategory: string;
}
