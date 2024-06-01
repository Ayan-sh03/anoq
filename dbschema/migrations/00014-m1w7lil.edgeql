CREATE MIGRATION m1w7lilutumqlqvot2tpckmrlvwrhoonsw3jop65qht4lapuc5oqsa
    ONTO m1pgm7bmcj4rfdqpyxkdatcrcgf2e53u3g7ghcgg4xiharpjtctgsa
{
  ALTER TYPE default::Filled_Form {
      CREATE PROPERTY email: std::str {
          CREATE CONSTRAINT std::exclusive;
      };
      CREATE PROPERTY name: std::str;
  };
};
