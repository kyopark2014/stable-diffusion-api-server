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


wget 설치 

```java
yum install wget -y
```

[CUDA 설치](https://developer.nvidia.com/cuda-downloads?target_os=Linux&target_arch=x86_64&Distribution=CentOS&target_version=7&target_type=rpm_local)

![image](https://user-images.githubusercontent.com/52392004/216796420-6bc25578-56a2-40ec-b267-30662550506d.png)

```java
wget https://developer.download.nvidia.com/compute/cuda/12.0.1/local_installers/cuda-repo-rhel7-12-0-local-12.0.1_525.85.12-1.x86_64.rpm
rpm -i cuda-repo-rhel7-12-0-local-12.0.1_525.85.12-1.x86_64.rpm
yum clean all
yum -y install nvidia-driver-latest-dkms
yum -y install cuda
```

Lambda로 API서버 생성시 아래와 같이 실패하고 있습니다. (검토중)

```java
[ERROR] OSError: Can't load config for 'runwayml/stable-diffusion-v1-5'. If you were trying to load it from 'https://huggingface.co/models', make sure you don't have a local directory with the same name. Otherwise, make sure 'runwayml/stable-diffusion-v1-5' is the correct path to a directory containing a model_index.json file
Traceback (most recent call last):
  File "/var/task/inference.py", line 40, in handler
    result = ImageGenerator(txt_data)
  File "/var/task/inference.py", line 21, in ImageGenerator
    pipe = StableDiffusionPipeline.from_pretrained(model_id)
  File "/var/lang/lib/python3.8/site-packages/diffusers/pipelines/pipeline_utils.py", line 462, in from_pretrained
    config_dict = cls.load_config(
  File "/var/lang/lib/python3.8/site-packages/diffusers/configuration_utils.py", line 371, in load_config
    raise EnvironmentError(
```    



## Reference 

[Stable Diffusion with Diffusers](https://huggingface.co/blog/stable_diffusion)
