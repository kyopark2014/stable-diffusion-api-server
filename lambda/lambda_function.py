import json
import boto3
from PIL import Image
import numpy as np
import io

# import sagemaker
# sess = sagemaker.Session()
# mybucket = sess.default_bucket()     
   
def parse_response_multiple_images(query_response):
    """Parse response and return generated image and the prompt"""

    response_dict = json.loads(query_response)
    return response_dict["generated_images"], response_dict["prompt"]
    
def handler(event, context):
    print(event)
        
    body = event['body']
    txt = body['text']
    print(txt)

    bucket = 'sagemaker-ap-northeast-2-677146750822'
    endpoint = 'jumpstart-example-infer-model-txt2img-s-2023-02-07-08-03-49-268'
    mybucket = bucket
    mykey = 'output/filename.jpeg'
    
    payload = {
        # "prompt": "astronaut on a horse",
        "prompt": txt,
        "width": 768,
        "height": 768,
        "num_images_per_prompt": 1,
        "num_inference_steps": 50,
        "guidance_scale": 7.5,
    }
    
    runtime = boto3.Session().client('sagemaker-runtime')
        
    response = runtime.invoke_endpoint(EndpointName=endpoint, ContentType='application/x-text', Accept='application/json', Body=json.dumps(payload))
    print(response)
    
    statusCode = response['ResponseMetadata']['HTTPStatusCode']
    print('statusCode:', json.dumps(statusCode))
    
    s3 = boto3.client('s3')
            
    if(statusCode==200):
        #response_payload = response['Body'].read().decode("utf-8")
        response_payload = response['Body'].read().decode("utf-8")
        generated_images, prompt = parse_response_multiple_images(response_payload)

        print(prompt)
        
        from PIL import Image
        for img in generated_images:
            image1 = Image.fromarray(np.uint8(img))
            
            buffer = io.BytesIO()
            image1.save(buffer, "JPEG")
            buffer.seek(0)
            
            s3.upload_fileobj(buffer, mybucket, "output/filename1.jpeg", ExtraArgs={ "ContentType": "image/jpeg"})

            print('akdkfkdfkdkf\n')
            print(img)

                    
    return {
        'statusCode': statusCode,
        'body': json.dumps('Hello from Lambda!')
    }
