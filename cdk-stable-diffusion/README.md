# CDK로 인프라 설치하기 

AWS CDK Library를 아래와 같이 실행합니다. 

```java
cd cdk-stable-diffusion
npm install -g aws-cdk-lib path
```

인프라를 설치합니다. 

```java
cdk deploy --all
```

인프라를 삭제합니다.

```java
cdk destroy --all
```



## Reference 

[Deploying SageMaker Endpoints With CloudFormation](https://towardsdatascience.com/deploying-sagemaker-endpoints-with-cloudformation-b43f7d495640)

[컴파일된 바이너리가 포함된 Python 패키지를 배포 패키지에 추가하고 패키지를 Lambda와 호환되게 하려면 어떻게 해야 하나요?](https://aws.amazon.com/ko/premiumsupport/knowledge-center/lambda-python-package-compatible/)

[Request Inferences from a Deployed Service (Boto3)](https://docs.aws.amazon.com/sagemaker/latest/dg/neo-requests-boto3.html)
