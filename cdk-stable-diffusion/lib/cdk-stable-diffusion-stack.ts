import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';

export class CdkStableDiffusionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = "dev"; 
    const endpoint = "jumpstart-example-infer-model-txt2img-s-2023-02-10-11-24-04-069";

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
        endpoint: endpoint,
        domain: distribution.domainName
      }
    }); 
    s3Bucket.grantReadWrite(mlLambda);

    // create a policy statement for sagemaker
    const SageMakerPolicy = new iam.PolicyStatement({
      actions: ['sagemaker:*'],
      resources: ['*'],
    });
    // add the policy to the Function's role
    mlLambda.role?.attachInlinePolicy(
      new iam.Policy(this, 'sagemaker-policy', {
        statements: [SageMakerPolicy],
      }),
    );

    // version
    const version = mlLambda.currentVersion;
    const alias = new lambda.Alias(this, 'LambdaAlias', {
      aliasName: stage,
      version,
    }); 
 



    // api Gateway
    mlLambda.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));

    // Lambda for web 
  /*  const lambdaWeb = new lambda.Function(this, "lambdaWeb", {
      description: 'lambda for web',
      functionName: 'lambda-stable-diffusion-web',
      runtime: lambda.Runtime.NODEJS_14_X, 
      code: lambda.Code.fromAsset("../lambda-for-web"), 
      handler: "index.handler", 
      timeout: cdk.Duration.seconds(3),
      environment: {
      }
    }); 
    new cdk.CfnOutput(this, 'LambdaWebARN', { // lambda arn
      value: lambdaWeb.functionArn,
      description: 'The arn of lambda for web',
    }); */

    // Create Lambda for stable diffusion using docker container for web
    const lambdaWeb = new lambda.DockerImageFunction(this, "lambdaWeb", {
      description: 'lambda for web',
      functionName: 'lambda-stable-diffusion-web',
      memorySize: 512,
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../lambda-for-web')),
      timeout: cdk.Duration.seconds(60),
      environment: {
        // bucket: "sagemaker-ap-northeast-2-677146750822",
        bucket: s3Bucket.bucketName,
        endpoint: endpoint,
        domain: distribution.domainName
      }
    }); 


    s3Bucket.grantReadWrite(lambdaWeb);

    lambdaWeb.role?.attachInlinePolicy(
      new iam.Policy(this, 'sagemaker-policy', {
        statements: [SageMakerPolicy],
      }),
    );
     // api Gateway
    lambdaWeb.grantInvoke(new iam.ServicePrincipal('apigateway.amazonaws.com'));



    // api Gateway
    const logGroup = new logs.LogGroup(this, 'AccessLogs', {
      retention: 90, // Keep logs for 90 days
    });
    logGroup.grantWrite(new iam.ServicePrincipal('apigateway.amazonaws.com')); 

    // role
    const role = new iam.Role(this, "api-role", {
      roleName: "ApiRole",
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com")
    });
    role.addToPolicy(new iam.PolicyStatement({
      resources: ['*'],
      actions: ['lambda:InvokeFunction']
    }));
    role.addManagedPolicy({
      managedPolicyArn: 'arn:aws:iam::aws:policy/AWSLambdaExecute',
    }); 

    // API Gateway
    const api = new apiGateway.RestApi(this, 'api-stable-diffusion', {
      description: 'API Gateway',
      endpointTypes: [apiGateway.EndpointType.REGIONAL],
      binaryMediaTypes: ['*/*'], 
      deployOptions: {
        stageName: stage,
        accessLogDestination: new apiGateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apiGateway.AccessLogFormat.jsonWithStandardFields({
          caller: false,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true
        }),
      },
    });  

    const text2image = api.root.addResource('text2image');
    text2image.addMethod('POST', new apiGateway.LambdaIntegration(mlLambda, {
      passthroughBehavior: apiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
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
    }); 



    // lambda for web
    // define template
    const templateString: string = `#set($inputRoot = $input.path('$'))
    {
        "prompt": "$input.params('prompt')"
    }`;

    const requestTemplates = { // path through
      'application/json': templateString,
    };

    text2image.addMethod('GET', new apiGateway.LambdaIntegration(lambdaWeb, {
      passthroughBehavior: apiGateway.PassthroughBehavior.WHEN_NO_TEMPLATES,  // options: NEVER
      requestTemplates: requestTemplates,
      credentialsRole: role,
      integrationResponses: [{
        statusCode: '200',
      }], 
      proxy:false, 
    }), {
      requestParameters: {
        'method.request.querystring.deviceid': true,
      },
      methodResponses: [   // API Gateway sends to the client that called a method.
        {
          statusCode: '200',
          responseModels: {
            'application/json': apiGateway.Model.EMPTY_MODEL,
          }, 
        }
      ]
    });

    // query url of "status" api
    let prompt = 'a rose'; // example 
    new cdk.CfnOutput(this, 'QueryUrl', {
      value: api.url+'/text2image?prompt='+prompt,
      description: 'example query url of API',
    });



  }
}
