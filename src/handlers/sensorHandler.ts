import { DynamoDB, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { randomUUID } from "crypto";
import { excludeSensitiveFields } from "../utils/common";
import { response } from "../utils/response";

interface SensorData {
  id: string;
  sensorName: string;
  sensorValue: number;
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

  const { sensorName, sensorValue } = sensorData;
  if (!sensorName || !sensorValue) {
    return response(400, "Missing required fields");
  }

  const putCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      id: randomUUID(),
      sensorName,
      sensorValue,
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
        ...excludeSensitiveFields(Item, ["timestamp"]),
        receiveAt: new Date(Item.timestamp).toISOString() || null,
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
    const unmarshalledItems = Items?.map((item) => unmarshall(item));
    return response(
      200,
      unmarshalledItems.map((item) => ({
        ...excludeSensitiveFields(item, ["timestamp"]),
        receiveAt: item.timestamp
          ? new Date(item.timestamp).toISOString()
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

  const { sensorName, sensorValue } = sensorData;
  let updateExpression = "";
  if (sensorName) {
    updateExpression += "SET sensorName = :sensorName";
  }
  if (sensorValue) {
    updateExpression += ", sensorValue = :sensorValue";
  }
  const expressionAttributeValues: { [key: string]: any } = {};
  if (sensorName) {
    expressionAttributeValues[":sensorName"] = sensorName;
  }
  if (sensorValue) {
    expressionAttributeValues[":sensorValue"] = sensorValue.toString();
  }

  const putCommand = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
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
