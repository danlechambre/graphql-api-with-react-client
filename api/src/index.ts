import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { GraphQLScalarType } from "graphql";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { parse } from "csv-parse/sync";
import lodash from "lodash";
import { parse as parseDate, isValid, parseISO } from "date-fns";

// Accepted workaround to reintroduce __dirname with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const typeDefs = `#graphql
  scalar Date

  type EnergyConsumptionDataPoint {
    timestamp: Date
    consumption: Float
  }

  type WeatherDataPoint {
    date: Date
    averageTemperature: Float
    averageHumidity: Float
  }

  type Query {
    energyData: [EnergyConsumptionDataPoint]
    energyDataAnomalies: [EnergyConsumptionDataPoint]
    weatherData: [WeatherDataPoint]
  }
`;

const dateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Date custom scalar type",
  serialize(value: any) {
    const date = parseISO(value);

    if (isValid(date)) {
      return new Date(`${value}`).getTime();
    } else {
      const parsedDate = parseDate(value, "dd/MM/yyyy HH:mm", new Date());
      return new Date(`${parsedDate}`).getTime();
    }
  },
});

async function parseCSVData(path: string) {
  const csvContent = await fs.readFile(resolve(__dirname, path));
  const parsed = parse(csvContent, { columns: true });
  const parsedToCamelCase = parsed.map((x: any) =>
    lodash.mapKeys(x, (v, k) => lodash.camelCase(k))
  );
  return parsedToCamelCase;
}

const resolvers = {
  Date: dateScalar,
  Query: {
    energyData: () => parseCSVData("../data/HalfHourlyEnergyData.csv"),
    energyDataAnomalies: () =>
      parseCSVData("../data/HalfHourlyEnergyDataAnomalies.csv"),
    weatherData: () => parseCSVData("../data/Weather.csv"),
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, { listen: { port: 4000 } });

console.log(`🤘 Server ready at: ${url}`);
