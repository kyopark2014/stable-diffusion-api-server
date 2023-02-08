import json
import boto3
import io
import os
import time
import base64

s3 = boto3.client('s3')

def parse_response(query_response):
    """Parse response and return generated image and the prompt"""

    response_dict = json.loads(query_response)
    return response_dict["generated_image"], response_dict["prompt"]
    
def lambda_handler(event, context):
    print(event)

    # txt = "astronaut on a horse",        
    txt = event['text']
    print("text: ", txt)

    #endpoint = 'jumpstart-example-infer-model-txt2img-s-2023-02-07-08-03-49-268'
    endpoint = os.environ.get('endpoint')
    print("endpoint: ", endpoint)

    #mybucket = 'sagemaker-ap-northeast-2-677146750822'
    mybucket = os.environ.get('bucket')
    print("bucket: ", mybucket)

    #mykey = 'output/filename.jpeg'
    mykey = 'img_'+time.strftime("%Y%m%d-%H%M%S")  # output/img_20230207-152043
    print('key: ', mykey)

    #url
    domain = os.environ.get('domain')
    url = "https://"+domain+'/'+mykey
    print("url: ", url)
            
    payload = {        
        "prompt": txt,
        #"width": 768,
        #"height": 768,
        "width": 512,
        "height": 512,
        "num_images_per_prompt": 1,
        "num_inference_steps": 50,
        "guidance_scale": 7.5
    }

    runtime = boto3.Session().client('sagemaker-runtime')
    response = runtime.invoke_endpoint(EndpointName=endpoint, ContentType='application/x-text', Accept='application/json;jpeg', Body=json.dumps(payload))
    
    statusCode = response['ResponseMetadata']['HTTPStatusCode']
    print('statusCode:', json.dumps(statusCode))
    
    if(statusCode==200):
        response_payload = response['Body'].read()
        generated_image, prompt = parse_response(response_payload)

        print(response_payload)
        #print(generated_image)
        print(prompt)
        
        img_str = base64.b64decode(generated_image)
        buffer = io.BytesIO(img_str) 

        s3.upload_fileobj(buffer, mybucket, mykey, ExtraArgs={ "ContentType": "image/jpeg"})
                    
    return {
        'statusCode': statusCode,
        'body': url
    }
