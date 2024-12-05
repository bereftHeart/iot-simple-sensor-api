import { APIGatewayProxyEvent } from "aws-lambda";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
} from "../handlers/userHandler";
import { response } from "../utils/response";

export const lambdaHandler = async (event: APIGatewayProxyEvent) => {
  try {
    const id = event.pathParameters?.id;

    switch (event.httpMethod) {
      case "GET":
        return await getUsers(id);
      case "POST":
        return await createUser(event.body);
      case "PUT":
        return await updateUser(id, event.body);
      case "DELETE":
        return await deleteUser(id);
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
