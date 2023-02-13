# AI Art 모델인 Stable Diffusion을 쉽고 편리하게 이용하기

[Stable Diffusion](https://thealgorithmicbridge.substack.com/p/stable-diffusion-is-the-most-important?fbclid=IwAR1I0Fb7kPSEFgZ7a-JhGmEZzbPJhvkYYMcyyw7VDH35SdsKN_kq3_JCxvE) 모델을 이용하면 텍스트를 이용하여 창조적인 이미지를 생성할 수 있습니다. Amazon에서는 [SageMaker JumpStart](https://docs.aws.amazon.com/sagemaker/latest/dg/studio-jumpstart.html)을 이용하여 머신러닝(ML)을 쉽게 사용할 수 있도록 사전학습(pre-trained)된 모델을 제공하고 있는데, [2022년 10월 부터 Stable Diffusion](https://aws.amazon.com/ko/about-aws/whats-new/2022/11/sagemaker-jumpstart-stable-diffusion-bloom-models/) 모델을 추가적으로 제공하고 있습니다. 이를 통해 [Stable Diffusion 이미지를 쉽게 생성](https://aws.amazon.com/ko/blogs/machine-learning/generate-images-from-text-with-the-stable-diffusion-model-on-amazon-sagemaker-jumpstart/)할 수 있으며, 즉시 Serving할 수 있도록 SageMaker Endpoint도 제공합니다. SageMaker Endpoint는 트래픽이 증가할 때는 자동으로 Scale out 하므로, 트래픽 변동이 심할때에도 효율적으로 인프라를 유지할 수 있으며 [IAM 기반의 강화된 보안](https://docs.aws.amazon.com/ko_kr/IAM/latest/UserGuide/introduction.html)을 제공하고 있습니다.

### Stable Diffusion 예제

[Stable Diffusion Keywords](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/keywords.md)에서는 keywords에 따른 Stable Diffusion의 결과를 볼 수 있습니다.


"The Legend of Zelda landscape atmospheric, hyper realistic, 8k, epic composition, cinematic, octane render, artstation landscape vista photography by Carr Clifton & Galen Rowell, 16K resolution, Landscape veduta photo by Dustin Lefevre & tdraw, 8k resolution, detailed landscape painting by Ivan Shishkin, DeviantArt, Flickr, rendered in Enscape, Miyazaki, Nausicaa Ghibli, Breath of The Wild, 4k detailed post processing, artstation, rendering by octane, unreal engine —ar 16:9"

<img src="https://user-images.githubusercontent.com/52392004/218261517-3425049d-074c-4bec-9d49-939ae96de695.png" width="400">




### JumpStart에서 제공한 Stable Diffusion Endpoint사용시 주의사항

SageMaker Endpoint로 JumpStart에서 제공한 Stable Diffusion 이미지 생성을 요청할 때 얻어진 응답(Response)은 아래와 같습니다. JSON 응답에는 "generated_image" 필드로 이미지의 RGB 정보를 전달합니다. 이를 클라이언트에서 활용하기 위해서는 이미지 포맷으로 변경하여야 합니다. 또한, SageMaker Endpoint로 Stable Diffusion 이미지 생성을 요청(Request)할 때에는 IAM 인증을 하여야 하므로, 클라이언트는 민감한 정보인 IAM Credential을 가지고 있어야 하고, [AWS SDK](https://aws.amazon.com/ko/sdk-for-python/)를 통해 API 요청을 수행하여야 합니다. 따라서 웹브라우저 또는 모바일앱에서는 IAM 인증 기반의 서비스를 제공하기 어렵습니다. 이와 같은 이유로 본 게시글에서는 SageMaker Endpoint에 대한 IAM 인증 및 이미지 파일 변환을 위해 API Gateway와 Lambda를 사용합니다. 


```java
{
    "generated_image": [
        [[221,145,108],[237,141,98],[249,154,111],..]
        ...
    ],
    "prompt": "{
        predictions":[{
            "prompt": "astronaut on a horse", 
            "width": 768, 
            "height": 768,
            "num_images_per_prompt": 1, 
            "num_inference_steps": 50, 
            "guidance_scale": 7.5
        }]
    }
}
```

## 제안된 Stable Diffusion Architecture 

전체적인 Architecture는 아래와 같습니다. SageMaker는 JumpStart로 제공되는 Stable Diffusion 모델을 가지고 있어서 입력된 텍스트로 부터 이미지를 생성할 수 있습니다. Lambda는 IAM 인증을 통해 SageMaker Endpoint로 사용자가 전달한 텍스트 정보를 전달하고, 생성된 이미지의 정보를 image map 형태로 얻습니다. 사용자가 쉽게 사용할 수 있도록 image map은 S3에 JPEG 포맷으로 저장되는데, CloudFront 도메인 정보를 활용하여 이미지에 대한 URL을 생성합니다. API Gateway는 사용자의 요청을 Restful API로 받아서 Lambda에 사용자의 요청을 전달하고, Lambda가 생성한 URL 이미지 정보를 사용자에게 응답으로 전달합니다. 전체 서비스들의 배포는 [AWS CDK](https://aws.amazon.com/ko/cdk/)를 이용하고, [docker container 이미지는 ECR](https://docs.aws.amazon.com/ko_kr/AmazonECR/latest/userguide/docker-push-ecr-image.html)로 관리합니다.

<img src="https://user-images.githubusercontent.com/52392004/217674900-3693c261-7f96-42ab-bda7-e40df466b64f.png" width="800">

## SageMaker Endpoint로 추론(Inference)을 요청 방법

Lambda에서 Sagemaker Endpoint로 추론(Inference) 요청시에 아래와 같이 "ContentType"과 "Accept"을 지정하여야 합니다. 

```java
"ContentType": "application/x-text",
"Accept": "application/json",
```

이때 Request의 Body에는 아래 포맷으로 Stable Diffusion에 필요한 정보를 전달합니다. width, height로 이미지의 크기를 지정하는데 8로 나눌 수 있어야 합니다.  num_images_per_prompt은 한번에 생성되는 이미지의 갯수이고, num_inference_steps는 이미지 생성시 [denoising 단계](https://cvpr2022-tutorial-diffusion-models.github.io/)를 의미하는데 숫자를 높이면 더 높은 품질의 이미지를 얻을 수 있습니다. guidance_scale은 prompt에 가까운 정도를 표현합니다. 

```java
{
    predictions":[{
        "prompt": "astronaut on a horse",
        "width": 768,
        "height": 768,
        "num_images_per_prompt": 1,
        "num_inference_steps": 50,
        "guidance_scale": 7.5
    }]
}
```

[lambda_function.py](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/lambda/lambda_function.py)에서는 아래와 같이 요청을 수행합니다. Python의 [boto3](https://aws.amazon.com/ko/sdk-for-python/)을 이용해 SageMaker Endpoint에 요청(request)을 전달하는데, ContentType은 "application/x-text"이고, Accept 헤더로는 "Accept='application/json" 또는 "Accept='application/json;jpeg"을 사용할 수 있습니다. 

```python
import boto3

runtime = boto3.Session().client('sagemaker-runtime')
response = runtime.invoke_endpoint(EndpointName=endpoint, ContentType='application/x-text', Accept='application/json;jpeg', Body=json.dumps(payload))
```

### RGB 이미지 데이터를 변환하여 S3에 업로드 하는 경우 

SageMaker Endpoint에 query시에 Accept을 "application/json"으로 하는 경우에 RGB로 된 text데이터가 내려옵니다. 이미지 데이터는 JSON의 "Body"와 "generated_image"로 부터 추출한 후에, [PIL(pillow)](https://pillow.readthedocs.io/en/stable/)과 [numpy](https://numpy.org/) 라이브러리를 사용하여 S3에 저장할수 있는 바이너리 이미지 데이터로 변환합니다. 이때 [lambda_function.py](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/lambda/lambda_function.py)의 코드는 아래와 같습니다. 

```python
from PIL import Image
import numpy as np

def parse_response(query_response):
    response_dict = json.loads(query_response)
    return response_dict["generated_image"], response_dict["prompt"]
    
response_payload = response['Body'].read().decode('utf-8')
generated_image, prompt = parse_response(response_payload)
        
image = Image.fromarray(np.uint8(generated_image))
buffer = io.BytesIO()
image.save(buffer, "jpeg")
buffer.seek(0)
            
s3 = boto3.client('s3')
s3.upload_fileobj(buffer, mybucket, mykey, ExtraArgs={ "ContentType": "image/jpeg"})
```

그런데, Lambda에서 pillow, numpy 라이브러리를 "pip install --target=[lambda 폴더] pillow numpy"와 같이 설치한 후 압축해서 올리면 [layer를 추가](https://medium.com/@shimo164/lambda-layer-to-use-numpy-and-pandas-in-aws-lambda-function-8a0e040faa18)하여야 하므로, docker container를 이용하여 pillow, numpy와 같은 라이브러리를 사용할 수 있도록 합니다. 이때의 [Dockerfile](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/lambda/Dockerfile)의 예는 아래와 같습니다.

```java
FROM amazon/aws-lambda-python:3.8

RUN pip3 install --upgrade pip
RUN python -m pip install joblib awsiotsdk

RUN pip install numpy pillow

WORKDIR /var/task/lambda

COPY lambda_function.py /var/task

COPY . .

CMD ["lambda_function.lambda_handler"]
```

### JPEG로 encoding된 이미지를 S3에 업로드 하는 경우 

Accept헤더를 "application/json;jpeg"로 설정하면 SageMaker Endpoint가 base64로 encoding된 JPEG 이미지를 전달합니다. 따라서 base64 decoding 후에 인메모리 바이너리 스트림으로 변경하여 S3로 업로드합니다. 

```python
response_payload = response['Body'].read().decode('utf-8')
generated_image, prompt = parse_response(response_payload)

import base64
img_str = base64.b64decode(generated_image)
buffer = io.BytesIO(img_str)  
s3.upload_fileobj(buffer, mybucket, mykey, ExtraArgs={"ContentType": "image/jpeg"})
```


## AWS CDK를 이용한 배포 준비

[CDK 배포 준비](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/cdk-stable-diffusion/README.md#cdk-deployment-preparation)에서는 CDK로 S3, Lambda, API Gateway, CloudFront를 배포하는 방법을 설명합니다. 


## 배포하기

### Stable Diffusion을 위한 SageMaker Endpoint 생성

[Stable Diffusion Endpoint 생성](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/endpoint.md)에 따라 SageMaker JumpStart에서 Stable Diffusion Endpoint 생성합니다. 

### CDK로 추론 인프라 구축하기 

추론을 위한 인프라에는 API Gateway, S3, Lambda, CloudFront가 있으며, AWS CDK로 배포합니다. 상세한 배포정보는 [cdk-stable-diffusion-stack.ts](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/cdk-stable-diffusion/lib/cdk-stable-diffusion-stack.ts)을 참조합니다. 
Cloud9을 생성하기 위하여 Cloud9 console에서 [Create environment](https://ap-northeast-2.console.aws.amazon.com/cloud9control/home?region=ap-northeast-2#/)를 선택한 후에 아래처럼 Name을 입력합니다. 여기서는 "Stabel Diffusion"이라고 입력하였습니다. 이후 나머지는 모두 그대로 유지하고 [Create]를 선택합니다. 

![noname](https://user-images.githubusercontent.com/52392004/217852338-d630b25c-fffc-4e4c-8254-2f4c7a4774c1.png)

Cloud9이 생성된 후에 [Open]을 선택하여 진입한 후 아래처럼 터미널을 실행합니다.

<img src="https://user-images.githubusercontent.com/52392004/217853346-c2950931-37e0-4cd0-ac63-65a5f98ac93d.png" width="600">


이후 아래와 같이 관련 코드를 다운로드 합니다.

```java
git clone https://github.com/kyopark2014/stable-diffusion-api-server
```

인프라 생성시 SageMaker의 Endpoint 정보가 필요하므로, 아래와 같이 좌측 파일탐색기에서 ["cdk-stable-diffusion/lib/cdk-stable-diffusion-stack.ts"](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/cdk-stable-diffusion/lib/cdk-stable-diffusion-stack.ts)를 선택하여 이전 단계에서 복사한 Endpoint의 이름을 수정합니다.


![noname](https://user-images.githubusercontent.com/52392004/217868769-070a96ad-a4ff-45db-8a35-8b2675912bc2.png)



CDK 폴더(cdk-stable-diffusion)로 이동하여 "aws-cdk-lib"와 "path" 라이브러리를 npm으로 설치합니다. 여기서, "aws-cdk-lib"은 CDK 2.0 라이브러리를 의미합니다. 

```java
cd cdk-stable-diffusion && npm install aws-cdk-lib path
```

아래 명령어로 전체 인프라를 설치합니다.

```java
cdk deploy
```

CDK로 인프라 설치가 완료되면 아래와 같이 설치된 인프라의 정보를 알 수 있습니다. 여기서 appUrl은 Browser에서 query문을 이용해 API를 호출할때 사용할 수 있고, curlUrl은 shell에서 테스트 할 때 사용합니다. 

![noname](https://user-images.githubusercontent.com/52392004/218288489-223d17d4-c230-4f0a-a8b6-d7a057c35ce7.png)

실제 예는 아래와 같습니다.

```java
CdkStableDiffusionStack.WebUrl = https://1r9dqh4f37.execute-api.ap-northeast-2.amazonaws.com/dev/text2image?prompt=astronaut
CdkStableDiffusionStack.curlUrl = curl -X POST https://1r9dqh4f37.execute-api.ap-northeast-2.amazonaws.com/dev/text2image -H "Content-Type: application/json" -d '{"text":"astronaut on a horse"}'
```

### Browser에서 요청할 경우

Browser에서 접속하는 방법은 아래와 같습니다. prompt에 쿼리할 문장을 입력합니다. 

```java
https://1r9dqh4f37.execute-api.ap-northeast-2.amazonaws.com/dev/text2image?prompt=astronaut on a horse
```

이때의 결과는 아래와 같습니다.

![image](https://user-images.githubusercontent.com/52392004/218288641-66226662-1b0a-4b5c-9fbb-160083283f55.png)


### Curl로 요청할 경우

curl 명령어로 아래와 같이 실행할 수 있습니다. 

```java
curl -X POST https://1r9dqh4f37.execute-api.ap-northeast-2.amazonaws.com/dev/text2image -H "Content-Type: application/json" -d '{"text":"astronaut on a horse"}'
```

<!--
추론에 대한 결과의 예입니다. "body"에 추론의 결과로 생성된 이미지의 URL이 있습니다. 

```java
{"statusCode": 200, "body": "https://d283dvdglbetjo.cloudfront.net/img_20230208-014926"}
```
-->

상기의 이미지 URL로 부터 얻어진 추론 결과입니다.

![image](https://user-images.githubusercontent.com/52392004/217674397-a1cf5a4f-285f-44a0-90be-18c6b30781b5.png)

### Postman으로 실행할 경우 

아래와 같이 POST 방식을 선택하고 URL을 입력합니다. 

<img src="https://user-images.githubusercontent.com/52392004/217409331-f291f28a-80ca-4f9d-a13c-528a91dc226b.png" width="600">


[Body] - [raw] 에서 JSON 형태로 입력합니다. 

```java
{
   "text": "astronaut on a horse"
}
```

[Headers]에 아래와 같이 Conten-Type으로 application/json을 추가합니다.

<img src="https://user-images.githubusercontent.com/52392004/217409986-97161517-34c7-49c1-af6e-c447e73c55d5.png" width="600">

이후 [Sent]를 선택하면 아래와 같은 결과를 얻습니다. 

<img src="https://user-images.githubusercontent.com/52392004/217410742-7c3a9020-d62c-4b92-844e-44205c8dd143.png" width="500">

## Examples

아래와 같이 입력하는 텍스트를 변경하면서 결과를 확인하여 보았습니다. 


- ukrainian girl with blue and yellow clothes near big ruined plane, concept art, trending on artstation, highly detailed, intricate, sharp focus, digital art, 8 k

![image](https://user-images.githubusercontent.com/52392004/218259928-ccf4204c-a204-40da-8bb9-f5a6f2c08105.png)


- a portrait of a korean woman that is a representation of korean culture, buenos aires, fantasy, intricate, highly detailed, digital painting, artstation, concept art, smooth, sharp focus, illustration, art by artgerm and greg rutkowski and alphonse mucha

![image](https://user-images.githubusercontent.com/52392004/218595534-e228cbb5-6fb2-451f-96eb-7f4852b27fc5.png)



- "I see trees of green Red roses too. I see them bloom for me and you. And I think to myself. What a wonderful world" (Louis Armstrong's What a Wonderful World song!)

![image](https://user-images.githubusercontent.com/52392004/217809108-e8886c0c-e240-432a-8adc-3ec2b24759a8.png)

- "I see skies of blue. And clouds of white. The bright blessed day. The dark sacred night. And I think to myself. What a wonderful world" (Louis Armstrong's What a Wonderful World song!)

![img_20230209-080037](https://user-images.githubusercontent.com/52392004/217871789-75e9faa6-ad98-497b-b2de-de07de4a15d4.jpeg)


## Reference

[Generate images from text with the stable diffusion model on Amazon SageMaker JumpStart](https://aws.amazon.com/ko/blogs/machine-learning/generate-images-from-text-with-the-stable-diffusion-model-on-amazon-sagemaker-jumpstart/)

[Amazon SageMaker JumpStart로 사전 구축된 모델과 기계 학습 솔루션 액세스 단순화](https://aws.amazon.com/ko/blogs/korea/amazon-sagemaker-jumpstart-simplifies-access-to-prebuilt-models-and-machine-learning-models/)

[Introduction to JumpStart - Text to Image](https://github.com/aws/amazon-sagemaker-examples/blob/main/introduction_to_amazon_algorithms/jumpstart_text_to_image/Amazon_JumpStart_Text_To_Image.ipynb)

[SageMaker Endpoint (Single Model Endpoint)](https://github.com/aws-samples/aws-ai-ml-workshop-kr/blob/master/sagemaker/sm-special-webinar/lab_2_serving/2.1.Deploy.ipynb)

[Build and automatize the management of your Sagemaker Studio Users using AWS CDK](https://github.com/aws-samples/aws-cdk-sagemaker-studio)

[Deploying SageMaker Endpoints With CloudFormation](https://towardsdatascience.com/deploying-sagemaker-endpoints-with-cloudformation-b43f7d495640)

[Running Serverless ML on AWS Lambda](https://betterdev.blog/serverless-ml-on-aws-lambda/)

[Deploy Stable Diffusion Models On Amazon SageMaker Endpoint](https://github.com/aws-samples/deploy-stable-diffusion-model-on-amazon-sagemaker-endpoint)
