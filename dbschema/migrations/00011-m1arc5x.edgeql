CREATE MIGRATION m1arc5x2tfoouqxozlf5bvs6cdqxu64ye4otyday3cmc5szvmdulbq
    ONTO m1g7tc2fvs5myl52kubtttzwgtwsinpcjjexttwhbik3lhpdu4bvrq
{
  DROP GLOBAL default::current_user;
  ALTER TYPE default::User {
      DROP LINK identity;
  };
  ALTER TYPE default::User {
      CREATE PROPERTY name: std::str;
  };
  ALTER TYPE default::User {
      CREATE PROPERTY username: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
  };
};
