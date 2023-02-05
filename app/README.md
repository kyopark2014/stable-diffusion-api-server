# Inference Application

```java
sudo docker build -t app:v1 .

sudo docker run -v $HOME/logs:/tmp/log -d -p 8080:8080 --name StableDiffusion app:v1

sudo docker run -v $HOME/logs:/tmp/log -d -p 8080:8080  app:v1

curl -i http://localhost:8080/text -H "text:hello world" 

sudo docker kill StableDiffusion
sudo docker rm -f StableDiffusion

sudo docker exec -it 2e53ec832b54 /bin/bash
```
