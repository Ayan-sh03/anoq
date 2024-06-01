CREATE MIGRATION m1lgjz45v5q3qdg2xeqcfut4mcltjs2fixzzhyt4vxf2yjpcw6wpmq
    ONTO m1g5logk46xa5afz3cov2hzdszrwqfwvhf7hcp4wh4u7i4trwtvbna
{
  ALTER TYPE default::Form {
      CREATE REQUIRED PROPERTY slug: std::str {
          SET REQUIRED USING (<std::str>{});
          CREATE CONSTRAINT std::exclusive;
      };
  };
};
