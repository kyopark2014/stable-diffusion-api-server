import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Deploy from "aws-cdk-lib/aws-s3-deployment"
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

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

    // cloudfront
    const myOriginRequestPolicy = new cloudFront.OriginRequestPolicy(this, 'OriginRequestPolicyCloudfront', {
      originRequestPolicyName: 'QueryStringPolicyCloudfront',
      comment: 'Query string policy for cloudfront',
      cookieBehavior: cloudFront.OriginRequestCookieBehavior.none(),
      headerBehavior: cloudFront.OriginRequestHeaderBehavior.none(),
      queryStringBehavior: cloudFront.OriginRequestQueryStringBehavior.allowList('deviceid'),
    });

    const distribution = new cloudFront.Distribution(this, 'cloudfront', {
      defaultBehavior: {
        origin: new origins.S3Origin(s3Bucket),
        allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: cloudFront.PriceClass.PRICE_CLASS_200,  
    });
  /*  distribution.addBehavior("/status", new origins.RestApiOrigin(apigw), {
      cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: myOriginRequestPolicy,
      viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    }); */

    new cdk.CfnOutput(this, 'distributionDomainName', {
      value: distribution.domainName,
      description: 'The domain name of the Distribution',
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
        endpoint: "jumpstart-example-infer-model-txt2img-s-2023-02-07-08-03-49-268",
        domain: distribution.domainName
      }
    }); 
    s3Bucket.grantReadWrite(mlLambda);

    // version
    const version = mlLambda.currentVersion;
    const alias = new lambda.Alias(this, 'LambdaAlias', {
      aliasName: stage,
      version,
    }); 
 
    // api Gateway
/*  mlLambda.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));

    const requestTemplates = { // path through
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
