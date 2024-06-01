CREATE MIGRATION m1g7tc2fvs5myl52kubtttzwgtwsinpcjjexttwhbik3lhpdu4bvrq
    ONTO m1lgjz45v5q3qdg2xeqcfut4mcltjs2fixzzhyt4vxf2yjpcw6wpmq
{
  CREATE TYPE default::Filled_Form EXTENDING ext::auth::Auditable {
      CREATE MULTI LINK choiceQuestion: default::MultipleChoiceQuestion;
      CREATE LINK form: default::Form;
      CREATE MULTI LINK question: default::Question;
  };
};
