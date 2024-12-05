import * as cdk from "aws-cdk-lib";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export class IotWebApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB tables
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

    // API Gateway
    const api = new RestApi(this, "RestAPI", {
      restApiName: "RestAPI",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    });

    // Log Groups for Lambdas
    const userLogGroup = new logs.LogGroup(this, "UserLogGroup", {
      logGroupName: "/aws/lambda/UserLambdaLogs",
      retention: logs.RetentionDays.ONE_WEEK, // Keep logs for one week
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Remove logs when stack is deleted
    });

    const sensorLogGroup = new logs.LogGroup(this, "SensorLogGroup", {
      logGroupName: "/aws/lambda/SensorLambdaLogs",
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda Functions
    const userLambda = new NodejsFunction(this, "UserLambda", {
      entry: "src/functions/user.ts",
      handler: "lambdaHandler",
      environment: {
        TABLE_NAME: userTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK, // Attach the log retention directly
    });

    const sensorLambda = new NodejsFunction(this, "SensorLambda", {
      entry: "src/functions/sensor.ts",
      handler: "lambdaHandler",
      environment: {
        TABLE_NAME: sensorTable.tableName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant Lambda permissions to write logs
    userLogGroup.grantWrite(userLambda);
    sensorLogGroup.grantWrite(sensorLambda);

    // Grant access to DynamoDB tables
    userTable.grantReadWriteData(userLambda);
    sensorTable.grantReadWriteData(sensorLambda);

    // API Resources
    const usersResource = api.root.addResource("users");
    const userResource = usersResource.addResource("{id}");

    const sensorsResource = api.root.addResource("sensor-data");
    const sensorResource = sensorsResource.addResource("{id}");

    // Lambda Integrations
    const userIntegration = new LambdaIntegration(userLambda);
    const sensorIntegration = new LambdaIntegration(sensorLambda);

    // API Methods for Users
    usersResource.addMethod("GET", userIntegration);
    usersResource.addMethod("POST", userIntegration);
    userResource.addMethod("GET", userIntegration);
    userResource.addMethod("PUT", userIntegration);
    userResource.addMethod("DELETE", userIntegration);

    // API Methods for Sensors
    sensorsResource.addMethod("GET", sensorIntegration);
    sensorsResource.addMethod("POST", sensorIntegration);
    sensorResource.addMethod("GET", sensorIntegration);
    sensorResource.addMethod("PUT", sensorIntegration);
    sensorResource.addMethod("DELETE", sensorIntegration);

    // Output API Gateway URL
    new cdk.CfnOutput(this, "APIGatewayURL", {
      value: api.url ?? "Something went wrong with the deployment",
    });
  }
}
