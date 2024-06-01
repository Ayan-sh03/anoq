CREATE MIGRATION m1yg6xmspjhk7cwshjiikrnao7opehkxea235l4vrxfagav4jqwh4a
    ONTO m1w2mulbiqgs4rc52gdudndzijmwsrmq6wvct33ya76po22sbjo6xq
{
  ALTER TYPE default::Form {
      CREATE REQUIRED LINK author: default::User {
          SET REQUIRED USING (<default::User>{});
      };
  };
};
