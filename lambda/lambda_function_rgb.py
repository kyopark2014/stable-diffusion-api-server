import json
import boto3
from PIL import Image
import numpy as np
import io
import os
from PIL import Image
import time

def parse_response(query_response):
    """Parse response and return generated image and the prompt"""

    response_dict = json.loads(query_response)
    return response_dict["generated_image"], response_dict["prompt"]
    
def handler(event, context):
    print(event)
        
    body = event['body']
    txt = body['text']
    print("txt: ", txt)

    mybucket = os.environ.get('bucket')
    print("bucket: ", mybucket)
    
    endpoint = os.environ.get('endpoint')
    print("endpoint: ", endpoint)
    
    mykey = 'output/img_'+time.strftime("%Y%m%d-%H%M%S")
    print('mykey: ', mykey)
    
    runtime = boto3.Session().client('sagemaker-runtime')
        
    payload = {
        "prompt": txt,
        #"width": 768,
        #"height": 768,
        "width": 100,
        "height": 100,
        "num_images_per_prompt": 1,
        "num_inference_steps": 50,
        "guidance_scale": 7.5
    }

    response = runtime.invoke_endpoint(EndpointName=endpoint, ContentType='application/x-text', Accept='application/json;jpeg', Body=json.dumps(payload))
    print(response)
    
    statusCode = response['ResponseMetadata']['HTTPStatusCode']
    print('statusCode:', json.dumps(statusCode))
    
    s3 = boto3.client('s3')
            
    if(statusCode==200):
        response_payload = response['Body'].read().decode('utf-8')
        generated_image, prompt = parse_response(response_payload)

        print(response_payload)
        #print(generated_image)
        print(prompt)
        
        image = Image.fromarray(np.uint8(generated_image))
            
        buffer = io.BytesIO()
        image.save(buffer, "jpeg")
        buffer.seek(0)
            
        s3.upload_fileobj(buffer, mybucket, mykey, ExtraArgs={"ContentType": "image/jpeg"})
                    
    return {
        'statusCode': statusCode,
        'body': json.dumps('Hello from Lambda!')
    }
