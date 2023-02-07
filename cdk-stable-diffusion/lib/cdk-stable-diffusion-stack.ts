import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment"

export class CdkStableDiffusionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = "dev"; 

    // s3 deployment
    const s3Bucket = new s3.Bucket(this, "gg-depolyment-storage",{
      // bucketName: bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      versioned: false,
    });
    new cdk.CfnOutput(this, 'bucketName', {
      value: s3Bucket.bucketName,
      description: 'The nmae of bucket',
    });
    new cdk.CfnOutput(this, 's3Arn', {
      value: s3Bucket.bucketArn,
      description: 'The arn of s3',
    });
    new cdk.CfnOutput(this, 's3Path', {
      value: 's3://'+s3Bucket.bucketName,
      description: 'The path of s3',
    });


    // Create Lambda for stable diffusion using docker container
    const mlLambda = new lambda.DockerImageFunction(this, "lambda-stable-diffusion", {
      description: 'lambda function for stable diffusion',
      functionName: 'lambda-stable-diffusion',
      memorySize: 512,
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../lambda')),
      timeout: cdk.Duration.seconds(60),
      environment: {
        // bucket: "sagemaker-ap-northeast-2-677146750822",
        bucket: s3Bucket.bucketName,
        endpoint: "jumpstart-example-infer-model-txt2img-s-2023-02-07-08-03-49-268"
      }
    }); 

    // version
    const version = mlLambda.currentVersion;
    const alias = new lambda.Alias(this, 'LambdaAlias', {
      aliasName: stage,
      version,
    }); 
 
    // api Gateway
/*  mlLambda.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));

    const requestTemplates = { // path through
    //  "image/jpeg": templateString,
    //  "image/jpg": templateString,
    //  "application/octet-stream": templateString,
    //  "image/png" : templateString,
      "application/json" : templateString
    }
    
    const upload = api.root.addResource('text2image');
    upload.addMethod('POST', new apiGateway.LambdaIntegration(mlLambda, {
      // PassthroughBehavior: apiGateway.PassthroughBehavior.NEVER,
      passthroughBehavior: apiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
      requestTemplates: requestTemplates,
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:false, 
    }), {
      methodResponses: [   // API Gateway sends to the client that called a method.
        {
          statusCode: '200',
          responseModels: {
            'application/json': apiGateway.Model.EMPTY_MODEL,
          }, 
        }
      ]
    }); 

    new cdk.CfnOutput(this, 'apiUrl', {
      value: api.url,
      description: 'The url of API Gateway',
    }); */
  }
}
