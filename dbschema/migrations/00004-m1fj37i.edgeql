CREATE MIGRATION m1fj37isorq6pja5mijq75wvg4hahjf4uvx4dtfyhi56mjl7s5dewa
    ONTO m1yg6xmspjhk7cwshjiikrnao7opehkxea235l4vrxfagav4jqwh4a
{
  ALTER TYPE default::Form {
      CREATE PROPERTY modified_at: std::datetime {
          SET REQUIRED USING (<std::datetime>{});
      };
      EXTENDING ext::auth::Auditable LAST;
  };
  ALTER TYPE default::Form {
      ALTER PROPERTY modified_at {
          RESET OPTIONALITY;
          DROP OWNED;
          RESET TYPE;
      };
  };
};
