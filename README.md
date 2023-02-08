# Stable Diffusion API Server


[Stable Diffusion](https://aws.amazon.com/ko/blogs/machine-learning/generate-images-from-text-with-the-stable-diffusion-model-on-amazon-sagemaker-jumpstart/)은 Text로 이미지를 창조적으로 생성할 수 있습니다. 여기서는 AWS JumpStart에서 제공하는 Stable Diffusion 2.0을 이용하여 Open API 형태로 서비스할 수 있는 API를 제공하고자 합니다. JumpStart에서 제공하는 Stable Diffusion을 통해 Inference API를 구현하면, SageMaker Endpoint는 IAM 인증을 통해서 요청하고 결과를 얻을수 있습니다. IAM 인증을 위해서는 Client가 IAM Credential을 가지고 인증에 필요한 프로세스를 진행하여야 합니다. 따라서, Endpoint 앞단에 API Gatewaay와 Lambda를 이용하여 Open API를 구현합니다. 또한 아래 설명처럼 Output은 RGB 이미지와 입력된 Prompt에 대한 정보인데, 이를 실제로 사용자가 보기 위해서는 그림파일로 다시 encoding하여야 하며, 압축하면 80KB인 결과를 얻기 위해 1.7MB의 Raw 파일을 다운로드 하여야 합니다. 따라서, Lambda은 SageMaker Endpoint의 응답을 파싱하여 압축파일을 생성하여 S3에 저장하고, 사용자는 Lambda가 전달한 URL을 이용하여 CloudFront를 이용하여 다운로드 합니다. 이렇게 함으로써 사용자는 Stable Diffusion의 결과를 쉽게 볼수 있고, 필요시 해당 URL을 전달함으로써 편리하게 공유 할 수 있습니다. 

이미지를 공유한다면 client에서 RGB로 전달되는 데이터를 파일로 변환하여 다시 업로드를 하여야 하므로, URL로 결과를 얻고자 합니다. 


전체적인 Arhitecture는 아래와 같습니다. 


<img width="666" alt="image" src="https://user-images.githubusercontent.com/52392004/217500391-541b42f3-8dd0-4586-9c01-9dc624d7fae1.png">



## Inference 요청

Lambda에서 Sagemaker Endpoint로 Inference 요청시에 아래와 같이 "ContentType"과 "Accept"을 지정하여야 합니다. 

```java
"ContentType": "application/json",
"Accept": "application/json",
```

이때 Request의 Body에는 아래 포맷으로 Stable Diffusion에 필요한 정보를 전달합니다.

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

## S3로 결과 업로드

### RGB 이미지 데이터를 변환하여 S3에 업로드 하는 경우 

SageMaker Endpoint에 query시에 Accept을 "application/json"으로 하는 경우에 RGB로된 text데이터가 내려옵니다. 아래는 Endpoint에 Query시 응답의 예입니다. 이미지(generated_image)는 RGB의 형태의 배열로 제공되며, 이미지 생성에 사용되었던 prompt를 결과와 함께 전달합니다. 이때 Text 전달되는 RGB 이미지의 크기는 1.7MB인데 jpg로 저장하면 80kb정도의 크기를 가집니다. 

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

 
이미지를 S3에 저장하기 위해서는 PIL(Pillow)와 numpy를 사용하여 image로 변환하여야 합니다. 그런데, Lambda에서 pillow, numpy를 설치하면 에러가 발생하는데, 이는 layer를 추가하거나, docker container를 이용할 수 있습니다. 여기서는 layer를 추가하지 않고 Docker container를 이용하여 pillow, numpy를 사용합니다. 

```java
from PIL import Image
import numpy as np

response = runtime.invoke_endpoint(EndpointName=endpoint, ContentType='application/x-text', Accept='application/json;jpeg', Body=json.dumps(payload))

s3 = boto3.client('s3')
image = Image.fromarray(np.uint8(generated_image))

buffer = io.BytesIO()
image.save(buffer, "jpeg")
buffer.seek(0)
            
s3.upload_fileobj(buffer, mybucket, mykey, ExtraArgs={ "ContentType": "image/jpeg"})
```

### JPEG로 encoding된 이미지를 S3에 업로드 하는 경우 

Accept헤더를 "application/json;jpeg"로 설정하면 SageMaker Endpoint가 base64로 encoding된 응답을 전달합니다.

```java
response = runtime.invoke_endpoint(EndpointName=endpoint, ContentType='application/x-text', Accept='application/json;jpeg', Body=json.dumps(payload))
```

이때 base64 decoding후 bite로 변환한후에 아래처럼 S3로 바로 업로드 할 수 있어서, pillow, numpy 없이 구현할 수 있습니다. 

```java
response_payload = response['Body'].read()
generated_image, prompt = parse_response(response_payload)

import base64
img_str = base64.b64decode(generated_image)

image = io.BytesIO(img_str) 
s3.upload_fileobj(image, mybucket, mykey, ExtraArgs={ "ContentType": "image/jpeg"})
```


## Output 

### URL 확인

URL은 CDK 실행화면에서 아래와 같이 확인할 수 있습니다. URL에 api이름인 "text2image"을 추가합니다.

![noname](https://user-images.githubusercontent.com/52392004/217409596-04cdd2bd-1825-4aa4-b08f-7b747c48ff3e.png)

### Curl로 실행할 경우

curl 명령어로 아래와 같이 실행해볼 수 있습니다. 

```java
curl -X POST https://734ury6k98.execute-api.ap-northeast-2.amazonaws.com/dev/text2image -H "Content-Type: application/json" -d '{"text":"astronaut on a horse"}'
```

이때의 결과의 예입니다.

```java
{"statusCode": 200, "body": "https://d283dvdglbetjo.cloudfront.net/img_20230208-014926"}
```

얻어진 이미지의 예입니다. 

<img src="https://user-images.githubusercontent.com/52392004/217041497-6c2f906d-feb0-4bbc-b2e0-9daf97cf0bc8.jpeg" width="400">

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




## Reference

[Generate images from text with the stable diffusion model on Amazon SageMaker JumpStart](https://aws.amazon.com/ko/blogs/machine-learning/generate-images-from-text-with-the-stable-diffusion-model-on-amazon-sagemaker-jumpstart/)

[Running Serverless ML on AWS Lambda](https://betterdev.blog/serverless-ml-on-aws-lambda/)

[Deploy Stable Diffusion Models On Amazon SageMaker Endpoint](https://github.com/aws-samples/deploy-stable-diffusion-model-on-amazon-sagemaker-endpoint)

[Amazon SageMaker JumpStart로 사전 구축된 모델과 기계 학습 솔루션 액세스 단순화](https://aws.amazon.com/ko/blogs/korea/amazon-sagemaker-jumpstart-simplifies-access-to-prebuilt-models-and-machine-learning-models/)

[SageMaker Endpoint (Single Model Endpoint)](https://github.com/aws-samples/aws-ai-ml-workshop-kr/blob/master/sagemaker/sm-special-webinar/lab_2_serving/2.1.Deploy.ipynb)

[Introduction to JumpStart - Text to Image](https://github.com/aws/amazon-sagemaker-examples/blob/main/introduction_to_amazon_algorithms/jumpstart_text_to_image/Amazon_JumpStart_Text_To_Image.ipynb)

[Build and automatize the management of your Sagemaker Studio Users using AWS CDK](https://github.com/aws-samples/aws-cdk-sagemaker-studio)

[Deploying SageMaker Endpoints With CloudFormation](https://towardsdatascience.com/deploying-sagemaker-endpoints-with-cloudformation-b43f7d495640)
