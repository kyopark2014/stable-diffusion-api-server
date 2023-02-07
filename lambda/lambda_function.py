import json
import boto3
from PIL import Image
import numpy as np
import io
import os
from PIL import Image

# import sagemaker
# sess = sagemaker.Session()
# mybucket = sess.default_bucket()     
   
def parse_response(query_response):
    """Parse response and return generated image and the prompt"""

    response_dict = json.loads(query_response)
    return response_dict["generated_image"], response_dict["prompt"]
    
def handler(event, context):
    print(event)
        
    body = event['body']
    txt = body['text']
    print(txt)

    myenvbucket = os.environ.get('myenvbucket')
    print(myenvbucket)


    bucket = 'sagemaker-ap-northeast-2-677146750822'
    endpoint = 'jumpstart-example-infer-model-txt2img-s-2023-02-07-08-03-49-268'
    mybucket = bucket
    mykey = 'output/filename.jpeg'
    
    runtime = boto3.Session().client('sagemaker-runtime')
        
    payload = {
        # "prompt": "astronaut on a horse",
        "prompt": txt,
        "width": 768,
        "height": 768,
        "num_images_per_prompt": 1,
        "num_inference_steps": 50,
        "guidance_scale": 7.5
    }

    response = runtime.invoke_endpoint(EndpointName=endpoint, ContentType='application/x-text', Accept='application/json', Body=json.dumps(payload))
    print(response)
    
    statusCode = response['ResponseMetadata']['HTTPStatusCode']
    print('statusCode:', json.dumps(statusCode))
    
    s3 = boto3.client('s3')
            
    if(statusCode==200):
        response_payload = response['Body'].read()
        generated_image, prompt = parse_response(response_payload)

        print(response_payload)
        #print(generated_image)
        print(prompt)
        
        image = Image.fromarray(np.uint8(generated_image))
            
        buffer = io.BytesIO()
        image.save(buffer, "jpeg")
        buffer.seek(0)
            
        s3.upload_fileobj(buffer, mybucket, mykey, ExtraArgs={ "ContentType": "image/jpeg"})

        
                    
    return {
        'statusCode': statusCode,
        'body': json.dumps('Hello from Lambda!')
    }
