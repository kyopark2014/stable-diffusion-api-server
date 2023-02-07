import json
import boto3
from PIL import Image
import numpy as np
import io
import os
from PIL import Image
import time

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
    print("text: ", txt)

    #endpoint = 'jumpstart-example-infer-model-txt2img-s-2023-02-07-08-03-49-268'
    endpoint = os.environ.get('endpoint')
    print("endpoint: ", endpoint)

    #mybucket = 'sagemaker-ap-northeast-2-677146750822'
    mybucket = os.environ.get('bucket')
    print("bucket: ", mybucket)

    #mykey = 'output/filename.jpeg'
    mykey = 'output/img_'+time.strftime("%Y%m%d-%H%M%S")  # output/img_20230207-152043
    print('key: ', mykey)
    
    runtime = boto3.Session().client('sagemaker-runtime')
        
    payload = {
        # "prompt": "astronaut on a horse",
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

    #with open(image_name, 'wb') as f:
    #for chunk in r.iter_content():
    #    f.write(chunk)
            
    if(statusCode==200):
        response_payload = response['Body'].read()
        generated_image, prompt = parse_response(response_payload)

        print(response_payload)
        #print(generated_image)
        print(prompt)
        
        #image = Image.fromarray(np.uint8(generated_image))
        #image = Image.frombuffer("L", (100,100), generated_image) (x)
        #image = Image.frombytes("L", (100,100), generated_image) (x)
        #image = Image.fromqimage("L", (100,100), generated_image)
        #image = Image.fromqpixmap

        #s3.upload_fileobj(image, mybucket, mykey, ExtraArgs={ "ContentType": "image/jpeg"})
            
        #buffer = io.BytesIO()
        #image.save(buffer, format="jpeg")
        #buffer.seek(0)
        #image = generated_image.convert('RGB')


        ## cases 
        #image = io.BytesIO(generated_image) # TypeError: a bytes-like object is required, not 'str'

        #generated_image.save(buffer, format="jpeg") # AttributeError: 'str' object has no attribute 'save'

        import base64
        msg = base64.b64decode(generated_image)
        image = io.BytesIO(msg) 

        buffer = io.BytesIO()
        generated_image.save(buffer, format="jpeg")
        buffer.seek(0)
            
        s3.upload_fileobj(image, mybucket, mykey, ExtraArgs={ "ContentType": "image/jpeg"})
                    
    return {
        'statusCode': statusCode,
        'body': json.dumps('Hello from Lambda!')
    }
