import { DynamoDB, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { response } from "../utils/response";

interface SensorData {
  id: string;
  temperature: number;
  humidity: number;
  receiveAt?: string;
}

const dynamodb = new DynamoDB({});
const TABLE_NAME = process.env.TABLE_NAME || "SensorDataTable";

/*
 * Utility function to parse the request body
 */
const parseRequestBody = (body: string | null): SensorData | null => {
  if (!body) return null;
  try {
    return JSON.parse(body) as SensorData;
  } catch {
    return null;
  }
};

/*
 * Create a new sensor data
 */
export const createSensorData = async (body: string | null) => {
  const sensorData = parseRequestBody(body);
  if (!sensorData) return response(400, "Invalid or missing body");

  const { temperature, humidity } = sensorData;
  if (!temperature || !humidity) {
    return response(400, "Missing required fields");
  }

  const putCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      id: randomUUID(),
      temperature,
      humidity,
      timestamp: Date.now(),
    },
  });

  try {
    await dynamodb.send(putCommand);
    return response(200, "Sensor data created successfully");
  } catch (error) {
    console.log("Error creating sensor data:", error);
    return response(500, "Error creating sensor data");
  }
};

/*
 * Get all sensor data
 */
export const getSensorData = async (id?: string) => {
  if (id) {
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });

    try {
      const { Item } = await dynamodb.send(getCommand);
      if (!Item) return response(404, "Sensor data not found");
      return response(200, {
        ...Item,
        receiveAt: new Date(Item.timestamp.N).toISOString(),
      } as SensorData);
    } catch (error) {
      console.log("Error getting sensor data:", error);
      return response(500, "Error getting sensor data");
    }
  }
  const scanCommand = new ScanCommand({ TableName: TABLE_NAME });

  try {
    const { Items } = await dynamodb.send(scanCommand);
    if (!Items) return response(404, "No sensor data found");
    return response(
      200,
      Items.map((item) => ({
        ...item,
        receiveAt: item.timestamp.N
          ? new Date(item.timestamp.N).toISOString()
          : null,
      })) as SensorData[]
    );
  } catch (error) {
    console.log("Error getting sensor data:", error);
    return response(500, "Error getting sensor data");
  }
};

/*
 * Update sensor data
 */

export const updateSensorData = async (
  id: string | undefined,
  body: string | null
) => {
  if (!id) return response(400, "Missing id");

  const sensorData = parseRequestBody(body);
  if (!sensorData) return response(400, "Invalid or missing body");

  const { temperature, humidity } = sensorData;

  const putCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      id,
      temperature,
      humidity,
      timestamp: Date.now(),
    },
  });

  try {
    await dynamodb.send(putCommand);
    return response(200, "Sensor data updated successfully");
  } catch (error) {
    console.log("Error updating sensor data:", error);
    return response(500, "Error updating sensor data");
  }
};

/*
 * Delete sensor data
 */
export const deleteSensorData = async (id: string | undefined) => {
  if (!id) return response(400, "Missing id");

  const deleteCommand = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { id },
  });

  try {
    await dynamodb.send(deleteCommand);
    return response(200, "Sensor data deleted successfully");
  } catch (error) {
    console.log("Error deleting sensor data:", error);
    return response(500, "Error deleting sensor data");
  }
};
