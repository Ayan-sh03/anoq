CREATE MIGRATION m1g5logk46xa5afz3cov2hzdszrwqfwvhf7hcp4wh4u7i4trwtvbna
    ONTO m1eq6wyqz34ylbp2zya55lot5te72uc5tocmp4g5lvh3wzped7r4za
{
  ALTER TYPE default::Form {
      CREATE MULTI LINK choiceQuestion: default::MultipleChoiceQuestion;
  };
  ALTER TYPE default::Question {
      ALTER PROPERTY answer {
          RESET CARDINALITY USING (SELECT
              .answer 
          LIMIT
              1
          );
      };
  };
  ALTER TYPE default::MultipleChoiceQuestion {
      ALTER PROPERTY selectedChoice {
          SET MULTI;
      };
  };
};
