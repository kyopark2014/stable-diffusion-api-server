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
