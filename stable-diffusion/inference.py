from logging import INFO, DEBUG, StreamHandler, getLogger
from sys import stdout
# from os import path
from diffusers import StableDiffusionPipeline
import torch

logger = getLogger()
logger.setLevel(INFO)
logging_handler = StreamHandler(stdout)
logger.addHandler(logging_handler)

device = "cuda" if torch.cuda.is_available() else "cpu"
logger.debug('device: %s', device)

def ImageGenerator(prompt):
    model_id = "runwayml/stable-diffusion-v1-5"
    pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
    pipe = pipe.to(device)

    # prompt = "a photo of an astronaut riding a horse on mars"    
    # image = pipe(prompt, height=512, width=768).images[0]
    image = pipe(prompt).images[0]  

    return image

def handler(event, context):
    logger.debug('event: %s', event)

    txt_data = event['body']
    filename = event['fname']
    if filename is None:
        filename = "cimage.png"

    if txt_data is not None:
        result = ImageGenerator(txt_data)
        
        result.save(filename)
        logger.debug('result: %s', result)
        
        return {
            'statusCode': 200,
            'body': filename
        }   
    else:
        logger.error("Unable to load text")

        return {
            'statusCode': 500,
            'body': 'Unavailable'
        }  