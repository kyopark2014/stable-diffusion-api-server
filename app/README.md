# Inference Application

```java
sudo docker build -t app:v1 .

sudo docker run -v $HOME/logs:/tmp/log -d -p 8080:8080 --name StableDiffusion app:v1

sudo docker ps

sudo docker exec -it 2e53ec832b54 /bin/bash

curl -i http://localhost:8080/text -H ‘text:hello world’ 
```
