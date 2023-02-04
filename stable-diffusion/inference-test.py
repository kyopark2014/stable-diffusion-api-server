import traceback
from logging import INFO, DEBUG, StreamHandler, getLogger
from inference import handler   

logger = getLogger()
logger.setLevel(INFO)

def StableDiffusion(txt_data, fname):
    event = {
        'body': txt_data,
        'fname': fname
    }

    try:
        result = handler(event,"")          
        return result
    except:
        traceback.print_exc()
        
def main():
    prompt = 'a photo of an astronaut riding a horse on mars'
    fname =  'astronaut_rides_horse.png'
    logger.debug('text: %s', prompt)

    print("text: "+ prompt)

    result = StableDiffusion(prompt, fname)
    logger.debug('url: %s', result['body'])
    
    print("url: "+ result['body'])
        
if __name__ == '__main__':
    main()