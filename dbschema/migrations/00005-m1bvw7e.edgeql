CREATE MIGRATION m1bvw7e3wno366us22efrqfugvzv3airv5xkv7cvsig5muefqhfjdq
    ONTO m1fj37isorq6pja5mijq75wvg4hahjf4uvx4dtfyhi56mjl7s5dewa
{
  ALTER TYPE default::User {
      CREATE REQUIRED LINK identity: ext::auth::Identity {
          SET REQUIRED USING (<ext::auth::Identity>{});
      };
  };
  CREATE GLOBAL default::current_user := (std::assert_single((SELECT
      default::User {
          id,
          email
      }
  FILTER
      (.identity = GLOBAL ext::auth::ClientTokenIdentity)
  )));
};
