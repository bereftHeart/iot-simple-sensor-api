# Welcome to AWS CDK Typescript project

This is a simple AWS serverless CRUD API using nodejs.

View live demo here: <http://iot-api-swagger-ui-bucket.s3-website.ap-northeast-3.amazonaws.com>

## Prerequisite

Already have an AWS account, install AWS CLI, AWS CDK CLI and configure AWS CLI. If not, following this instruction:
<https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html>

## How to deploy

Clone the project

```sh
git clone https://github.com/bereftHeart/iot-simple-sensor-api.git
```

Install dependencies

```sh
npm i
```

Bootstrap your CDK

```sh
cdk bootstrap
```

Deploy on your stack

```sh
cdk deploy
```

Useful command

```sh
npm run build
npm run watch
npm run test
npm run deploy
npm run destroy
```

## Steps to Set Up Swagger UI on S3

### Export the rest api

Generate json file by run the following command:

```sh
aws apigateway get-export --parameters extensions='apigateway' --rest-api-id <your-api-id> --stage-name prod --export-type swagger latestSwagger2.json
```

### Prepare the Swagger UI Files

- Download the latest Swagger UI from [GitHub](https://github.com/swagger-api/swagger-ui/releases).
- Unzip the downloaded `swagger-ui.zip` file.

### Update the Swagger Configuration

- Place your exported `latestSwagger2.json` file into the extracted directory where index.html is located (For example: swagger-ui/dist/)

- Open the `index.html`, update the url parameter to point to the `latestSwagger2.json` file:

```js
    <script>
      // Initialize Swagger UI
      window.onload = function () {
        const ui = SwaggerUIBundle({
          url: "latestSwagger2.json", // Path to your Swagger JSON file
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout"
        });
        window.ui = ui;
      };
    </script>
```

### Serve the Swagger UI

Here I use an S3 Bucket to host the Swagger UI files and the Swagger JSON file on a web server.

#### Create s3 bucket

```sh
aws s3 mb s3://your-swagger-ui-bucket
```

#### Enable Static Website Hosting

```sh
aws s3 website s3://your-swagger-ui-bucket/ --index-document index.html --error-document error.html
```

#### Upload Files to the S3 Bucket

```sh
aws s3 sync ./swagger-ui/ s3://your-swagger-ui-bucket/
```

Ensure that `index.html` and `latestSwagger2.json` are in the root of the uploaded directory.

#### Make the Files Public

```sh
aws s3api put-bucket-policy --bucket your-swagger-ui-bucket --policy file://bucket-policy.json
```

If you got the error that cause by **public policies are blocked by the BlockPublicPolicy block public access setting**, try the following solution:

- Go to the S3 Console in AWS.
- Select your bucket (iot-api-swagger-ui-bucket).
- Under the Permissions tab, look for Block Public Access (Bucket settings).
- Click Edit and uncheck the following settings:
  - Block public access to buckets and objects granted through new public bucket policies.
  - Block public and cross-account access to buckets and objects through any public bucket policies.
- Save changes.

#### Access the Swagger UI

The public URL for your Swagger UI is:
`http://<your-swagger-ui-bucket>.s3-website-<region>.amazonaws.com`

Example:

```plaintext
http://your-swagger-ui-bucket.s3-website-us-west-2.amazonaws.com
```
