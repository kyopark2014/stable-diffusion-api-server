# Stable Diffusion을 위한 Inference API 

추론(Inference)을 적용할때는 Container로 배포하고자 합니다. 먼저, 아래와 같이 Container 이미지를 빌드합니다.

```java
sudo docker build -t stable-diffusion:v1 .
```

빌드된 이미지를 확인합니다. 

```java
sudo docker images

REPOSITORY         TAG       IMAGE ID       CREATED              SIZE
stable-diffusion   v1        b5a0a0e8de6f   About a minute ago   6.03GB
```

Docker Container를 실행합니다. 

```java
sudo docker run -d -p 8080:8080 stable-diffusion:v1
```

container 정보를 확인합니다. 

```java
sudo docker ps

CONTAINER ID   IMAGE                 COMMAND                  CREATED          STATUS          PORTS                                       NAMES
2e53ec832b54   stable-diffusion:v1   "/lambda-entrypoint.…"   12 seconds ago   Up 12 seconds   0.0.0.0:8080->8080/tcp, :::8080->8080/tcp   vibrant_rosalind
```

Bash shell로 접속합니다.

```java
sudo docker exec -it 2e53ec832b54 /bin/bash
```

아래와 같이 "inference-test.py"을 이용하여 정상적으로 추론이 되는지 확인합니다.

```java
python3 inference-test.py 
```

이때 아래와 같이 실행됩니다.

![image](https://user-images.githubusercontent.com/52392004/216750659-cb501716-722f-46a7-9b96-3893c6fc4fdc.png)


## Reference 

[Stable Diffusion with Diffusers](https://huggingface.co/blog/stable_diffusion)
