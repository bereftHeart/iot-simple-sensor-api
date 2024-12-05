import { DynamoDB, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { response } from "../utils/response";
import { isValidEmail } from "../utils/validate";

interface UserInput {
  name: string;
  email: string;
  password: string;
}

interface UserOutput {
  id: string;
  name: string;
  email: string;
}

const dynamodb = new DynamoDB({});
const TABLE_NAME = process.env.TABLE_NAME || "UserTable";

/**
 * Utility function to parse the request body
 */
const parseRequestBody = (body: string | null): UserInput | null => {
  if (!body) return null;
  try {
    return JSON.parse(body) as UserInput;
  } catch {
    return null;
  }
};

/**
 * Create a new user
 */
export const createUser = async (body: string | null) => {
  const user = parseRequestBody(body);
  if (!user) return response(400, "Invalid or missing body");

  const { name, email, password } = user;
  if (!name || !email || !password) {
    return response(400, "Missing required fields");
  }

  if (!isValidEmail(email)) {
    return response(400, "Invalid email");
  }

  const putCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      id: randomUUID(),
      name,
      email,
      password: bcrypt.hashSync(password, 10),
    },
  });

  try {
    await dynamodb.send(putCommand);
    return response(200, "User created successfully");
  } catch (error) {
    console.error("Error creating user:", error);
    return response(500, "Error creating user");
  }
};

/**
 * Get all users or a specific user
 */
export const getUsers = async (id?: string) => {
  if (id) {
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });

    try {
      const { Item } = await dynamodb.send(getCommand);
      if (!Item) return response(404, "User not found");
      return response(200, Item as UserOutput);
    } catch (error) {
      console.error("Error getting user:", error);
      return response(500, "Error getting user");
    }
  }

  const scanCommand = new ScanCommand({ TableName: TABLE_NAME });

  try {
    const result = await dynamodb.send(scanCommand);
    return response(200, result.Items as unknown as UserOutput[]);
  } catch (error) {
    console.error("Error getting users:", error);
    return response(500, "Error getting users");
  }
};

/**
 * Update a user
 */
export const updateUser = async (
  id: string | undefined,
  body: string | null
) => {
  if (!id) return response(400, "Missing id");

  const user = parseRequestBody(body);
  if (!user) return response(400, "Invalid or missing body");

  const { name, email, password } = user;
  const putCommand = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      id,
      name,
      email,
      password: bcrypt.hashSync(password, 10),
    },
  });

  try {
    await dynamodb.send(putCommand);
    return response(200, "User updated successfully");
  } catch (error) {
    console.error("Error updating user:", error);
    return response(500, "Error updating user");
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (id: string | undefined) => {
  if (!id) return response(400, "Missing id");

  const deleteCommand = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { id },
  });

  try {
    await dynamodb.send(deleteCommand);
    return response(200, "User deleted");
  } catch (error) {
    console.error("Error deleting user:", error);
    return response(500, "Error deleting user");
  }
};
