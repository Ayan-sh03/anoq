CREATE MIGRATION m1vmzzjh3s2ejgtbp4bicbmo27227gy7vuzpuhrwpfzwrzp5uge3ra
    ONTO m1euxvfreuwo6ye3g3ghvjqudnti6x53m3lonz32p7n6cvhnmpnbna
{
  ALTER TYPE default::Filled_Form {
      ALTER LINK form {
          ON TARGET DELETE DELETE SOURCE;
      };
  };
};
