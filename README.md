# Stable Diffusion API Server

여기에서는 [Stable Diffusion](https://aws.amazon.com/ko/blogs/machine-learning/generate-images-from-text-with-the-stable-diffusion-model-on-amazon-sagemaker-jumpstart/)을 제공하는 API Server를 만드는 방법에 대해 설명합니다. [Stable Diffusion Model](https://github.com/kyopark2014/stable-diffusion-model)와 같이 Hugging Face의 모델을 GPU를 가진 Cloud9으로 개발 및 테스트를 한 후에 실제 API를 이용해 Stable Diffusion을 구현합니다.  

전체적인 Arhitecture는 아래와 같습니다. 

![image](https://user-images.githubusercontent.com/52392004/217037303-23955722-0a1b-4710-b5cc-ffaf2ee8fe48.png)

Stable Diffusion을 제공하는 API는 Open API를 구현하고자 하나, SageMaker Endpoint는 IAM 인증을 통해서 결과를 얻어 올수 있습니다. 따라서, 아래와 같이 API Gateway와 Lambda를 이용하여 Open API를 제공하고자 합니다. 또한 아래 설명한것처럼 Output으로 전달되는 RGB 이미지를 압축한 파일인 jpeg로 변환하여 CloudFront를 통해 제공하므로써, Stable Diffusion으로 생성된 이미지를 쉽게 공유할수 있도록 합니다. 



## Stable Diffusion Output

SageMaker의 JumpStart에서 제공하는 모델을 이용해 Enpoint를 구현하였을 경우에 Output의 형태는 아래와 같습니다. 이미지(generated_image)는 RGB의 형태의 배열로 제공되며, 이미지 생성에 사용되었던 prompt를 결과와 함께 전달합니다. 
이미지는 압축되지 않고 전달되어 그림 사이즈는 1.7MB로 전달되는데 이를 압축하여 jpeg로 저장할 경우에 크기는 80KB로 줄어서 전송할 수 있습니다. 또한 해당 이미지를 공유한다면 client에서 RGB로 전달되는 데이터를 파일로 변환하여 다시 업로드를 하여야 하므로, URL로 결과를 얻고자 합니다. 

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

이때 Body는 아래의 포맷을 사용합니다.

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

## Inference 요청

Lambda에서 Sagemaker Endpoint로 Inference 요청시에 아래와 같이 "ContentType"과 "Accept"을 지정하여야 합니다. 

```java
"ContentType": "application/json",
"Accept": "application/json",
```

## Output 

<img src="https://user-images.githubusercontent.com/52392004/217041497-6c2f906d-feb0-4bbc-b2e0-9daf97cf0bc8.jpeg" width="400">


## Reference

[Generate images from text with the stable diffusion model on Amazon SageMaker JumpStart](https://aws.amazon.com/ko/blogs/machine-learning/generate-images-from-text-with-the-stable-diffusion-model-on-amazon-sagemaker-jumpstart/)

[Running Serverless ML on AWS Lambda](https://betterdev.blog/serverless-ml-on-aws-lambda/)

[Deploy Stable Diffusion Models On Amazon SageMaker Endpoint](https://github.com/aws-samples/deploy-stable-diffusion-model-on-amazon-sagemaker-endpoint)

[Amazon SageMaker JumpStart로 사전 구축된 모델과 기계 학습 솔루션 액세스 단순화](https://aws.amazon.com/ko/blogs/korea/amazon-sagemaker-jumpstart-simplifies-access-to-prebuilt-models-and-machine-learning-models/)

[SageMaker Endpoint (Single Model Endpoint)](https://github.com/aws-samples/aws-ai-ml-workshop-kr/blob/master/sagemaker/sm-special-webinar/lab_2_serving/2.1.Deploy.ipynb)

[Introduction to JumpStart - Text to Image](https://github.com/aws/amazon-sagemaker-examples/blob/main/introduction_to_amazon_algorithms/jumpstart_text_to_image/Amazon_JumpStart_Text_To_Image.ipynb)

[Build and automatize the management of your Sagemaker Studio Users using AWS CDK](https://github.com/aws-samples/aws-cdk-sagemaker-studio)
