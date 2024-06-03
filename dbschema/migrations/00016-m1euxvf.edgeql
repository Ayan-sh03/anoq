CREATE MIGRATION m1euxvfreuwo6ye3g3ghvjqudnti6x53m3lonz32p7n6cvhnmpnbna
    ONTO m1p24nvtgwfougf3hoectkrb55tpfq2kchuync2zibw5uuwpq5yz7a
{
  ALTER TYPE default::Form {
      CREATE REQUIRED PROPERTY status: std::str {
          SET default := 'open';
          CREATE CONSTRAINT std::one_of('open', 'closed');
      };
  };
};
