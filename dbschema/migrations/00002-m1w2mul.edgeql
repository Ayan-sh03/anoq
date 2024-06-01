CREATE MIGRATION m1w2mulbiqgs4rc52gdudndzijmwsrmq6wvct33ya76po22sbjo6xq
    ONTO m1jbkm4y44e6nhehi3rzza5kfylv3ymj4iy6vx6fftwae3pj5523fq
{
  CREATE EXTENSION pgcrypto VERSION '1.3';
  CREATE EXTENSION auth VERSION '1.0';
  ALTER TYPE default::BlogPost RENAME TO default::Form;
  CREATE ABSTRACT TYPE default::Question {
      CREATE MULTI PROPERTY answer: std::str;
      CREATE REQUIRED PROPERTY question_text: std::str;
  };
  ALTER TYPE default::Form {
      CREATE MULTI LINK question: default::Question;
  };
  ALTER TYPE default::Form {
      ALTER PROPERTY content {
          RENAME TO description;
      };
  };
  CREATE TYPE default::MultipleChoiceQuestion EXTENDING default::Question {
      CREATE MULTI PROPERTY choices: std::str;
      CREATE PROPERTY selectedChoice: std::str;
  };
  CREATE TYPE default::User EXTENDING ext::auth::Identity {
      CREATE REQUIRED PROPERTY email: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
  };
};
