from diffusers import StableDiffusionPipeline
import torch

def text2image(device):
    model_id = "runwayml/stable-diffusion-v1-5"
    
    if device == "cuda":
        pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
    else:
        pipe = StableDiffusionPipeline.from_pretrained(model_id)

    pipe = pipe.to(device)

    prompt = "a photo of an astronaut riding a horse on mars"
    image = pipe(prompt).images[0]  
        
    image.save("astronaut_rides_horse.png")

def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print("device: "+ device)

    text2image(device)

if __name__ == '__main__':
    main()