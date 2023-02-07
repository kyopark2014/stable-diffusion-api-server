import json
import boto3
import io
from PIL import Image
import numpy as np

s3 = boto3.client('s3')

# import sagemaker
# sess = sagemaker.Session()
# mybucket = sess.default_bucket()        
def parse_response(query_response):
    """Parse response and return generated image and the prompt"""

    response_dict = json.loads(query_response)
    return response_dict["generated_image"], response_dict["prompt"]

def handler(event, context):
    #body = event['body']
    print(event)
    
    #txt = body['text']

    bucket = 'sagemaker-ap-northeast-2-677146750822'
    endpoint = 'jumpstart-example-infer-model-txt2img-s-2023-02-07-08-03-49-268'
    
    payload = {
        "prompt": "astronaut on a horse",
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
    
    if(statusCode==200):
        response_payload = response['Body'].read().decode("utf-8")
        generated_image, prompt = parse_response(response_payload)

        print(prompt)
        
        img = Image.fromarray(np.uint8(generated_image))
        img.save('c_pil.png')
        
        mybucket = bucket
        mykey = 'output/filename.jpeg'

        # translated image from numpy array
        image = Image.fromarray(np.uint8(img))
            
        buffer = io.BytesIO()
        image.save(buffer, "JPEG")
        buffer.seek(0)
            
        s3.upload_fileobj(buffer, mybucket, mykey, ExtraArgs={ "ContentType": "image/jpeg"})
        
    return {
        'statusCode': statusCode,
        'body': json.dumps('Hello from Lambda!')
    }
