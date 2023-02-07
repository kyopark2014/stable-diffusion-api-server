# Stable Diffusion API Server


[Stable Diffusion](https://aws.amazon.com/ko/blogs/machine-learning/generate-images-from-text-with-the-stable-diffusion-model-on-amazon-sagemaker-jumpstart/)은 Text로 이미지를 창조적으로 생성할 수 있습니다. 여기서는 AWS JumpStart에서 제공하는 Stable Diffusion 2.0을 이용하여 Open API 형태로 서비스할 수 있는 API를 제공하고자 합니다. JumpStart에서 제공하는 Stable Diffusion을 통해 Inference API를 구현하면, SageMaker Endpoint는 IAM 인증을 통해서 요청하고 결과를 얻을수 있습니다. IAM 인증을 위해서는 Client가 IAM Credential을 가지고 인증에 필요한 프로세스를 진행하여야 합니다. 따라서, Endpoint 앞단에 API Gatewaay와 Lambda를 이용하여 Open API를 구현합니다. 또한 아래 설명처럼 Output은 RGB 이미지와 입력된 Prompt에 대한 정보인데, 이를 실제로 사용자가 보기 위해서는 그림파일로 다시 encoding하여야 하며, 압축하면 80KB인 결과를 얻기 위해 1.7MB의 Raw 파일을 다운로드 하여야 합니다. 따라서, Lambda은 SageMaker Endpoint의 응답을 파싱하여 압축파일을 생성하여 S3에 저장하고, 사용자는 Lambda가 전달한 URL을 이용하여 CloudFront를 이용하여 다운로드 합니다. 이렇게 함으로써 사용자는 Stable Diffusion의 결과를 쉽게 볼수 있고, 필요시 해당 URL을 전달함으로써 편리하게 공유 할 수 있습니다. 

전체적인 Arhitecture는 아래와 같습니다. 

![image](https://user-images.githubusercontent.com/52392004/217037303-23955722-0a1b-4710-b5cc-ffaf2ee8fe48.png)




## Open API를 제공할때 JumpStart에서 제공하는 Stable Diffusion API의 문제점

SageMaker의 JumpStart에서 제공하는 모델을 이용해 Enpoint를 구현하였을 경우에 Output의 형태는 아래와 같습니다. 이미지(generated_image)는 RGB의 형태의 배열로 제공되며, 이미지 생성에 사용되었던 prompt를 결과와 함께 전달합니다. 
이미지는 압축되지 않고 전달되어 그림 사이즈는 1.7MB로 전달되는데 이를 압축하여 jpeg로 저장할 경우에 크기는 80KB로 줄어서 전송할 수 있습니다. 또한 해당 이미지를 공유한다면 client에서 RGB로 전달되는 데이터를 파일로 변환하여 다시 업로드를 하여야 하므로, URL로 결과를 얻고자 합니다. 



또한, Text를 포함한 요청에 대한 응답은 RGB 이미지와 요청한 Prompt입니다. 


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

## Output 

<img src="https://user-images.githubusercontent.com/52392004/217041497-6c2f906d-feb0-4bbc-b2e0-9daf97cf0bc8.jpeg" width="400">

## Troubleshooting

SageMaker Endpoint에 query시에 Accpet을 "application/json"으로 하는 경우에 RGB로된 text데이터가 내려옵니다. 이 경우에 PIL(Pillow)와 numpy를 사용하여 image로 변환하여야 S3에 업로드가 가능한데, Lambda에서 pillow, numpy사용시에 layer를 추가하여야 하는 문제가 있습니다.

따라서 아래와 같이 ""application/json;jpeg"를 주면 jpeg로 encoding된 응답을 받습니다.

```java
response = runtime.invoke_endpoint(EndpointName=endpoint, ContentType='application/x-text', Accept='application/json;jpeg', Body=json.dumps(payload))
```

이때 아래와 같이 base64 decoding후 S3로 업로드 할 수 있습니다.

```java
response_payload = response['Body'].read()
generated_image, prompt = parse_response(response_payload)

import base64
img_str = base64.b64decode(generated_image)

image = io.BytesIO(img_str) 
s3.upload_fileobj(image, mybucket, mykey, ExtraArgs={ "ContentType": "image/jpeg"})
```

## Reference

[Generate images from text with the stable diffusion model on Amazon SageMaker JumpStart](https://aws.amazon.com/ko/blogs/machine-learning/generate-images-from-text-with-the-stable-diffusion-model-on-amazon-sagemaker-jumpstart/)

[Running Serverless ML on AWS Lambda](https://betterdev.blog/serverless-ml-on-aws-lambda/)

[Deploy Stable Diffusion Models On Amazon SageMaker Endpoint](https://github.com/aws-samples/deploy-stable-diffusion-model-on-amazon-sagemaker-endpoint)

[Amazon SageMaker JumpStart로 사전 구축된 모델과 기계 학습 솔루션 액세스 단순화](https://aws.amazon.com/ko/blogs/korea/amazon-sagemaker-jumpstart-simplifies-access-to-prebuilt-models-and-machine-learning-models/)

[SageMaker Endpoint (Single Model Endpoint)](https://github.com/aws-samples/aws-ai-ml-workshop-kr/blob/master/sagemaker/sm-special-webinar/lab_2_serving/2.1.Deploy.ipynb)

[Introduction to JumpStart - Text to Image](https://github.com/aws/amazon-sagemaker-examples/blob/main/introduction_to_amazon_algorithms/jumpstart_text_to_image/Amazon_JumpStart_Text_To_Image.ipynb)

[Build and automatize the management of your Sagemaker Studio Users using AWS CDK](https://github.com/aws-samples/aws-cdk-sagemaker-studio)
