# Stable Diffusion API Server

[Stable Diffusion](https://aws.amazon.com/ko/blogs/machine-learning/generate-images-from-text-with-the-stable-diffusion-model-on-amazon-sagemaker-jumpstart/) 모델을 이용하면 텍스트를 이용하여 창조적인 이미지를 생성할 수 있습니다. Amazon에서는 [SageMaker JumpStart](https://aws.amazon.com/ko/sagemaker/jumpstart/?sagemaker-data-wrangler-whats-new.sort-by=item.additionalFields.postDateTime&sagemaker-data-wrangler-whats-new.sort-order=desc)을 이용하여 머신러닝(ML) 모델을 쉽게 사용할 수 있도록 사전학습(pre-trained)된 모델을 제공하고 있는데, [2022년 10월 부터 Stable Diffusion](https://aws.amazon.com/ko/about-aws/whats-new/2022/11/sagemaker-jumpstart-stable-diffusion-bloom-models/) 모델을 추가적으로 제공하고 있습니다. 이를 통해 Stable Diffusion 이미지를 쉽게 생성할 수 있으며, 즉시 Serving할 수 있도록 SageMaker Endpoint도 제공합니다. SageMaker Endpoint는 트래픽이 증가할 때는 자동으로 Scale out 하므로, 트래픽 변동이 심할때에도 효율적으로 인프라를 유지할 수 있으며 [IAM 기반의 강화된 보안](https://docs.aws.amazon.com/ko_kr/IAM/latest/UserGuide/introduction.html)을 제공하고 있습니다.

아래는 SageMaker Endpoint로 Stable Diffusion 요청시에 얻어진 응답(Response)입니다. JSON 응답에는 "generated_image" 필드로 이미지의 RGB 정보를 전달합니다. 이를 클라이언트에서 활용하기 위해서는 이미지 포맷으로 변경하여야 합니다. 또한, SageMaker Endpoint로 Stable Diffusion 이미지 생성을 요청(Request)할 때에는 IAM 인증을 하여야 하므로, 클라이언트는 민감한 정보인 IAM Credential을 가지고 있어야 하고, AWS SDK를 통해 API 요청을 수행하여야 합니다. 따라서 웹브라우저 또는 모바일앱에서는 IAM 인증 기반의 서비스를 제공하기 어렵습니다. 이와 같은 이유로 본 게시글에서는 SageMaker Endpoint에 대한 IAM 인증 및 이미지 파일 변환을 위해 API Gateway와 Lambda를 사용합니다. 

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

전체적인 Architecture는 아래와 같습니다. SageMaker는 JumpStart로 제공되는 Stable Diffusion 모델을 가지고 있어서 입력된 텍스트로 부터 이미지를 생성할 수 있습니다. Lambda는 IAM 인증을 통해 SageMaker Endpoint로 사용자가 전달한 텍스트 정보를 전달하고, 생성된 이미지의 정보를 image map 형태로 얻습니다. 사용자가 쉽게 사용할 수 있도록 image map은 S3에 JPEG 포맷으로 저장되는데, CloudFront 도메인 정보를 활용하여 이미지에 대한 URL을 생성합니다. API Gateway는 사용자의 요청을 Restful API로 받아서 Lambda에 사용자의 요청을 전달하고, Lambda가 생성한 URL 이미지 정보를 사용자에게 응답으로 전달합니다. 전체 서비스들의 배포는 [AWS CDK](https://aws.amazon.com/ko/cdk/)를 이용하고, [docker container 이미지는 ECR](https://docs.aws.amazon.com/ko_kr/AmazonECR/latest/userguide/docker-push-ecr-image.html)로 관리합니다.

<img src="https://user-images.githubusercontent.com/52392004/217674900-3693c261-7f96-42ab-bda7-e40df466b64f.png" width="800">

## SageMaker Endpoint에 대한 추론(Inference) 요청 방법

Lambda에서 Sagemaker Endpoint로 추론(Inference) 요청시에 아래와 같이 "ContentType"과 "Accept"을 지정하여야 합니다. 

```java
"ContentType": "application/json",
"Accept": "application/json",
```

이때 Request의 Body에는 아래 포맷으로 Stable Diffusion에 필요한 정보를 전달합니다. width, height로 이미지의 크기를 지정하는데 8로 나눌 수 있어야 합니다.  num_images_per_prompt은 한번에 생성되는 이미지의 갯수이고, num_inference_steps는 이미지 생성시 [denoising 단계](https://cvpr2022-tutorial-diffusion-models.github.io/)를 의미하는데 숫자를 높이면 더 높은 품질의 이미지를 얻을 수 있습니다. guidance_scale은 prompt에 가까운 정보를 1보다 작은값으로 표현합니다. 

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

SageMaker Endpoint에 query시에 Accept을 "application/json"으로 하는 경우에 RGB로 된 text데이터가 내려옵니다. 이미지 데이터는 JSON의 "Body"와 "generated_image"로 부터 추출한 후에, PIL(Pillow)과 numpy 라이브러리를 사용하여 S3에 저장할수 있는 바이너리 이미지 데이터로 변환합니다. 이때 [lambda_function.py](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/lambda/lambda_function.py)의 코드는 아래와 같습니다. 

```python
from PIL import Image
import numpy as np

def parse_response(query_response):
    """Parse response and return generated image and the prompt"""

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

그런데, Lambda에서 pillow, numpy 라이브러리를 "pip install --target=[lambda 폴더] pillow numpy"와 같이 설치한후 압축해서 올리면 [layer를 추가](https://medium.com/@shimo164/lambda-layer-to-use-numpy-and-pandas-in-aws-lambda-function-8a0e040faa18)하여야 하므로, docker container를 이용하여 pillow, numpy와 같은 라이브러리를 사용할 수 있도록 합니다. 이때의 [Dockerfile](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/lambda/Dockerfile)의 예는 아래와 같습니다.

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

## 인프라 배포

### Stable Diffusion을 위한 SageMaker Endpoint 생성

[Stable Diffusion Endpoint 생성](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/endpoint.md)에 따라 SageMaker JumpStart에서 Stable Diffusion Endpoint 생성합니다. 

### 추론 인프라 구축하기 

추론을 위한 인프라에는 API Gateway, S3, Lambda, CloudFront가 있으며, AWS CDK로 배포합니다. 상세한 배포정보는 [cdk-stable-diffusion-stack.ts](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/cdk-stable-diffusion/lib/cdk-stable-diffusion-stack.ts)을 참조합니다. 인프라 배포를 위해서 아래와 같이 관련 코드를 다운로드 합니다.

```java
git clone https://github.com/kyopark2014/stable-diffusion-api-server
```

인프라 생성시 SageMaker의 Endpoint 정보가 필요하므로, ["cdk-stable-diffusion/lib/cdk-stable-diffusion-stack.ts"](https://github.com/kyopark2014/stable-diffusion-api-server/blob/main/cdk-stable-diffusion/lib/cdk-stable-diffusion-stack.ts)에서 아래와 같이 이전 단계에서 복사한 Endpoint의 이름을 수정합니다. 

![noname](https://user-images.githubusercontent.com/52392004/217753412-0341d237-2219-4157-8b9c-be18371406df.png)

CDK 폴더(cdk-stable-diffusion)로 이동하여 "aws-cdk-lib"와 "path" 라이브러리를 npm으로 설치합니다. 여기서, "aws-cdk-lib"은 CDK 2.0 라이브러리를 의미합니다. 

```java
cdk cdk-stable-diffusion && npm install -g aws-cdk-lib path
```

아래 명령어로 전체 인프라를 설치합니다.

```java
cdk deploy
```

CDK로 인프라 설치가 완료되면 아래와 같이 설치된 인프라의 정보를 알 수 있습니다. "appUrl"은 API Gateway의 Invoke URL로서 클라이언트가 Stable Diffusion을 요청할때 필요합니다. 또한 Text를 이미지로 변환하는 API의 리소스(Resource)가 "text2image"이므로, 전체 URL은 "https://734ury6k98.execute-api.ap-northeast-2.amazonaws.com/dev/text2image" 입니다.

![noname](https://user-images.githubusercontent.com/52392004/217409596-04cdd2bd-1825-4aa4-b08f-7b747c48ff3e.png)


### Curl로 요청할 경우

curl 명령어로 아래와 같이 실행해볼 수 있습니다. 

```java
curl -X POST https://734ury6k98.execute-api.ap-northeast-2.amazonaws.com/dev/text2image -H "Content-Type: application/json" -d '{"text":"astronaut on a horse"}'
```

이때의 결과의 예입니다.

```java
{"statusCode": 200, "body": "https://d283dvdglbetjo.cloudfront.net/img_20230208-014926"}
```

얻어진 이미지의 예입니다. 

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

이후 [Sent]를 하면 아래와 같은 결과를 얻습니다. 

<img src="https://user-images.githubusercontent.com/52392004/217410742-7c3a9020-d62c-4b92-844e-44205c8dd143.png" width="500">

## Examples

- "cottage in impressionist style"

![image](https://user-images.githubusercontent.com/52392004/217554332-8828d9d2-5ba4-4702-926b-32d92f068a47.png)

- "a photo of an astronaut riding a horse on mars"

![image](https://user-images.githubusercontent.com/52392004/217555375-c9fee220-10bd-4b7d-8234-10aa8510599e.png)

- "a little girl standing on the side of a road holding a camera"

![image](https://user-images.githubusercontent.com/52392004/217556247-8f0cdc5d-95a4-465f-88a2-35599375f0d4.png)

- "a giraffe crossing a road next to a car"

![image](https://user-images.githubusercontent.com/52392004/217557158-d1752194-8ba5-43af-89ce-6194c9d563b6.png)

- "a woman sitting on a bed reading a book"

![image](https://user-images.githubusercontent.com/52392004/217557936-81d6467c-705a-4c63-81f9-6076fcd8d463.png)

## Reference

[Generate images from text with the stable diffusion model on Amazon SageMaker JumpStart](https://aws.amazon.com/ko/blogs/machine-learning/generate-images-from-text-with-the-stable-diffusion-model-on-amazon-sagemaker-jumpstart/)

[Running Serverless ML on AWS Lambda](https://betterdev.blog/serverless-ml-on-aws-lambda/)

[Deploy Stable Diffusion Models On Amazon SageMaker Endpoint](https://github.com/aws-samples/deploy-stable-diffusion-model-on-amazon-sagemaker-endpoint)

[Amazon SageMaker JumpStart로 사전 구축된 모델과 기계 학습 솔루션 액세스 단순화](https://aws.amazon.com/ko/blogs/korea/amazon-sagemaker-jumpstart-simplifies-access-to-prebuilt-models-and-machine-learning-models/)

[SageMaker Endpoint (Single Model Endpoint)](https://github.com/aws-samples/aws-ai-ml-workshop-kr/blob/master/sagemaker/sm-special-webinar/lab_2_serving/2.1.Deploy.ipynb)

[Introduction to JumpStart - Text to Image](https://github.com/aws/amazon-sagemaker-examples/blob/main/introduction_to_amazon_algorithms/jumpstart_text_to_image/Amazon_JumpStart_Text_To_Image.ipynb)

[Build and automatize the management of your Sagemaker Studio Users using AWS CDK](https://github.com/aws-samples/aws-cdk-sagemaker-studio)

[Deploying SageMaker Endpoints With CloudFormation](https://towardsdatascience.com/deploying-sagemaker-endpoints-with-cloudformation-b43f7d495640)
