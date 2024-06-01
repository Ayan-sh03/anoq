CREATE MIGRATION m15ejff2dzh5g7kthpqz5ukobdtibtdnsj5dcumhp2dtkjmhhly3kq
    ONTO m1bvw7e3wno366us22efrqfugvzv3airv5xkv7cvsig5muefqhfjdq
{
  ALTER TYPE default::User DROP EXTENDING ext::auth::Identity;
  ALTER TYPE default::Form {
      ALTER LINK author {
          RESET OPTIONALITY;
      };
  };
};
