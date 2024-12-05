import { APIGatewayProxyEvent } from "aws-lambda";
import {
  createSensorData,
  deleteSensorData,
  getSensorData,
  updateSensorData,
} from "../handlers/sensorHandler";
import { response } from "../utils/response";

export const lambdaHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const id = event.pathParameters?.id;

    switch (event.httpMethod) {
      case "GET":
        return await getSensorData(id);
      case "POST":
        return await createSensorData(event.body);
      case "PUT":
        return await updateSensorData(id, event.body);
      case "DELETE":
        return await deleteSensorData(id);
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ message: "Method Not Allowed" }),
        };
    }
  } catch (error: any) {
    console.error(error);
    return response(500, error.message);
  }
};
