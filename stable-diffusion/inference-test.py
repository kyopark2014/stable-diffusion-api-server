import traceback
from inference import handler   
import torch

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
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print("device: "+ device)

    # prompt = 'a photo of an astronaut riding a horse on mars'
    # prompt = 'a little girl standing on the side of a road holding a camera'
    # prompt = 'a giraffe crossing a road next to a car'
    prompt = 'a woman sitting on a bed reading a book'

    fname =  'astronaut_rides_horse.png'
    print("text: "+ prompt)

    result = StableDiffusion(prompt, fname)   
    print("url: "+ result['body'])
        
if __name__ == '__main__':
    main()