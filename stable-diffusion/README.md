# Stable Diffusion을 위한 Inference API 

추론(Inference)을 적용할때는 Container로 배포하고자 합니다. 먼저, 아래와 같이 Container 이미지를 빌드합니다.

```java
docker build -t dlr:v1 .
```

빌드된 이미지를 확인합니다. 

```java
docker images
```

Docker Container를 실행합니다. 

```java
docker run -d -p 8080:8080 dlr:v1
```

container 정보를 확인합니다. 

```java
docker ps

CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                    NAMES
41e297948511   dlr:v1   "/lambda-entrypoint.…"   6 seconds ago   Up 4 seconds   0.0.0.0:8080->8080/tcp   stupefied_carson
```

Bash shell로 접속합니다.

```java
docker exec -it 41e297948511 /bin/bash
```

아래와 같이 "inference-test.py"을 이용하여 정상적으로 추론이 되는지 확인합니다.

```java
python3 inference-test.py 
```

## Reference 

[Stable Diffusion with Diffusers](https://huggingface.co/blog/stable_diffusion)