CREATE MIGRATION m17f4fmvelnh76wa262fv2oab4bklxggbzaodpfmopq6uuyavbu7ka
    ONTO m1arc5x2tfoouqxozlf5bvs6cdqxu64ye4otyday3cmc5szvmdulbq
{
  ALTER TYPE default::User {
      CREATE PROPERTY given_name: std::str;
  };
  ALTER TYPE default::User {
      ALTER PROPERTY name {
          RENAME TO family_name;
      };
  };
};
