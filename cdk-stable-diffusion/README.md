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

## Console에서 Python으로 생성된 Lambda 배포하기 

라이브러리 설치는 아래와 같이 수행합니다. 여기서 PIL은 pillow입니다.

```java
pip install --upgrade pip
pip install --target=lambda numpy 
```

압축후 Console에서 zip으로 업로드 합니다. 압축시 lambda 소스 폴더를 포함하여 압축하여야 합니다. (node.js와 다름)

```java
cd lambda
zip -r ../lambda.zip .
```

## Lambda에서 Pillow, Numpy 사용관련 

Lambda에서 pillow 사용시 아래와 같은 에러가 발생합니다. 

```java
[ERROR] Runtime.ImportModuleError: Unable to import module 'lambda_function': cannot import name '_imaging' from 'PIL' (/var/task/PIL/__init__.py)
```

### Lambda에서 Layer를 추가하는 방법 

[Creating New AWS Lambda Layer For Python Pandas Library](https://medium.com/@qtangs/creating-new-aws-lambda-layer-for-python-pandas-library-348b126e9f3e)

https://stackoverflow.com/questions/67553637/how-to-install-pillow-on-aws-lambda-for-python-3-8

[AWS Lambda에서 Puppeteer로 크롤링 하기](https://velog.io/@jeffyoun/AWS-Lambda%EC%97%90%EC%84%9C-Puppeteer%EB%A1%9C-%ED%81%AC%EB%A1%A4%EB%A7%81-%ED%95%98%EA%B8%B0)

[AWS Lambda에 pymysql 설치하기 (package 설치하기)](https://velog.io/@silver_bell/lambda-layer)

### Docker Container를 이용하는 방법

Lambda에서 Docker 사용시에 이 문제는 발생하지 않습니다. 여기서는 Docker를 이용하여 문제를 해결하였습니다. 

## Reference 

[Deploying SageMaker Endpoints With CloudFormation](https://towardsdatascience.com/deploying-sagemaker-endpoints-with-cloudformation-b43f7d495640)

[컴파일된 바이너리가 포함된 Python 패키지를 배포 패키지에 추가하고 패키지를 Lambda와 호환되게 하려면 어떻게 해야 하나요?](https://aws.amazon.com/ko/premiumsupport/knowledge-center/lambda-python-package-compatible/)

[Request Inferences from a Deployed Service (Boto3)](https://docs.aws.amazon.com/sagemaker/latest/dg/neo-requests-boto3.html)

[Build and automatize the management of your Sagemaker Studio Users using AWS CDK!](https://github.com/comeddy/aws-cdk-sagemaker-studio)
