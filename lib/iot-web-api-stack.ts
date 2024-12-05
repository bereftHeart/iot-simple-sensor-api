import * as cdk from "aws-cdk-lib";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";

export class IotWebApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userTable = new dynamodb.Table(this, "UserTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: "UserTable",
    });

    const sensorTable = new dynamodb.Table(this, "SensorTable", {
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: "SensorTable",
    });

    const api = new RestApi(this, "RestAPI", {
      restApiName: "RestAPI",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    const userLambda = new NodejsFunction(this, "UserLambda", {
      entry: "src/functions/user.ts",
      handler: "lambdaHandler",
      environment: {
        TABLE_NAME: userTable.tableName,
      },
    });

    const sensorLambda = new NodejsFunction(this, "SensorLambda", {
      entry: "src/functions/sensor.ts",
      handler: "lambdaHandler",
      environment: {
        TABLE_NAME: sensorTable.tableName,
      },
    });

    userTable.grantReadWriteData(userLambda);

    const usersResource = api.root.addResource("users");
    const userResource = usersResource.addResource("{id}");

    const sensorsResource = api.root.addResource("sensor-data");
    const sensorResource = sensorsResource.addResource("{id}");

    const userIntegration = new LambdaIntegration(userLambda);
    const sensorIntegration = new LambdaIntegration(sensorLambda);

    usersResource.addMethod("GET", userIntegration);
    usersResource.addMethod("POST", userIntegration);
    userResource.addMethod("GET", userIntegration);
    userResource.addMethod("PUT", userIntegration);
    userResource.addMethod("DELETE", userIntegration);

    sensorsResource.addMethod("GET", sensorIntegration);
    sensorsResource.addMethod("POST", sensorIntegration);
    sensorResource.addMethod("GET", sensorIntegration);
    sensorResource.addMethod("PUT", sensorIntegration);
    sensorResource.addMethod("DELETE", sensorIntegration);

    new cdk.CfnOutput(this, "APIGatewayURL", {
      value: api.url ?? "Something went wrong with the deployment",
    });
  }
}
